import { db } from "@/db";
import { mlModels } from "@/db/schema";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(3),
  energyType: z.enum(["solar", "wind", "geothermal", "hydro"]),
  algorithm: z.enum(["RandomForest", "XGBoost", "GradientBoosting", "KMeans", "DBSCAN", "PCA"]),
  metrics: z.record(z.string(), z.number()),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = schema.parse(body);

    const [saved] = await db
      .insert(mlModels)
      .values({
        name: parsed.name,
        energyType: parsed.energyType,
        algorithm: parsed.algorithm,
        version: `v${Date.now()}`,
        metrics: parsed.metrics,
        isActive: "false",
      })
      .returning();

    return Response.json({ model: saved }, { status: 201 });
  } catch (error) {
    return Response.json({ error: "Invalid training payload", detail: String(error) }, { status: 400 });
  }
}
