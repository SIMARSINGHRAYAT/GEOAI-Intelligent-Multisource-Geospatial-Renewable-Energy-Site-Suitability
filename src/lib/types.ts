export type EnergyType = "solar" | "wind" | "geothermal" | "hydro";

export type AnalysisStatus =
  | "Queued"
  | "Fetching Data"
  | "Preprocessing"
  | "Running Models"
  | "Generating Spatial Results"
  | "Completed"
  | "Failed";

export type GeoJson = Record<string, unknown>;

export type DataSourceRecord = {
  provider: string;
  dataset: string;
  acquisitionDate: string;
  spatialResolution: string;
  temporalCoverage: string;
  units: string;
  license: string;
  extent: string;
  sourceUrl: string;
  notes: string;
};
