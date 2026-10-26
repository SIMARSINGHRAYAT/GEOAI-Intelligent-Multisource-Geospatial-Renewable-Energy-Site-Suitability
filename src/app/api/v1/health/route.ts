import { storage } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET() {
  const health = await storage.checkHealth();
  return Response.json({
    status: "ok",
    service: "GeoRenew AI Platform",
    version: "v1.0.0",
    architecture: "standalone-serverless",
    databaseRequired: false,
    engine: health.engine,
    stats: health.stats,
  });
}
