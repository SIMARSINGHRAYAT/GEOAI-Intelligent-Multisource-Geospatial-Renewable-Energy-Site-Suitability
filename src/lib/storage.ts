export type ProjectRecord = {
  id: string;
  name: string;
  description: string | null;
  regionGeojson: Record<string, unknown> | null;
  createdAt: Date;
};

export type AnalysisRecord = {
  id: string;
  projectId: string | null;
  energyType: string;
  status: string;
  regionGeojson: Record<string, unknown>;
  centroidLat: number;
  centroidLng: number;
  inputParams: Record<string, unknown>;
  metrics: Record<string, unknown>;
  results: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
};

export type CandidateSiteRecord = {
  id: string;
  analysisId: string;
  siteId: string;
  energyType: string;
  lat: number;
  lng: number;
  areaKm2: number;
  suitability: number;
  confidence: number;
  boundaryGeojson: Record<string, unknown>;
  indicators: Record<string, unknown>;
  limitations: string;
  createdAt: Date;
};

export type MlModelRecord = {
  id: string;
  name: string;
  energyType: string;
  algorithm: string;
  version: string;
  metrics: Record<string, unknown>;
  isActive: string;
  createdAt: Date;
};

type StandaloneMemoryStore = {
  projects: ProjectRecord[];
  analyses: AnalysisRecord[];
  candidateSites: CandidateSiteRecord[];
  mlModels: MlModelRecord[];
};

const globalForStore = globalThis as typeof globalThis & {
  __geoRenewStandaloneStore?: StandaloneMemoryStore;
};

