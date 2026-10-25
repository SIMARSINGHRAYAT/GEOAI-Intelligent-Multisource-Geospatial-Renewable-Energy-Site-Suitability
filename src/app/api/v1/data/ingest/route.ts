import { z } from "zod";

const schema = z.object({
  sourceName: z.string().min(2),
  regionGeojson: z.record(z.string(), z.unknown()),
  notes: z.string().max(500).optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = schema.parse(body);

    return Response.json({
      status: "accepted",
      message: "Ingestion request validated. In production, this is queued for asynchronous processing.",
      request: {
        sourceName: parsed.sourceName,
        hasRegion: Boolean(parsed.regionGeojson),
      },
    });
  } catch (error) {
    return Response.json({ error: "Invalid ingestion payload", detail: String(error) }, { status: 400 });
  }
}
