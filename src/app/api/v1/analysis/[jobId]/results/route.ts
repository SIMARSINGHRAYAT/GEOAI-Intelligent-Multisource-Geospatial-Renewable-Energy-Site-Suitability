import { storage } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const { jobId } = await params;
  const row = await storage.getAnalysisById(jobId);
  if (!row) return Response.json({ error: "Analysis not found" }, { status: 404 });

  return Response.json({
    jobId,
    energyType: row.energyType,
    status: row.status,
    metrics: row.metrics,
    results: row.results,
  });
}
