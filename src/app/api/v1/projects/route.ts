import { storage } from "@/lib/storage";
import { z } from "zod";

export const dynamic = "force-dynamic";

const projectSchema = z.object({
  name: z.string().min(3).max(120),
  description: z.string().max(600).optional().default(""),
  regionGeojson: z.record(z.string(), z.unknown()).nullable().optional(),
});

export async function GET() {
  const rows = await storage.listProjects();
  return Response.json({ projects: rows });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = projectSchema.parse(body);

    const inserted = await storage.createProject({
      name: parsed.name,
      description: parsed.description,
      regionGeojson: parsed.regionGeojson ?? null,
    });

    return Response.json({ project: inserted }, { status: 201 });
  } catch (error) {
    return Response.json({ error: "Invalid payload", detail: String(error) }, { status: 400 });
  }
}
