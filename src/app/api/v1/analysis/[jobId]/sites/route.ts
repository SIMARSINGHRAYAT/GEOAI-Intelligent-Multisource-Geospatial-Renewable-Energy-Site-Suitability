import { storage } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const { jobId } = await params;
  const rows = await storage.getCandidateSites(jobId);

  return Response.json({ jobId, sites: rows });
}
