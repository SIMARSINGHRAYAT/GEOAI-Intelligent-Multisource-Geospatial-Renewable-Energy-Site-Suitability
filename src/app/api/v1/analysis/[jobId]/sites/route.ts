import { db } from "@/db";
import { candidateSites } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const { jobId } = await params;
  const rows = await db
    .select()
    .from(candidateSites)
    .where(eq(candidateSites.analysisId, jobId))
    .orderBy(desc(candidateSites.suitability));

  return Response.json({ jobId, sites: rows });
}
