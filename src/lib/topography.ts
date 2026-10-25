export async function fetchElevation(lat: number, lng: number) {
  const url = `https://api.open-meteo.com/v1/elevation?latitude=${lat}&longitude=${lng}`;
  const response = await fetch(url, { next: { revalidate: 60 * 60 * 24 } });

  if (!response.ok) {
    throw new Error(`Elevation API failed: ${response.status}`);
  }

  const json = (await response.json()) as {
    elevation?: number[];
  };

  const elevation = Array.isArray(json.elevation) ? json.elevation[0] : null;
  return Number.isFinite(elevation) ? elevation : null;
}

export function slopeProxyFromElevation(elevationM: number | null) {
  if (elevationM === null) return 7;
  if (elevationM < 200) return 3;
  if (elevationM < 700) return 6;
  if (elevationM < 1500) return 10;
  if (elevationM < 2500) return 15;
  return 20;
}
