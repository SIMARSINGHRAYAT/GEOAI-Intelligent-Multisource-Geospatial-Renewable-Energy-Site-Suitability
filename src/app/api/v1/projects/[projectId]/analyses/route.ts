import { db } from "@/db";
import { analyses } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params;
  const rows = await db
    .select()
    .from(analyses)
    .where(eq(analyses.projectId, projectId))
    .orderBy(desc(analyses.createdAt));

  return Response.json({ projectId, analyses: rows });
}
