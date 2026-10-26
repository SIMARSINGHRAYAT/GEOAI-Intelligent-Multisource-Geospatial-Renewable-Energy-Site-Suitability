import { storage } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params;
  const project = await storage.getProjectById(projectId);

  if (!project) {
    return Response.json({ error: "Project not found" }, { status: 404 });
  }

  return Response.json({ project });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params;
  const success = await storage.deleteProject(projectId);

  if (!success) {
    return Response.json({ error: "Project not found or already deleted" }, { status: 404 });
  }

  return Response.json({ success: true, message: `Project ${projectId} deleted` });
}