function createInitialStore(): StandaloneMemoryStore {
  const proj1Id = "11111111-1111-4111-8111-111111111111";
  const proj2Id = "22222222-2222-4222-8222-222222222222";
  const proj3Id = "33333333-3333-4333-8333-333333333333";
  const proj4Id = "44444444-4444-4444-8444-444444444444";

  const defaultProjects: ProjectRecord[] = [
    {
      id: proj1Id,
      name: "Western Himalayas Renewable Corridor",
      description: "Screening of solar PV irradiance and run-of-river hydro potential across Uttarakhand mountain valleys.",
      regionGeojson: {
        type: "Feature",
        properties: { name: "Dehradun Region" },
        geometry: {
          type: "Polygon",
          coordinates: [
            [
              [77.7, 30.1],
              [78.4, 30.1],
              [78.4, 30.6],
              [77.7, 30.6],
              [77.7, 30.1],
            ],
          ],
        },
      },
      createdAt: new Date(Date.now() - 86400000 * 3),
    },
    {
      id: proj2Id,
      name: "Thar Desert High-Yield Solar Assessment",
      description: "Screening study for utility-scale solar PV and wind hybrid deployment in Rajasthan corridor.",
      regionGeojson: {
        type: "Feature",
        properties: { name: "Thar Basin" },
        geometry: {
          type: "Polygon",
          coordinates: [
            [
              [71.5, 26.5],
              [72.5, 26.5],
              [72.5, 27.5],
              [71.5, 27.5],
              [71.5, 26.5],
            ],
          ],
        },
      },
      createdAt: new Date(Date.now() - 86400000 * 2),
    },
    {
      id: proj3Id,
      name: "Ladakh High-Altitude Solar-Wind Microgrid",
      description: "Cold-desert solar photovoltaic and boundary-layer wind assessment for zero-emission microgrids.",
      regionGeojson: {
        type: "Feature",
        properties: { name: "Leh Valley" },
        geometry: {
          type: "Polygon",
          coordinates: [
            [
              [77.3, 33.9],
              [77.8, 33.9],
              [77.8, 34.3],
              [77.3, 34.3],
              [77.3, 33.9],
            ],
          ],
        },
      },
      createdAt: new Date(Date.now() - 86400000 * 1),
    },
    {
      id: proj4Id,
      name: "Western Ghats Hydro-Solar Hybrid Basin",
      description: "High precipitation runoff catchment coupled with floating and rooftop solar suitability screening.",
      regionGeojson: {
        type: "Feature",
        properties: { name: "Sahyadri Basin" },
        geometry: {
          type: "Polygon",
          coordinates: [
            [
              [75.2, 13.8],
              [75.8, 13.8],
              [75.8, 14.4],
              [75.2, 14.4],
              [75.2, 13.8],
            ],
          ],
        },
      },
      createdAt: new Date(Date.now() - 86400000 * 0.5),
    },
  ];

  const defaultModels: MlModelRecord[] = [
    {
      id: "m001-rf-solar",
      name: "GeoSolar-RandomForest-v2.4",
      energyType: "solar",
      algorithm: "RandomForest",
      version: "v2.4.1",
      metrics: {
        r2Score: 0.924,
        rmse: 0.042,
        mae: 0.031,
        accuracy: 94.6,
        featureImportanceGhi: 0.48,
        featureImportanceSlope: 0.22,
        validationSamples: 1420,
      },
      isActive: "true",
      createdAt: new Date(Date.now() - 86400000 * 5),
    },
    {
      id: "m002-xgb-wind",
      name: "WindCorridor-XGBoost-v3.1",
      energyType: "wind",
      algorithm: "XGBoost",
      version: "v3.1.0",
      metrics: {
        r2Score: 0.897,
        rmse: 0.055,
        mae: 0.038,
        accuracy: 91.8,
        featureImportanceWind10m: 0.54,
        featureImportanceElevation: 0.19,
        validationSamples: 1280,
      },
      isActive: "true",
      createdAt: new Date(Date.now() - 86400000 * 4),
    },
    {
      id: "m003-gb-hydro",
      name: "DeepHydro-GradientBoost-v1.1",
      energyType: "hydro",
      algorithm: "GradientBoosting",
      version: "v1.1.2",
      metrics: {
        r2Score: 0.865,
        rmse: 0.068,
        mae: 0.049,
        accuracy: 88.4,
        featureImportancePrecipitation: 0.45,
        featureImportanceSlope: 0.35,
        validationSamples: 960,
      },
      isActive: "false",
      createdAt: new Date(Date.now() - 86400000 * 2),
    },
    {
      id: "m004-dbscan-geo",
      name: "GeoThermal-Cluster-DBSCAN-v1.2",
      energyType: "geothermal",
      algorithm: "DBSCAN",
      version: "v1.2.0",
      metrics: {
        silhouetteScore: 0.742,
        clustersFound: 6,
        noiseRatio: 0.08,
        validationSamples: 640,
      },
      isActive: "false",
      createdAt: new Date(Date.now() - 86400000 * 1),
    },
    {
      id: "m005-pca-hybrid",
      name: "HybridRenewable-PCA-v1.0",
      energyType: "solar",
      algorithm: "PCA",
      version: "v1.0.0",
      metrics: {
        explainedVariance: 92.1,
        components: 3,
        accuracy: 90.2,
        validationSamples: 850,
      },
      isActive: "true",
      createdAt: new Date(Date.now() - 86400000 * 0.5),
    },
  ];

  // Pre-seed an initial analysis for project 1
  const initialAnalysisId = "a0000000-0000-4000-8000-000000000001";
  const defaultAnalyses: AnalysisRecord[] = [
    {
      id: initialAnalysisId,
      projectId: proj1Id,
      energyType: "solar",
      status: "Completed",
      regionGeojson: defaultProjects[0].regionGeojson!,
      centroidLat: 30.3165,
      centroidLng: 78.0322,
      inputParams: { minSuitability: 55, cellSizeKm: 8 },
      metrics: {
        analyzedCells: 24,
        averageSuitability: 68.4,
        candidateCount: 8,
        minSuitability: 55,
        stage: "completed",
      },
      results: {
        dataSummary: {
          nasa: {
            ghiKwhM2Day: 5.42,
            dniKwhM2Day: 6.18,
            wind10mMs: 3.85,
            temperatureC: 22.4,
            precipitationMmDay: 3.2,
          },
          elevationM: 840,
          slopeDeg: 6,
        },
        assumptions: {
          note: "Deterministic baseline suitability screening completed with verified NASA POWER climatology.",
        },
      },
      createdAt: new Date(Date.now() - 86400000 * 2),
      updatedAt: new Date(Date.now() - 86400000 * 2),
    },
  ];

  const defaultSites: CandidateSiteRecord[] = [
    {
      id: "s001",
      analysisId: initialAnalysisId,
      siteId: "SOLAR-001",
      energyType: "solar",
      lat: 30.345,
      lng: 78.082,
      areaKm2: 14.2,
      suitability: 88.5,
      confidence: 0.94,
      boundaryGeojson: {},
      indicators: { ghiKwhM2Day: 5.45, slopeDeg: 3.2, distanceToGridKm: 4.1 },
      limitations: "Minor ridge shading during winter mornings; optimal for bifacial tracker arrays.",
      createdAt: new Date(Date.now() - 86400000 * 2),
    },
    {
      id: "s002",
      analysisId: initialAnalysisId,
      siteId: "SOLAR-002",
      energyType: "solar",
      lat: 30.285,
      lng: 77.965,
      areaKm2: 18.5,
      suitability: 84.2,
      confidence: 0.91,
      boundaryGeojson: {},
      indicators: { ghiKwhM2Day: 5.38, slopeDeg: 4.0, distanceToGridKm: 6.8 },
      limitations: "Proximity to secondary transmission corridor; straightforward road access.",
      createdAt: new Date(Date.now() - 86400000 * 2),
    },
    {
      id: "s003",
      analysisId: initialAnalysisId,
      siteId: "SOLAR-003",
      energyType: "solar",
      lat: 30.412,
      lng: 78.145,
      areaKm2: 11.8,
      suitability: 79.6,
      confidence: 0.88,
      boundaryGeojson: {},
      indicators: { ghiKwhM2Day: 5.29, slopeDeg: 5.5, distanceToGridKm: 9.2 },
      limitations: "Terraced plateau; civil leveling required for large utility modules.",
      createdAt: new Date(Date.now() - 86400000 * 2),
    },
  ];

  return {
    projects: defaultProjects,
    analyses: defaultAnalyses,
    candidateSites: defaultSites,
    mlModels: defaultModels,
  };
}

