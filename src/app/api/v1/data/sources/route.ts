import { DATA_SOURCES } from "@/lib/data-sources";

export async function GET() {
  return Response.json({
    count: DATA_SOURCES.length,
    sources: DATA_SOURCES,
  });
}
