import * as turf from "@turf/turf";
import type { Feature, MultiPolygon, Polygon } from "geojson";

const MAX_ANALYSIS_AREA_KM2 = 50000;
const MIN_ANALYSIS_AREA_KM2 = 1;

function toPolygonFeature(
  geojson: Record<string, unknown>,
): Feature<Polygon | MultiPolygon> | null {
  if (geojson.type === "Feature") {
    const geometry = (geojson as unknown as Feature).geometry;
    if (!geometry) return null;
    if (geometry.type === "Polygon" || geometry.type === "MultiPolygon") {
      return geojson as unknown as Feature<Polygon | MultiPolygon>;
    }
    return null;
  }

  if (geojson.type === "Polygon" || geojson.type === "MultiPolygon") {
    return {
      type: "Feature",
      properties: {},
      geometry: geojson as unknown as Polygon | MultiPolygon,
    };
  }

  return null;
}

export type RegionValidationResult =
  | {
      ok: true;
      areaKm2: number;
      centroid: { lat: number; lng: number };
      bbox: number[];
      feature: Feature<Polygon | MultiPolygon>;
    }
  | {
      ok: false;
      reason: string;
    };

export function validateRegionGeojson(geojson: Record<string, unknown>): RegionValidationResult {
  const feature = toPolygonFeature(geojson);

  if (!feature) {
    return {
      ok: false,
      reason: "Region must be Polygon or MultiPolygon GeoJSON",
    };
  }

  const areaKm2 = turf.area(feature) / 1_000_000;

  if (areaKm2 < MIN_ANALYSIS_AREA_KM2) {
    return {
      ok: false,
      reason: `Region too small: ${areaKm2.toFixed(2)} km². Minimum is ${MIN_ANALYSIS_AREA_KM2} km².`,
    };
  }

  if (areaKm2 > MAX_ANALYSIS_AREA_KM2) {
    return {
      ok: false,
      reason: `Region too large: ${areaKm2.toFixed(2)} km². Maximum is ${MAX_ANALYSIS_AREA_KM2} km².`,
    };
  }

  const centroid = turf.centroid(feature);
  const [lng, lat] = centroid.geometry.coordinates;

  return {
    ok: true,
    areaKm2,
    centroid: { lat, lng },
    bbox: turf.bbox(feature),
    feature,
  };
}

export function createGridWithinRegion(
  region: Feature<Polygon | MultiPolygon>,
  cellSideKm = 10,
) {
  const bbox = turf.bbox(region);
  const grid = turf.squareGrid(bbox, cellSideKm, { units: "kilometers" });
  const kept = grid.features
    .map((f) => {
      const clipped = turf.intersect(turf.featureCollection([f, region]));
      return clipped;
    })
    .filter(Boolean) as Array<Feature<Polygon | MultiPolygon>>;

  return turf.featureCollection(kept);
}

export function scoreBand(score: number) {
  if (score >= 80) return "Very High Suitability";
  if (score >= 65) return "High Suitability";
  if (score >= 45) return "Moderate Suitability";
  if (score >= 25) return "Low Suitability";
  return "Very Low Suitability";
}

export function scoreColor(score: number, restricted = false) {
  if (restricted) return "#9ca3af";
  if (score >= 80) return "#166534";
  if (score >= 65) return "#4ade80";
  if (score >= 45) return "#fde047";
  if (score >= 25) return "#fb923c";
  return "#ef4444";
}
