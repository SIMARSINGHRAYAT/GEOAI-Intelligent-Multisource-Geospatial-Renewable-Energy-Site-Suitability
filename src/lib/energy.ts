import type { EnergyType } from "@/lib/types";

export type SiteComputationInput = {
  energyType: EnergyType;
  ghiKwhM2Day: number | null;
  dniKwhM2Day: number | null;
  wind10mMs: number | null;
  elevationM: number | null;
  slopeDeg: number | null;
  temperatureC: number | null;
  precipitationMmDay: number | null;
  distanceToRoadKm: number;
  distanceToGridKm: number;
  protectedArea: boolean;
};

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function normalize(value: number, min: number, max: number) {
  if (value <= min) return 0;
  if (value >= max) return 1;
  return (value - min) / (max - min);
}

function inverseNormalize(value: number, min: number, max: number) {
  return 1 - normalize(value, min, max);
}

export function computeSolarScore(input: SiteComputationInput) {
  const resource = input.ghiKwhM2Day ? normalize(input.ghiKwhM2Day, 2.5, 7) : 0.2;
  const terrain = input.slopeDeg !== null ? inverseNormalize(input.slopeDeg, 2, 25) : 0.5;
  const temp = input.temperatureC !== null ? inverseNormalize(Math.abs(input.temperatureC - 25), 0, 20) : 0.5;
  const infra = (inverseNormalize(input.distanceToRoadKm, 0.5, 40) + inverseNormalize(input.distanceToGridKm, 0.5, 60)) / 2;
  const constraint = input.protectedArea ? 0 : 1;
  const score = clamp(100 * constraint * (0.4 * resource + 0.2 * terrain + 0.15 * temp + 0.25 * infra));

  const annualMwhPerMw = input.ghiKwhM2Day ? input.ghiKwhM2Day * 365 * 0.78 : null;

  return {
    score,
    confidence: input.ghiKwhM2Day && input.temperatureC ? 0.86 : 0.62,
    estimatedAnnualMwhPerMw: annualMwhPerMw,
    method: "Deterministic weighted suitability with NASA climatology and terrain/infrastructure factors",
  };
}

export function computeWindScore(input: SiteComputationInput) {
  const v10 = input.wind10mMs ?? 3;
  const hubHeightFactor = 1.25;
  const vHub = v10 * hubHeightFactor;
  const resource = normalize(vHub, 4.5, 10.5);
  const terrain = input.slopeDeg !== null ? inverseNormalize(input.slopeDeg, 3, 30) : 0.45;
  const infra = inverseNormalize(input.distanceToGridKm, 0.5, 80);
  const constraint = input.protectedArea ? 0 : 1;

  const rho = 1.225;
  const rotorArea = 12469;
  const cp = 0.42;
  const eta = 0.9;
  const powerKw = 0.5 * rho * rotorArea * cp * Math.pow(vHub, 3) * eta / 1000;

  const score = clamp(100 * constraint * (0.55 * resource + 0.2 * terrain + 0.25 * infra));

  return {
    score,
    confidence: input.wind10mMs ? 0.8 : 0.55,
    estimatedPowerKwAtRatedArea: powerKw,
    method: "Hub-height adjusted wind suitability and power equation screening",
  };
}

export function computeGeothermalScore(input: SiteComputationInput) {
  const geothermalProxy = input.elevationM !== null ? inverseNormalize(input.elevationM, 0, 3500) : 0.4;
  const hydrothermalProxy = input.precipitationMmDay !== null ? normalize(input.precipitationMmDay, 0.5, 8) : 0.4;
  const slope = input.slopeDeg !== null ? inverseNormalize(input.slopeDeg, 5, 35) : 0.4;
  const access = (inverseNormalize(input.distanceToRoadKm, 0.5, 35) + inverseNormalize(input.distanceToGridKm, 0.5, 100)) / 2;
  const constraint = input.protectedArea ? 0 : 1;

  const score = clamp(100 * constraint * (0.35 * geothermalProxy + 0.2 * hydrothermalProxy + 0.2 * slope + 0.25 * access));

  return {
    score,
    confidence: 0.52,
    exploratory: true,
    method: "Exploratory geothermal screening using geological proxy indicators",
  };
}

export function computeHydroScore(input: SiteComputationInput) {
  const precip = input.precipitationMmDay !== null ? normalize(input.precipitationMmDay, 0.5, 10) : 0.35;
  const slope = input.slopeDeg !== null ? normalize(input.slopeDeg, 1, 20) : 0.4;
  const access = inverseNormalize(input.distanceToRoadKm, 0.5, 50);
  const constraint = input.protectedArea ? 0 : 1;

  const rho = 1000;
  const g = 9.81;
  const q = 12;
  const h = input.slopeDeg ? Math.max(5, input.slopeDeg * 4) : 15;
  const eta = 0.82;
  const hydroKw = (rho * g * q * h * eta) / 1000;

  const score = clamp(100 * constraint * (0.45 * precip + 0.3 * slope + 0.25 * access));

  return {
    score,
    confidence: input.precipitationMmDay ? 0.7 : 0.5,
    estimatedPowerKw: hydroKw,
    method: "Hydrological screening from precipitation/topography proxies with hydropower equation",
  };
}

export function computeEnergyScore(input: SiteComputationInput) {
  if (input.energyType === "solar") return computeSolarScore(input);
  if (input.energyType === "wind") return computeWindScore(input);
  if (input.energyType === "geothermal") return computeGeothermalScore(input);
  return computeHydroScore(input);
}
