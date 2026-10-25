import { validateRegionGeojson } from "@/lib/geo";
import { z } from "zod";

const schema = z.object({
  regionGeojson: z.record(z.string(), z.unknown()),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { regionGeojson } = schema.parse(body);
    const validation = validateRegionGeojson(regionGeojson);

    if (!validation.ok) {
      return Response.json({ valid: false, reason: validation.reason }, { status: 400 });
    }

    return Response.json({ valid: true, ...validation });
  } catch (error) {
    return Response.json({ valid: false, error: String(error) }, { status: 400 });
  }
}
