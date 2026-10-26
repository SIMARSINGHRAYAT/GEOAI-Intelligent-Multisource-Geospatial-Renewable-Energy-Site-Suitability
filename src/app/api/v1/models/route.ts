import { storage } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET() {
  const models = await storage.listMlModels();
  return Response.json({ models });
}
