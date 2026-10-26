import { storage } from "@/lib/storage";
import { z } from "zod";

export const dynamic = "force-dynamic";

const schema = z.object({
  analysisId: z.string(),
  scenarios: z.array(
    z.object({
      name: z.string().min(2),
      threshold: z.number().min(0).max(100),
      resourcePriority: z.number().min(0).max(1),
      infrastructurePriority: z.number().min(0).max(1),
      environmentalPriority: z.number().min(0).max(1),
    }),
  ),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = schema.parse(body);

    const analysis = await storage.getAnalysisById(parsed.analysisId);
    if (!analysis) return Response.json({ error: "Analysis not found" }, { status: 404 });

    const layer = (analysis.results as { layerGeojson?: { features?: Array<{ properties?: { suitability?: number } }> } })
      ?.layerGeojson;

    const suitability = layer?.features?.map((f) => f.properties?.suitability ?? 0) ?? [];

    const comparisons = parsed.scenarios.map((s) => {
      const adjusted = suitability.map((score) =>
        Math.max(
          0,
          Math.min(
            100,
            score * (0.6 + s.resourcePriority * 0.4) +
              (s.infrastructurePriority - s.environmentalPriority) * 10,
          ),
        ),
      );

      const passed = adjusted.filter((v) => v >= s.threshold).length;
      const avg = adjusted.reduce((a, b) => a + b, 0) / Math.max(1, adjusted.length);

      return {
        scenario: s.name,
        threshold: s.threshold,
        averageSuitability: Number(avg.toFixed(2)),
        candidateCells: passed,
      };
    });

    return Response.json({ analysisId: parsed.analysisId, comparisons });
  } catch (error) {
    return Response.json({ error: "Invalid scenario request", detail: String(error) }, { status: 400 });
  }
}
