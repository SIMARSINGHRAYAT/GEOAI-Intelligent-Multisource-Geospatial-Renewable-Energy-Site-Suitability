import { runAnalysis } from "@/lib/analysis-engine";
import { validateRegionGeojson } from "@/lib/geo";
import type { EnergyType } from "@/lib/types";
import { z } from "zod";

const schema = z.object({
  regionGeojson: z.record(z.string(), z.unknown()),
  params: z
    .object({
      minSuitability: z.number().min(0).max(100).optional(),
      cellSizeKm: z.number().min(3).max(30).optional(),
    })
    .optional(),
});

const energies: EnergyType[] = ["solar", "wind", "geothermal", "hydro"];

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = schema.parse(body);

    const validation = validateRegionGeojson(parsed.regionGeojson);
    if (!validation.ok) {
      return Response.json({ error: validation.reason }, { status: 400 });
    }

    const results = await Promise.all(
      energies.map(async (energy) => {
        const run = await runAnalysis({
          energyType: energy,
          region: validation.feature,
          params: parsed.params ?? {},
        });

        return {
          energy,
          averageSuitability: run.metrics.averageSuitability,
          candidateCount: run.metrics.candidateCount,
          analyzedCells: run.metrics.analyzedCells,
          confidenceMedian: run.layerGeojson.features.length
            ? Number(
                (
                  run.layerGeojson.features.reduce(
                    (sum, f) => sum + Number((f.properties?.confidence as number | undefined) ?? 0),
                    0,
                  ) / run.layerGeojson.features.length
                ).toFixed(2),
              )
            : 0,
          dataSummary: run.data,
        };
      }),
    );

    return Response.json({
      centroid: validation.centroid,
      areaKm2: validation.areaKm2,
      comparisons: results,
    });
  } catch (error) {
    return Response.json({ error: "Comparison failed", detail: String(error) }, { status: 400 });
  }
}
