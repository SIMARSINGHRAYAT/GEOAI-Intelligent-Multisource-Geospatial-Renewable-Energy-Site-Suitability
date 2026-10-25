import { db } from "@/db";
import { analyses } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const { jobId } = await params;
  const [row] = await db.select().from(analyses).where(eq(analyses.id, jobId));
  if (!row) return Response.json({ error: "Analysis not found" }, { status: 404 });

  return Response.json({
    jobId,
    energyType: row.energyType,
    status: row.status,
    metrics: row.metrics,
    results: row.results,
  });
}
