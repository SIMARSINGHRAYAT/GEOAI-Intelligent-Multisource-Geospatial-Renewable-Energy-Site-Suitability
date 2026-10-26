import { storage } from "@/lib/storage";

export const dynamic = "force-dynamic";

function toCsv(rows: Array<Record<string, unknown>>) {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(",")];

  for (const row of rows) {
    lines.push(
      headers
        .map((h) => {
          const raw = row[h];
          const str = typeof raw === "object" ? JSON.stringify(raw) : String(raw ?? "");
          return `"${str.replaceAll('"', '""')}"`;
        })
        .join(","),
    );
  }

  return lines.join("\n");
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const { jobId } = await params;
  const { searchParams } = new URL(req.url);
  const format = searchParams.get("format") ?? "geojson";

  const analysis = await storage.getAnalysisById(jobId);
  if (!analysis) return Response.json({ error: "Analysis not found" }, { status: 404 });

  const sites = await storage.getCandidateSites(jobId);

  const layer = (analysis.results as { layerGeojson?: Record<string, unknown> }).layerGeojson ?? {
    type: "FeatureCollection",
    features: [],
  };

  if (format === "csv") {
    const csv = toCsv(
      sites.map((s) => ({
        siteId: s.siteId,
        energyType: s.energyType,
        lat: s.lat,
        lng: s.lng,
        areaKm2: s.areaKm2,
        suitability: s.suitability,
        confidence: s.confidence,
        limitations: s.limitations,
      })),
    );

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="analysis-${jobId}-sites.csv"`,
      },
    });
  }

  if (format === "json") {
    return Response.json({ analysis, sites, exportedAt: new Date().toISOString() });
  }

  return Response.json(layer);
}
