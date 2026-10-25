import { db } from "@/db";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await db.execute(sql`select 1`);
    return Response.json({ status: "ok", service: "GeoRenew AI API", version: "v1" });
  } catch (error) {
    return Response.json(
      { status: "failed", message: "Database connectivity issue", error: String(error) },
      { status: 500 },
    );
  }
}
