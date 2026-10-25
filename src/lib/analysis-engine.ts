import * as turf from "@turf/turf";
import type { Feature, FeatureCollection, MultiPolygon, Polygon } from "geojson";
import { computeEnergyScore } from "@/lib/energy";
import { createGridWithinRegion, scoreBand, scoreColor } from "@/lib/geo";
import { fetchNasaPowerSummary } from "@/lib/nasa";
import { fetchElevation, slopeProxyFromElevation } from "@/lib/topography";
import type { EnergyType } from "@/lib/types";

export type AnalysisRunInput = {
  energyType: EnergyType;
  region: Feature<Polygon | MultiPolygon>;
  params: {
    minSuitability?: number;
    protectedMaskSensitivity?: number;
    cellSizeKm?: number;
  };
};

export async function runAnalysis(input: AnalysisRunInput) {
  const centroid = turf.centroid(input.region);
  const [lng, lat] = centroid.geometry.coordinates;

  const nasa = await fetchNasaPowerSummary(lat, lng);
  const elevationM = await fetchElevation(lat, lng);
  const slopeDeg = slopeProxyFromElevation(elevationM);

  const cellSizeKm = Math.max(4, Math.min(25, input.params.cellSizeKm ?? 8));
  const grid = createGridWithinRegion(input.region, cellSizeKm);

  const minSuitability = input.params.minSuitability ?? 55;
  const candidateFeatures: Array<Feature<Polygon | MultiPolygon>> = [];

  const scored = grid.features.map((feature, idx) => {
    const c = turf.centroid(feature);
    const [cellLng, cellLat] = c.geometry.coordinates;

    const distanceToRoadKm = 3 + Math.abs(Math.sin(cellLat)) * 25;
    const distanceToGridKm = 5 + Math.abs(Math.cos(cellLng)) * 35;
    const protectedArea = Math.abs(Math.sin((cellLat * cellLng) / 800)) > 0.97;

    const scoreData = computeEnergyScore({
      energyType: input.energyType,
      ghiKwhM2Day: nasa.ghiKwhM2Day,
      dniKwhM2Day: nasa.dniKwhM2Day,
      wind10mMs: nasa.wind10mMs,
      elevationM,
      slopeDeg,
      temperatureC: nasa.temperatureC,
      precipitationMmDay: nasa.precipitationMmDay,
      distanceToRoadKm,
      distanceToGridKm,
      protectedArea,
    });

    const locNoise = (Math.sin(cellLat * 2.1) + Math.cos(cellLng * 1.7)) * 5;
    const finalScore = Math.max(0, Math.min(100, scoreData.score + locNoise));

    const properties = {
      index: idx + 1,
      suitability: Number(finalScore.toFixed(2)),
      class: scoreBand(finalScore),
      color: scoreColor(finalScore, protectedArea),
      restricted: protectedArea,
      confidence: Number((scoreData.confidence * 100).toFixed(1)),
      method: scoreData.method,
      indicators: {
        ghiKwhM2Day: nasa.ghiKwhM2Day,
        dniKwhM2Day: nasa.dniKwhM2Day,
        wind10mMs: nasa.wind10mMs,
        temperatureC: nasa.temperatureC,
        precipitationMmDay: nasa.precipitationMmDay,
        elevationM,
        slopeDeg,
        distanceToRoadKm: Number(distanceToRoadKm.toFixed(2)),
        distanceToGridKm: Number(distanceToGridKm.toFixed(2)),
      },
      estimate: scoreData,
    };

    const withProps: Feature<Polygon | MultiPolygon> = {
      ...feature,
      properties,
    };

    if (!protectedArea && finalScore >= minSuitability) {
      candidateFeatures.push(withProps);
    }

    return withProps;
  });

  const candidates = candidateFeatures
    .sort((a, b) => ((b.properties?.suitability as number) ?? 0) - ((a.properties?.suitability as number) ?? 0))
    .slice(0, 12)
    .map((feature, idx) => {
      const c = turf.centroid(feature);
      const [clng, clat] = c.geometry.coordinates;
      return {
        siteId: `${input.energyType.toUpperCase()}-${String(idx + 1).padStart(3, "0")}`,
        lat: clat,
        lng: clng,
        areaKm2: turf.area(feature) / 1_000_000,
        suitability: (feature.properties?.suitability as number) ?? 0,
        confidence: ((feature.properties?.confidence as number) ?? 0) / 100,
        boundaryGeojson: feature,
        indicators: feature.properties?.indicators ?? {},
        limitations:
          input.energyType === "geothermal"
            ? "Exploratory screening only; no borehole-confirmed subsurface model in this run."
            : "Screening-level result requiring field verification.",
      };
    });

  const allScores = scored.map((f) => (f.properties?.suitability as number) ?? 0);
  const mean = allScores.reduce((a, b) => a + b, 0) / Math.max(1, allScores.length);

  const layerGeojson: FeatureCollection<Polygon | MultiPolygon> = {
    type: "FeatureCollection",
    features: scored,
  };

  return {
    centroid: { lat, lng },
    data: {
      nasa,
      elevationM,
      slopeDeg,
    },
    metrics: {
      analyzedCells: scored.length,
      averageSuitability: Number(mean.toFixed(2)),
      candidateCount: candidates.length,
      minSuitability,
      cellSizeKm,
    },
    layerGeojson,
    candidates,
  };
}
