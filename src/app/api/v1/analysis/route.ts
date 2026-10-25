import { db } from "@/db";
import { analyses, candidateSites } from "@/db/schema";
import { validateRegionGeojson } from "@/lib/geo";
import { runAnalysis } from "@/lib/analysis-engine";
import type { EnergyType } from "@/lib/types";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";

const schema = z.object({
  projectId: z.string().uuid().optional(),
  energyType: z.enum(["solar", "wind", "geothermal", "hydro"]),
  regionGeojson: z.record(z.string(), z.unknown()),
  params: z
    .object({
      minSuitability: z.number().min(0).max(100).optional(),
      protectedMaskSensitivity: z.number().min(0).max(1).optional(),
      cellSizeKm: z.number().min(3).max(30).optional(),
    })
    .optional(),
});

export async function GET() {
  const rows = await db.select().from(analyses).orderBy(desc(analyses.createdAt));
  return Response.json({ analyses: rows });
}

export async function POST(req: Request) {
  let createdId: string | null = null;

  try {
    const body = await req.json();
    const parsed = schema.parse(body);

    const validation = validateRegionGeojson(parsed.regionGeojson);
    if (!validation.ok) {
      return Response.json({ error: validation.reason }, { status: 400 });
    }

    const [created] = await db
      .insert(analyses)
      .values({
        projectId: parsed.projectId,
        energyType: parsed.energyType,
        status: "Fetching Data",
        regionGeojson: parsed.regionGeojson,
        centroidLat: validation.centroid.lat,
        centroidLng: validation.centroid.lng,
        inputParams: parsed.params ?? {},
        metrics: { stage: "queued" },
        results: {},
      })
      .returning();

    createdId = created.id;

    await db
      .update(analyses)
      .set({ status: "Preprocessing", updatedAt: new Date(), metrics: { stage: "preprocessing" } })
      .where(eq(analyses.id, created.id));

    await db
      .update(analyses)
      .set({ status: "Running Models", updatedAt: new Date(), metrics: { stage: "running-models" } })
      .where(eq(analyses.id, created.id));

    const execution = await runAnalysis({
      energyType: parsed.energyType as EnergyType,
      region: validation.feature,
      params: parsed.params ?? {},
    });

    await db
      .update(analyses)
      .set({
        status: "Generating Spatial Results",
        updatedAt: new Date(),
        metrics: {
          ...execution.metrics,
          stage: "generating-results",
        },
      })
      .where(eq(analyses.id, created.id));

    if (execution.candidates.length) {
      await db.insert(candidateSites).values(
        execution.candidates.map((site) => ({
          analysisId: created.id,
          siteId: site.siteId,
          energyType: parsed.energyType,
          lat: site.lat,
          lng: site.lng,
          areaKm2: site.areaKm2,
          suitability: site.suitability,
          confidence: site.confidence,
          boundaryGeojson: site.boundaryGeojson as unknown as Record<string, unknown>,
          indicators: site.indicators as Record<string, unknown>,
          limitations: site.limitations,
        })),
      );
    }

    await db
      .update(analyses)
      .set({
        status: "Completed",
        centroidLat: execution.centroid.lat,
        centroidLng: execution.centroid.lng,
        metrics: {
          ...execution.metrics,
          stage: "completed",
        },
        results: {
          dataSummary: execution.data,
          layerGeojson: execution.layerGeojson,
          assumptions: {
            note: "Deterministic baseline suitability used. ML model inference available only with validated training datasets.",
          },
        },
        updatedAt: new Date(),
      })
      .where(eq(analyses.id, created.id));

    const [completed] = await db.select().from(analyses).where(eq(analyses.id, created.id));
    return Response.json({ job: completed }, { status: 201 });
  } catch (error) {
    if (createdId) {
      await db
        .update(analyses)
        .set({
          status: "Failed",
          updatedAt: new Date(),
          metrics: {
            stage: "failed",
            reason: String(error),
          },
        })
        .where(eq(analyses.id, createdId));
    }

    return Response.json({ error: "Analysis failed", detail: String(error) }, { status: 400 });
  }
}
