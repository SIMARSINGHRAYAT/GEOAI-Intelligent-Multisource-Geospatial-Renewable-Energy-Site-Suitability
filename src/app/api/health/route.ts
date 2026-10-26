import { storage } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET() {
  const health = await storage.checkHealth();
  return Response.json({ ok: health.ok, mode: health.mode });
}
