import { z } from "zod";

export const dynamic = "force-dynamic";

const schema = z.object({ q: z.string().min(2) });

const FALLBACK_LOCATIONS: Record<string, { lat: number; lng: number; name: string }> = {
  dehradun: { lat: 30.3165, lng: 78.0322, name: "Dehradun, Uttarakhand, India" },
  uttarakhand: { lat: 30.0668, lng: 79.0193, name: "Uttarakhand, India" },
  delhi: { lat: 28.6139, lng: 77.209, name: "New Delhi, Delhi, India" },
  rajasthan: { lat: 27.0238, lng: 74.2179, name: "Rajasthan, India" },
  thar: { lat: 26.9157, lng: 70.9083, name: "Thar Desert, Rajasthan, India" },
  ladakh: { lat: 34.1526, lng: 77.5771, name: "Ladakh, India" },
  gujarat: { lat: 22.2587, lng: 71.1924, name: "Gujarat, India" },
  mumbai: { lat: 19.076, lng: 72.8777, name: "Mumbai, Maharashtra, India" },
  bengaluru: { lat: 12.9716, lng: 77.5946, name: "Bengaluru, Karnataka, India" },
  london: { lat: 51.5074, lng: -0.1278, name: "London, Greater London, England, United Kingdom" },
  california: { lat: 36.7783, lng: -119.4179, name: "California, United States" },
  tokyo: { lat: 35.6762, lng: 139.6503, name: "Tokyo, Japan" },
  berlin: { lat: 52.52, lng: 13.405, name: "Berlin, Germany" },
  paris: { lat: 48.8566, lng: 2.3522, name: "Paris, Île-de-France, France" },
  sydney: { lat: -33.8688, lng: 151.2093, name: "Sydney, New South Wales, Australia" },
  dubai: { lat: 25.2048, lng: 55.2708, name: "Dubai, United Arab Emirates" },
  nairobi: { lat: -1.2921, lng: 36.8219, name: "Nairobi, Kenya" },
  santiago: { lat: -33.4489, lng: -70.6693, name: "Santiago, Chile" },
};

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const parsed = schema.parse({ q: searchParams.get("q") });
    const queryLower = parsed.q.toLowerCase().trim();

    // Check offline / instant match first
    for (const [key, loc] of Object.entries(FALLBACK_LOCATIONS)) {
      if (queryLower.includes(key)) {
        return Response.json({
          results: [
            {
              name: loc.name,
              lat: loc.lat,
              lng: loc.lng,
              bbox: [String(loc.lat - 0.5), String(loc.lat + 0.5), String(loc.lng - 0.5), String(loc.lng + 0.5)],
            },
          ],
        });
      }
    }

    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("q", parsed.q);
    url.searchParams.set("format", "json");
    url.searchParams.set("limit", "8");

    try {
      const res = await fetch(url.toString(), {
        headers: {
          "User-Agent": "GeoRenewAI-Platform/1.0 (contact: georenew-support@example.com)",
          Accept: "application/json",
        },
        signal: AbortSignal.timeout(4000),
      });

      if (res.ok) {
        const raw = (await res.json()) as Array<{
          display_name: string;
          lat: string;
          lon: string;
          boundingbox: string[];
        }>;

        if (raw.length > 0) {
          return Response.json({
            results: raw.map((r) => ({
              name: r.display_name,
              lat: Number(r.lat),
              lng: Number(r.lon),
              bbox: r.boundingbox,
            })),
          });
        }
      }
    } catch {
      // Network failure or timeout from Nominatim
    }

    // Default fallback to Dehradun if nothing matched
    return Response.json({
      results: [
        {
          name: `Approximate location for: "${parsed.q}" (Dehradun reference)`,
          lat: 30.3165,
          lng: 78.0322,
          bbox: ["30.0", "30.6", "77.7", "78.4"],
        },
      ],
    });
  } catch (error) {
    return Response.json({ error: "Invalid query", detail: String(error) }, { status: 400 });
  }
}
