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
  const response = await fetch(url, { next: { revalidate: 60 * 60 * 12 } });

  if (!response.ok) {
    throw new Error(`NASA POWER request failed: ${response.status}`);
  }

  const data = (await response.json()) as NasaResponse;
  const param = data.properties?.parameter ?? {};

  return {
    ghiKwhM2Day: avg(collect(param.ALLSKY_SFC_SW_DWN)),
    dniKwhM2Day: avg(collect(param.CLRSKY_SFC_SW_DNI)),
    wind10mMs: avg(collect(param.WS10M)),
    temperatureC: avg(collect(param.T2M)),
    precipitationMmDay: avg(collect(param.PRECTOTCORR)),
    source: url,
  };
}
