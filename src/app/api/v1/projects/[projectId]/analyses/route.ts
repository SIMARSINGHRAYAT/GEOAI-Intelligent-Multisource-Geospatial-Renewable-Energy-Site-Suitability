import { storage } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params;
  const rows = await storage.getProjectAnalyses(projectId);

  return Response.json({ projectId, analyses: rows });
}
