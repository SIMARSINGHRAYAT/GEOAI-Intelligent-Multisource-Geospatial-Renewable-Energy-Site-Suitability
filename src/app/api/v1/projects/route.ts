import { db } from "@/db";
import { projects } from "@/db/schema";
import { desc } from "drizzle-orm";
import { z } from "zod";

const projectSchema = z.object({
  name: z.string().min(3).max(120),
  description: z.string().max(600).optional().default(""),
  regionGeojson: z.record(z.string(), z.unknown()).nullable().optional(),
});

export async function GET() {
  const rows = await db.select().from(projects).orderBy(desc(projects.createdAt));
  return Response.json({ projects: rows });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = projectSchema.parse(body);

    const [inserted] = await db
      .insert(projects)
      .values({
        name: parsed.name,
        description: parsed.description,
        regionGeojson: parsed.regionGeojson ?? null,
      })
      .returning();

    return Response.json({ project: inserted }, { status: 201 });
  } catch (error) {
    return Response.json({ error: "Invalid payload", detail: String(error) }, { status: 400 });
  }
}
