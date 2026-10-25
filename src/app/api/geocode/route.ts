import { z } from "zod";

const schema = z.object({ q: z.string().min(2) });

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const parsed = schema.parse({ q: searchParams.get("q") });

    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("q", parsed.q);
    url.searchParams.set("format", "json");
    url.searchParams.set("limit", "8");

    const res = await fetch(url.toString(), {
      headers: {
        "User-Agent": "GeoRenewAI/1.0",
      },
      next: { revalidate: 60 * 60 * 24 },
    });

    if (!res.ok) {
      return Response.json({ error: "Geocoding service unavailable" }, { status: 502 });
    }

    const raw = (await res.json()) as Array<{
      display_name: string;
      lat: string;
      lon: string;
      boundingbox: string[];
    }>;

    return Response.json({
      results: raw.map((r) => ({
        name: r.display_name,
        lat: Number(r.lat),
        lng: Number(r.lon),
        bbox: r.boundingbox,
      })),
    });
  } catch (error) {
    return Response.json({ error: "Invalid query", detail: String(error) }, { status: 400 });
  }
}
