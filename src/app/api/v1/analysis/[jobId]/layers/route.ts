import { storage } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const { jobId } = await params;
  const row = await storage.getAnalysisById(jobId);
  if (!row) return Response.json({ error: "Analysis not found" }, { status: 404 });

  const results = row.results as {
    layerGeojson?: Record<string, unknown>;
  };

  return Response.json({
    jobId,
    energyType: row.energyType,
    layer: results.layerGeojson ?? null,
  });
}