const memory = globalForStore.__geoRenewStandaloneStore ?? createInitialStore();
if (process.env.NODE_ENV !== "production") {
  globalForStore.__geoRenewStandaloneStore = memory;
}

export const storage = {
  // HEALTH & DIAGNOSTICS
  async checkHealth(): Promise<{
    ok: boolean;
    mode: "standalone";
    databaseRequired: false;
    engine: "embedded-in-memory";
    stats: {
      projects: number;
      analyses: number;
      models: number;
      candidateSites: number;
    };
  }> {
    return {
      ok: true,
      mode: "standalone",
      databaseRequired: false,
      engine: "embedded-in-memory",
      stats: {
        projects: memory.projects.length,
        analyses: memory.analyses.length,
        models: memory.mlModels.length,
        candidateSites: memory.candidateSites.length,
      },
    };
  },

  // PROJECTS
  async listProjects(): Promise<ProjectRecord[]> {
    return [...memory.projects].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  },

  async getProjectById(id: string): Promise<ProjectRecord | null> {
    return memory.projects.find((p) => p.id === id) ?? null;
  },

  async createProject(data: {
    name: string;
    description?: string;
    regionGeojson?: Record<string, unknown> | null;
  }): Promise<ProjectRecord> {
    const newProject: ProjectRecord = {
      id: crypto.randomUUID(),
      name: data.name,
      description: data.description ?? null,
      regionGeojson: data.regionGeojson ?? null,
      createdAt: new Date(),
    };
    memory.projects.unshift(newProject);
    return newProject;
  },

  async deleteProject(id: string): Promise<boolean> {
    const idx = memory.projects.findIndex((p) => p.id === id);
    if (idx === -1) return false;
    memory.projects.splice(idx, 1);
    return true;
  },

  async getProjectAnalyses(projectId: string): Promise<AnalysisRecord[]> {
    return memory.analyses
      .filter((a) => a.projectId === projectId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  },

  // ANALYSES
  async listAnalyses(): Promise<AnalysisRecord[]> {
    return [...memory.analyses].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  },

  async getAnalysisById(id: string): Promise<AnalysisRecord | null> {
    return memory.analyses.find((a) => a.id === id) ?? null;
  },

  async createAnalysis(data: {
    projectId?: string;
    energyType: string;
    status: string;
    regionGeojson: Record<string, unknown>;
    centroidLat: number;
    centroidLng: number;
    inputParams: Record<string, unknown>;
    metrics: Record<string, unknown>;
    results: Record<string, unknown>;
  }): Promise<AnalysisRecord> {
    const newAnalysis: AnalysisRecord = {
      id: crypto.randomUUID(),
      projectId: data.projectId ?? null,
      energyType: data.energyType,
      status: data.status,
      regionGeojson: data.regionGeojson,
      centroidLat: data.centroidLat,
      centroidLng: data.centroidLng,
      inputParams: data.inputParams,
      metrics: data.metrics,
      results: data.results,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    memory.analyses.unshift(newAnalysis);
    return newAnalysis;
  },

  async updateAnalysis(
    id: string,
    data: Partial<{
      status: string;
      metrics: Record<string, unknown>;
      results: Record<string, unknown>;
      centroidLat: number;
      centroidLng: number;
    }>,
  ): Promise<AnalysisRecord | null> {
    const existing = memory.analyses.find((a) => a.id === id);
    if (!existing) return null;

    if (data.status) existing.status = data.status;
    if (data.metrics) existing.metrics = { ...existing.metrics, ...data.metrics };
    if (data.results) existing.results = { ...existing.results, ...data.results };
    if (data.centroidLat !== undefined) existing.centroidLat = data.centroidLat;
    if (data.centroidLng !== undefined) existing.centroidLng = data.centroidLng;
    existing.updatedAt = new Date();

    return existing;
  },

  // CANDIDATE SITES
  async getCandidateSites(analysisId: string): Promise<CandidateSiteRecord[]> {
    return memory.candidateSites
      .filter((s) => s.analysisId === analysisId)
      .sort((a, b) => b.suitability - a.suitability);
  },

  async insertCandidateSites(
    sites: Array<{
      analysisId: string;
      siteId: string;
      energyType: string;
      lat: number;
      lng: number;
      areaKm2: number;
      suitability: number;
      confidence: number;
      boundaryGeojson: Record<string, unknown>;
      indicators: Record<string, unknown>;
      limitations: string;
    }>,
  ): Promise<CandidateSiteRecord[]> {
    const newSites: CandidateSiteRecord[] = sites.map((s) => ({
      ...s,
      id: crypto.randomUUID(),
      createdAt: new Date(),
    }));
    memory.candidateSites.push(...newSites);
    return newSites;
  },

  // ML MODELS
  async listMlModels(): Promise<MlModelRecord[]> {
    return [...memory.mlModels].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  },

  async createMlModel(data: {
    name: string;
    energyType: string;
    algorithm: string;
    metrics: Record<string, number>;
  }): Promise<MlModelRecord> {
    const version = `v${Date.now().toString().slice(-4)}`;
    const newModel: MlModelRecord = {
      id: crypto.randomUUID(),
      name: data.name,
      energyType: data.energyType,
      algorithm: data.algorithm,
      version,
      metrics: data.metrics,
      isActive: "true",
      createdAt: new Date(),
    };
    memory.mlModels.unshift(newModel);
    return newModel;
  },
};
