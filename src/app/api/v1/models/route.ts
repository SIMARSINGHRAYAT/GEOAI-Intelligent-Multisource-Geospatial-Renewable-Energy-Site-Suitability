import { db } from "@/db";
import { mlModels } from "@/db/schema";
import { desc } from "drizzle-orm";

export async function GET() {
  const models = await db.select().from(mlModels).orderBy(desc(mlModels.createdAt));
  return Response.json({ models });
}
