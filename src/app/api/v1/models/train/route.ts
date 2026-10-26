import { storage } from "@/lib/storage";
import { z } from "zod";

export const dynamic = "force-dynamic";

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

    const saved = await storage.createMlModel({
      name: parsed.name,
      energyType: parsed.energyType,
      algorithm: parsed.algorithm,
      metrics: parsed.metrics,
    });

    return Response.json({ model: saved }, { status: 201 });
  } catch (error) {
    return Response.json({ error: "Invalid training payload", detail: String(error) }, { status: 400 });
  }
}
