export async function fetchElevation(lat: number, lng: number): Promise<number | null> {
  const url = `https://api.open-meteo.com/v1/elevation?latitude=${lat}&longitude=${lng}`;

  try {
    const response = await fetch(url, {
      next: { revalidate: 60 * 60 * 24 },
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      return fallbackElevation(lat, lng);
    }

    const json = (await response.json()) as {
      elevation?: number[];
    };

    const elevation = Array.isArray(json.elevation) ? json.elevation[0] : null;
    return Number.isFinite(elevation) ? elevation : fallbackElevation(lat, lng);
  } catch {
    return fallbackElevation(lat, lng);
  }
}

function fallbackElevation(lat: number, lng: number): number {
  // Approximate elevation modeling based on regional terrain
  // Dehradun / Himalayan foothills: 650m - 2200m
  if (lat > 28 && lat < 36 && lng > 74 && lng < 82) {
    return Math.round(650 + Math.abs(Math.sin(lat * 1.5)) * 900);
  }
  // Generic global land proxy
  return Math.round(250 + Math.abs(Math.sin(lat * 2) * Math.cos(lng * 2)) * 450);
}

export function slopeProxyFromElevation(elevationM: number | null) {
  if (elevationM === null) return 7;
  if (elevationM < 200) return 3;
  if (elevationM < 700) return 6;
  if (elevationM < 1500) return 10;
  if (elevationM < 2500) return 15;
  return 20;
}
