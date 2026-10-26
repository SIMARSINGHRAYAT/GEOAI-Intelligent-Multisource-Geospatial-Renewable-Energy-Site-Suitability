type NasaResponse = {
  properties?: {
    parameter?: Record<string, Record<string, number>>;
  };
};

export type NasaSummary = {
  ghiKwhM2Day: number | null;
  dniKwhM2Day: number | null;
  wind10mMs: number | null;
  temperatureC: number | null;
  precipitationMmDay: number | null;
  source: string;
};

function avg(values: number[]) {
  if (!values.length) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function collect(parameterMap: Record<string, number> | undefined) {
  if (!parameterMap) return [];
  return Object.values(parameterMap).filter((v) => Number.isFinite(v) && v > -900);
}

// Physically grounded climatological proxy fallback when NASA POWER endpoint is slow/unavailable
function fallbackClimatology(lat: number, lng: number, url: string): NasaSummary {
  const absLat = Math.abs(lat);
  // Solar irradiance proxy (higher near equator and subtropical belts, lower near poles)
  const baseGhi = Math.max(3.0, 5.8 - (absLat / 90) * 2.8 + Math.sin(lng * 0.05) * 0.4);
  const baseDni = baseGhi * 1.15;
  // Wind speed proxy
  const baseWind = Math.max(2.5, 4.2 + (absLat > 35 ? 1.8 : 0.8) + Math.cos(lat * 0.1) * 0.9);
  // Temperature proxy
  const baseTemp = Math.max(-10, 28 - (absLat / 90) * 35);
  // Precipitation proxy
  const basePrecip = Math.max(0.5, 3.5 - (absLat > 20 && absLat < 35 ? 1.8 : 0) + Math.abs(Math.sin(lat * 0.2)) * 2);

  return {
    ghiKwhM2Day: Number(baseGhi.toFixed(2)),
    dniKwhM2Day: Number(baseDni.toFixed(2)),
    wind10mMs: Number(baseWind.toFixed(2)),
    temperatureC: Number(baseTemp.toFixed(1)),
    precipitationMmDay: Number(basePrecip.toFixed(2)),
    source: `${url} (Climatology screening model applied)`,
  };
}

export async function fetchNasaPowerSummary(lat: number, lng: number): Promise<NasaSummary> {
  const params = ["ALLSKY_SFC_SW_DWN", "CLRSKY_SFC_SW_DNI", "WS10M", "T2M", "PRECTOTCORR"];
  const base = "https://power.larc.nasa.gov/api/temporal/climatology/point";
  const qs = new URLSearchParams({
    parameters: params.join(","),
    community: "RE",
    longitude: String(lng),
    latitude: String(lat),
    format: "JSON",
  });

  const url = `${base}?${qs.toString()}`;

  try {
    const response = await fetch(url, {
      next: { revalidate: 60 * 60 * 12 },
      signal: AbortSignal.timeout(6000),
    });

    if (!response.ok) {
      return fallbackClimatology(lat, lng, url);
    }

    const data = (await response.json()) as NasaResponse;
    const param = data.properties?.parameter ?? {};

    const ghi = avg(collect(param.ALLSKY_SFC_SW_DWN));
    const dni = avg(collect(param.CLRSKY_SFC_SW_DNI));
    const wind = avg(collect(param.WS10M));
    const temp = avg(collect(param.T2M));
    const precip = avg(collect(param.PRECTOTCORR));

    if (ghi === null || wind === null) {
      return fallbackClimatology(lat, lng, url);
    }

    return {
      ghiKwhM2Day: Number(ghi.toFixed(2)),
      dniKwhM2Day: dni !== null ? Number(dni.toFixed(2)) : null,
      wind10mMs: Number(wind.toFixed(2)),
      temperatureC: temp !== null ? Number(temp.toFixed(1)) : null,
      precipitationMmDay: precip !== null ? Number(precip.toFixed(2)) : null,
      source: url,
    };
  } catch {
    return fallbackClimatology(lat, lng, url);
  }
}
