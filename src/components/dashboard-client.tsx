"use client";

import { useEffect, useMemo, useState } from "react";
import * as turf from "@turf/turf";
import type { Feature, FeatureCollection, MultiPolygon, Polygon } from "geojson";
import GeoMap from "@/components/geo-map";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  PolarAngleAxis,
  PolarGrid,
  Line,
  LineChart,
} from "recharts";

const MODULES = [
  "Dashboard",
  "Global Map Explorer",
  "Solar Energy Analysis",
  "Wind Energy Analysis",
  "Geothermal Energy Analysis",
  "Hydropower Analysis",
  "Multisource Energy Comparison",
  "AI Model Laboratory",
  "Data Sources",
  "Saved Research Projects",
  "Report Generator",
  "Settings",
] as const;

type ModuleName = (typeof MODULES)[number];
type EnergyType = "solar" | "wind" | "geothermal" | "hydro";

type AnalysisApiResponse = {
  job?: {
    id: string;
    status: string;
    metrics: Record<string, unknown>;
    results: {
      layerGeojson?: Record<string, unknown>;
      dataSummary?: Record<string, unknown>;
    };
  };
  error?: string;
};

type ProjectRow = {
  id: string;
  name: string;
  description: string | null;
  regionGeojson: Record<string, unknown> | null;
};

type DataSourceRow = {
  provider: string;
  dataset: string;
  spatialResolution: string;
  temporalCoverage: string;
  license: string;
};

const PIE_COLORS = ["#166534", "#4ade80", "#fde047", "#fb923c", "#ef4444", "#9ca3af"];

function downloadTextFile(filename: string, text: string, mime = "application/json") {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function featureFromUnknown(input: unknown): Feature<Polygon | MultiPolygon> | null {
  if (!input || typeof input !== "object") return null;
  const g = input as { type?: string; geometry?: { type?: string } };

  if (g.type === "Feature" && (g.geometry?.type === "Polygon" || g.geometry?.type === "MultiPolygon")) {
    return input as Feature<Polygon | MultiPolygon>;
  }

  if (g.type === "Polygon" || g.type === "MultiPolygon") {
    return {
      type: "Feature",
      properties: {},
      geometry: input as Polygon | MultiPolygon,
    };
  }

  return null;
}

function moduleToEnergy(moduleName: ModuleName): EnergyType | null {
  if (moduleName === "Solar Energy Analysis") return "solar";
  if (moduleName === "Wind Energy Analysis") return "wind";
  if (moduleName === "Geothermal Energy Analysis") return "geothermal";
  if (moduleName === "Hydropower Analysis") return "hydro";
  return null;
}

export default function DashboardClient() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeModule, setActiveModule] = useState<ModuleName>("Dashboard");

  const [center, setCenter] = useState({ lat: 30.3165, lng: 78.0322 });
  const [searchPoint, setSearchPoint] = useState<{ lat: number; lng: number } | null>(null);
  const [energyType, setEnergyType] = useState<EnergyType>("solar");
  const [radiusKm, setRadiusKm] = useState(35);
  const [placeQuery, setPlaceQuery] = useState("Dehradun, Uttarakhand, India");

  const [drawMode, setDrawMode] = useState(false);
  const [drawPoints, setDrawPoints] = useState<Array<[number, number]>>([]);

  const [jobId, setJobId] = useState<string | null>(null);
  const [status, setStatus] = useState("Idle");
  const [layer, setLayer] = useState<Record<string, unknown> | null>(null);
  const [metrics, setMetrics] = useState<Record<string, unknown> | null>(null);
  const [dataSummary, setDataSummary] = useState<Record<string, unknown> | null>(null);
  const [sites, setSites] = useState<Array<Record<string, unknown>>>([]);
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [customRegion, setCustomRegion] = useState<Feature<Polygon | MultiPolygon> | null>(null);

  const [basemap, setBasemap] = useState<"street" | "satellite">("street");
  const [opacity, setOpacity] = useState(0.45);
  const [cellDetails, setCellDetails] = useState<Record<string, unknown> | null>(null);
  const [candidateDetails, setCandidateDetails] = useState<Record<string, unknown> | null>(null);
  const [comparisonData, setComparisonData] = useState<Array<{ energy: string; avg: number; candidates: number; confidence: number }>>([]);
  const [sources, setSources] = useState<DataSourceRow[]>([]);

  const [scenarioThreshold, setScenarioThreshold] = useState(60);
  const [scenarioResourcePriority, setScenarioResourcePriority] = useState(0.7);
  const [scenarioInfrastructurePriority, setScenarioInfrastructurePriority] = useState(0.6);
  const [scenarioEnvironmentalPriority, setScenarioEnvironmentalPriority] = useState(0.55);
  const [scenarioResults, setScenarioResults] = useState<Array<{ scenario: string; averageSuitability: number; candidateCells: number }>>([]);

  const circleRegion = useMemo(() => {
    return turf.circle([center.lng, center.lat], radiusKm, {
      steps: 96,
      units: "kilometers",
      properties: { name: "Study Area" },
    }) as Feature<Polygon>;
  }, [center, radiusKm]);

  const drawnRegion = useMemo(() => {
    if (drawPoints.length < 3) return null;
    try {
      const ring = [...drawPoints, drawPoints[0]];
      return turf.polygon([ring], { mode: "drawn" }) as Feature<Polygon>;
    } catch {
      return null;
    }
  }, [drawPoints]);

  const activeRegion = customRegion ?? drawnRegion ?? circleRegion;

  const classDistribution = useMemo(() => {
    const fc = layer as unknown as FeatureCollection | null;
    const features = fc?.features ?? [];
    const counter: Record<string, number> = {
      "Very High Suitability": 0,
      "High Suitability": 0,
      "Moderate Suitability": 0,
      "Low Suitability": 0,
      "Very Low Suitability": 0,
      "Restricted / Unavailable": 0,
    };

    for (const f of features) {
      const p = (f.properties ?? {}) as { class?: string; restricted?: boolean };
      if (p.restricted) {
        counter["Restricted / Unavailable"] += 1;
      } else if (p.class && counter[p.class] !== undefined) {
        counter[p.class] += 1;
      }
    }

    return Object.entries(counter).map(([name, value]) => ({ name, value }));
  }, [layer]);

  const radarData = useMemo(() => {
    const indicators = (cellDetails?.indicators ?? dataSummary ?? {}) as Record<string, unknown>;
    return [
      { metric: "Solar", value: Number(indicators.ghiKwhM2Day ?? 0) * 14 },
      { metric: "Wind", value: Number(indicators.wind10mMs ?? 0) * 10 },
      { metric: "Hydro", value: Number(indicators.precipitationMmDay ?? 0) * 8 },
      { metric: "Terrain", value: Math.max(0, 100 - Number(indicators.slopeDeg ?? 0) * 3) },
      { metric: "Grid Access", value: Math.max(0, 100 - Number(indicators.distanceToGridKm ?? 25) * 2) },
    ];
  }, [cellDetails, dataSummary]);

  useEffect(() => {
    void refreshProjects();
    void loadSources();
  }, []);

  async function refreshProjects() {
    const res = await fetch("/api/v1/projects", { cache: "no-store" });
    const json = (await res.json()) as { projects?: ProjectRow[] };
    setProjects(json.projects ?? []);
  }

  async function loadSources() {
    const res = await fetch("/api/v1/data/sources", { cache: "no-store" });
    const json = (await res.json()) as { sources?: DataSourceRow[] };
    setSources(json.sources ?? []);
  }

  function addDrawPoint(lng: number, lat: number) {
    setDrawPoints((prev) => [...prev, [lng, lat]]);
  }

  function undoDrawPoint() {
    setDrawPoints((prev) => prev.slice(0, -1));
  }

  function clearDrawRegion() {
    setDrawPoints([]);
    setCustomRegion(null);
    setStatus("Drawn region cleared");
  }

  function applyDrawRegion() {
    if (!drawnRegion) {
      setStatus("At least 3 points required for polygon");
      return;
    }
    setCustomRegion(drawnRegion);
    const c = turf.centroid(drawnRegion);
    const [lng, lat] = c.geometry.coordinates;
    setCenter({ lat, lng });
    setSearchPoint({ lat, lng });
    setStatus("Drawn polygon region applied");
  }

  async function searchPlace() {
    setStatus("Searching location...");
    const res = await fetch(`/api/geocode?q=${encodeURIComponent(placeQuery)}`);
    const json = (await res.json()) as { results?: Array<{ lat: number; lng: number }> };
    const first = json.results?.[0];
    if (first) {
      setCenter({ lat: first.lat, lng: first.lng });
      setSearchPoint({ lat: first.lat, lng: first.lng });
      setStatus("Location found and marked");
      setActiveModule("Global Map Explorer");
    } else {
      setStatus("No location match");
    }
  }

  async function submitAnalysis(energy: EnergyType, compareMode = false) {
    setStatus("Queued");

    const validateRes = await fetch("/api/v1/regions/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ regionGeojson: activeRegion }),
    });

    if (!validateRes.ok) {
      const fail = (await validateRes.json()) as { reason?: string };
      setStatus(fail.reason ?? "Region validation failed");
      return null;
    }

    const res = await fetch("/api/v1/analysis", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId: selectedProjectId || undefined,
        energyType: energy,
        regionGeojson: activeRegion,
        params: { minSuitability: scenarioThreshold, cellSizeKm: 8 },
      }),
    });

    const json = (await res.json()) as AnalysisApiResponse;

    if (!res.ok || !json.job) {
      setStatus(json.error ?? "Analysis failed");
      return null;
    }

    if (!compareMode) {
      setEnergyType(energy);
      setJobId(json.job.id);
      setStatus(json.job.status);
      setMetrics(json.job.metrics);
      setLayer(json.job.results?.layerGeojson ?? null);
      setDataSummary(json.job.results?.dataSummary ?? null);

      const sitesRes = await fetch(`/api/v1/analysis/${json.job.id}/sites`);
      const sitesJson = (await sitesRes.json()) as { sites?: Array<Record<string, unknown>> };
      setSites(sitesJson.sites ?? []);
    }

    return json.job;
  }

  async function runAnalysis() {
    await submitAnalysis(energyType);
  }

  async function runComparison() {
    setStatus("Running multi-energy comparison...");

    const res = await fetch("/api/v1/analysis/compare", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        regionGeojson: activeRegion,
        params: { minSuitability: scenarioThreshold, cellSizeKm: 8 },
      }),
    });

    const json = (await res.json()) as {
      comparisons?: Array<{
        energy: string;
        averageSuitability: number;
        candidateCount: number;
        confidenceMedian: number;
      }>;
      error?: string;
    };

    if (!res.ok || !json.comparisons) {
      setStatus(json.error ?? "Comparison failed");
      return;
    }

    setComparisonData(
      json.comparisons.map((c) => ({
        energy: c.energy,
        avg: c.averageSuitability,
        candidates: c.candidateCount,
        confidence: c.confidenceMedian,
      })),
    );

    setActiveModule("Multisource Energy Comparison");
    setStatus("Comparison completed");
  }

  async function runScenarioCompare() {
    if (!jobId) {
      setStatus("Run an analysis before scenario comparison");
      return;
    }

    const res = await fetch("/api/v1/scenarios/compare", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        analysisId: jobId,
        scenarios: [
          {
            name: "Balanced",
            threshold: scenarioThreshold,
            resourcePriority: scenarioResourcePriority,
            infrastructurePriority: scenarioInfrastructurePriority,
            environmentalPriority: scenarioEnvironmentalPriority,
          },
          {
            name: "Conservation Priority",
            threshold: Math.min(95, scenarioThreshold + 5),
            resourcePriority: Math.max(0, scenarioResourcePriority - 0.1),
            infrastructurePriority: Math.max(0, scenarioInfrastructurePriority - 0.1),
            environmentalPriority: Math.min(1, scenarioEnvironmentalPriority + 0.2),
          },
          {
            name: "Infrastructure Priority",
            threshold: Math.max(30, scenarioThreshold - 5),
            resourcePriority: Math.min(1, scenarioResourcePriority + 0.05),
            infrastructurePriority: Math.min(1, scenarioInfrastructurePriority + 0.2),
            environmentalPriority: Math.max(0, scenarioEnvironmentalPriority - 0.1),
          },
        ],
      }),
    });

    const json = (await res.json()) as {
      comparisons?: Array<{ scenario: string; averageSuitability: number; candidateCells: number }>;
      error?: string;
    };

    if (!res.ok || !json.comparisons) {
      setStatus(json.error ?? "Scenario comparison failed");
      return;
    }

    setScenarioResults(json.comparisons);
    setStatus("Scenario comparison completed");
  }

  async function saveProject() {
    const res = await fetch("/api/v1/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: `GeoRenew ${energyType.toUpperCase()} ${new Date().toLocaleDateString()}`,
        description: `Saved analysis around (${center.lat.toFixed(3)}, ${center.lng.toFixed(3)})`,
        regionGeojson: activeRegion,
      }),
    });

    if (!res.ok) {
      setStatus("Project save failed");
      return;
    }

    const saved = (await res.json()) as { project?: { id: string } };
    if (saved.project?.id) setSelectedProjectId(saved.project.id);

    await refreshProjects();
    setStatus("Project saved");
  }

  async function loadProject(projectId: string) {
    setSelectedProjectId(projectId);
    const project = projects.find((p) => p.id === projectId);
    if (!project) return;

    const parsedFeature = featureFromUnknown(project.regionGeojson);
    if (parsedFeature) {
      setCustomRegion(parsedFeature);
      setDrawPoints([]);
      const c = turf.centroid(parsedFeature);
      const [lng, lat] = c.geometry.coordinates;
      setCenter({ lat, lng });
      setSearchPoint({ lat, lng });
    }

    const analysesRes = await fetch(`/api/v1/projects/${projectId}/analyses`, { cache: "no-store" });
    const analysesJson = (await analysesRes.json()) as {
      analyses?: Array<{
        id: string;
        status: string;
        metrics: Record<string, unknown>;
        energyType: EnergyType;
        results: { layerGeojson?: Record<string, unknown>; dataSummary?: Record<string, unknown> };
      }>;
    };

    const latest = analysesJson.analyses?.[0];
    if (latest) {
      setJobId(latest.id);
      setStatus(latest.status);
      setEnergyType(latest.energyType);
      setMetrics(latest.metrics);
      setLayer(latest.results?.layerGeojson ?? null);
      setDataSummary(latest.results?.dataSummary ?? null);

      const sitesRes = await fetch(`/api/v1/analysis/${latest.id}/sites`);
      const sitesJson = (await sitesRes.json()) as { sites?: Array<Record<string, unknown>> };
      setSites(sitesJson.sites ?? []);
      setActiveModule("Saved Research Projects");
    }
  }

  async function importGeoJson(file: File) {
    const text = await file.text();
    const parsed = JSON.parse(text) as { type?: string; features?: unknown[] };

    let chosen: Feature<Polygon | MultiPolygon> | null = null;
    if (parsed.type === "FeatureCollection") {
      for (const f of parsed.features ?? []) {
        const candidate = featureFromUnknown(f);
        if (candidate) {
          chosen = candidate;
          break;
        }
      }
    } else {
      chosen = featureFromUnknown(parsed);
    }

    if (!chosen) {
      setStatus("GeoJSON must contain a Polygon/MultiPolygon feature");
      return;
    }

    setDrawPoints([]);
    setCustomRegion(chosen);
    const c = turf.centroid(chosen);
    const [lng, lat] = c.geometry.coordinates;
    setCenter({ lat, lng });
    setSearchPoint({ lat, lng });
    setStatus("GeoJSON region loaded");
  }

  async function generateReport() {
    if (!jobId) {
      setStatus("Run analysis before report generation");
      return;
    }

    const res = await fetch("/api/v1/reports/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ analysisId: jobId }),
    });

    const json = await res.json();
    downloadTextFile(`georenew-report-${jobId}.json`, JSON.stringify(json, null, 2));
    setActiveModule("Report Generator");
    setStatus("Report exported");
  }

  async function exportJson() {
    if (!jobId) return;
    const res = await fetch(`/api/v1/analysis/${jobId}/export?format=json`);
    const json = await res.json();
    downloadTextFile(`analysis-${jobId}.json`, JSON.stringify(json, null, 2));
  }

  async function exportGeojson() {
    if (!jobId) return;
    const res = await fetch(`/api/v1/analysis/${jobId}/export?format=geojson`);
    const json = await res.json();
    downloadTextFile(`analysis-${jobId}.geojson`, JSON.stringify(json, null, 2), "application/geo+json");
  }

  async function exportCsv() {
    if (!jobId) return;
    const res = await fetch(`/api/v1/analysis/${jobId}/export?format=csv`);
    const csv = await res.text();
    downloadTextFile(`analysis-${jobId}-sites.csv`, csv, "text/csv;charset=utf-8");
  }

  async function handleModuleClick(moduleName: ModuleName) {
    setActiveModule(moduleName);

    const mEnergy = moduleToEnergy(moduleName);
    if (mEnergy) {
      setEnergyType(mEnergy);
      await submitAnalysis(mEnergy);
      return;
    }

    if (moduleName === "Multisource Energy Comparison") {
      await runComparison();
      return;
    }

    if (moduleName === "Data Sources") {
      await loadSources();
      return;
    }

    if (moduleName === "Report Generator") {
      await generateReport();
    }
  }

  const chartData = [
    { metric: "Cells", value: Number(metrics?.analyzedCells ?? 0) },
    { metric: "Avg Score", value: Number(metrics?.averageSuitability ?? 0) },
    { metric: "Candidates", value: Number(metrics?.candidateCount ?? 0) },
  ];

  const candidatePoints = sites.map((site) => ({
    lat: Number(site.lat),
    lng: Number(site.lng),
    siteId: String(site.siteId),
    suitability: Number(site.suitability),
  }));

  return (
    <div className="h-screen overflow-hidden bg-zinc-950 text-zinc-100">
      <div className="flex h-full">
        <aside
          className={`${sidebarOpen ? "w-[280px]" : "w-0"} overflow-hidden border-r border-zinc-800 bg-zinc-950/95 transition-all duration-300`}
        >
          <div className="p-4">
            <h2 className="mb-4 text-lg font-semibold">GeoRenew AI</h2>
            <ul className="space-y-1 text-sm text-zinc-300">
              {MODULES.map((item) => (
                <li key={item}>
                  <button
                    onClick={() => void handleModuleClick(item)}
                    className={`w-full rounded-lg px-2 py-2 text-left transition ${activeModule === item ? "bg-cyan-700/60 text-white" : "hover:bg-zinc-800/80"}`}
                  >
                    {item}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        <section className="grid min-w-0 flex-1 grid-rows-[auto_1fr]">
          <div className="border-b border-zinc-800 bg-zinc-900/80 p-3">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setSidebarOpen((s) => !s)}
                className="rounded-lg border border-zinc-600 px-3 py-2 text-sm"
              >
                {sidebarOpen ? "Hide Sidebar" : "Show Sidebar"}
              </button>

              <input
                value={placeQuery}
                onChange={(e) => setPlaceQuery(e.target.value)}
                className="w-72 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
                placeholder="Search country/state/city"
              />
              <button onClick={searchPlace} className="rounded-lg bg-cyan-600 px-3 py-2 text-sm font-medium">
                Search & Mark
              </button>

              <select
                value={energyType}
                onChange={(e) => setEnergyType(e.target.value as EnergyType)}
                className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
              >
                <option value="solar">Solar</option>
                <option value="wind">Wind</option>
                <option value="geothermal">Geothermal</option>
                <option value="hydro">Hydro</option>
              </select>

              <label className="text-sm text-zinc-300">Radius</label>
              <input
                type="number"
                value={radiusKm}
                min={5}
                max={120}
                onChange={(e) => {
                  if (!drawMode) {
                    setCustomRegion(null);
                  }
                  setRadiusKm(Number(e.target.value));
                }}
                className="w-20 rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-2 text-sm"
              />

              <select
                value={basemap}
                onChange={(e) => setBasemap(e.target.value as "street" | "satellite")}
                className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
              >
                <option value="street">Street</option>
                <option value="satellite">Satellite</option>
              </select>

              <label className="text-xs text-zinc-300">Layer Opacity</label>
              <input
                type="range"
                min={0.1}
                max={0.95}
                step={0.05}
                value={opacity}
                onChange={(e) => setOpacity(Number(e.target.value))}
              />

              <button
                onClick={() => {
                  setDrawMode((v) => !v);
                  setStatus(drawMode ? "Draw mode disabled" : "Draw mode enabled: click map to add polygon vertices");
                }}
                className={`rounded-lg px-3 py-2 text-sm ${drawMode ? "bg-orange-600" : "border border-zinc-600"}`}
              >
                {drawMode ? "Stop Drawing" : "Draw Polygon"}
              </button>
              <button onClick={undoDrawPoint} className="rounded-lg border border-zinc-600 px-3 py-2 text-sm">
                Undo Point
              </button>
              <button onClick={applyDrawRegion} className="rounded-lg border border-zinc-600 px-3 py-2 text-sm">
                Apply Polygon
              </button>
              <button onClick={clearDrawRegion} className="rounded-lg border border-zinc-600 px-3 py-2 text-sm">
                Clear Region
              </button>

              <button
                onClick={runAnalysis}
                className="rounded-lg bg-gradient-to-r from-violet-600 to-cyan-500 px-4 py-2 text-sm font-semibold"
              >
                Start Analysis
              </button>
              <button onClick={runComparison} className="rounded-lg border border-zinc-600 px-4 py-2 text-sm">
                Compare 4 Energies
              </button>
              <button onClick={saveProject} className="rounded-lg border border-zinc-600 px-4 py-2 text-sm">
                Save Project
              </button>

              <label className="cursor-pointer rounded-lg border border-zinc-700 px-3 py-2 text-sm">
                Upload GeoJSON
                <input
                  type="file"
                  accept=".geojson,application/geo+json,application/json"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void importGeoJson(file);
                  }}
                />
              </label>
            </div>
          </div>

          <div className="relative min-w-0">
            <GeoMap
              selectedCenter={center}
              regionFeature={activeRegion}
              layerGeojson={layer}
              basemap={basemap}
              layerOpacity={opacity}
              selectedEnergy={energyType}
              searchPoint={searchPoint}
              candidatePoints={candidatePoints}
              drawMode={drawMode}
              drawPoints={drawPoints}
              onAddDrawPoint={addDrawPoint}
              onPickPoint={(lat, lng) => setCenter({ lat, lng })}
              onInspectCell={(payload) => setCellDetails(payload)}
              onInspectCandidate={(payload) => setCandidateDetails(payload)}
            />

            <div className="pointer-events-none absolute bottom-3 left-3 rounded-lg bg-black/65 p-2 text-xs text-zinc-100">
              <p className="font-semibold">Legend</p>
              <p className="mt-1">Dark Green: Very High</p>
              <p>Light Green: High</p>
              <p>Yellow: Moderate</p>
              <p>Orange: Low</p>
              <p>Red: Very Low</p>
              <p>Gray: Restricted/Unavailable</p>
            </div>
          </div>
        </section>

        <aside className="w-[430px] space-y-3 overflow-auto border-l border-zinc-800 bg-zinc-950/90 p-4 text-sm text-zinc-200">
          <h3 className="text-base font-semibold">Detailed Analysis Report</h3>
          <p className="text-zinc-400">Module: {activeModule}</p>
          <p className="text-zinc-400">Status: {status}</p>
          <p className="text-zinc-400">
            Coordinates: {center.lat.toFixed(4)}, {center.lng.toFixed(4)}
          </p>
          <p className="text-zinc-400">Energy: {energyType}</p>
          <p className="text-zinc-400">Draw Vertices: {drawPoints.length}</p>
          {jobId ? <p className="text-zinc-500">Job: {jobId}</p> : null}

          <div className="rounded-xl bg-zinc-900 p-2" style={{ height: 170 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="metric" stroke="#d4d4d8" fontSize={12} />
                <YAxis stroke="#d4d4d8" fontSize={12} />
                <Tooltip />
                <Bar dataKey="value" fill="#22d3ee" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-xl border border-zinc-700 p-3">
            <h4 className="font-medium">Suitability Class Distribution</h4>
            <div className="mt-2" style={{ height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={classDistribution} dataKey="value" nameKey="name" outerRadius={70} label>
                    {classDistribution.map((entry, index) => (
                      <Cell key={`${entry.name}-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-700 p-3">
            <h4 className="font-medium">Energy Comparison</h4>
            <div className="mt-2" style={{ height: 210 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparisonData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
                  <XAxis dataKey="energy" stroke="#d4d4d8" fontSize={12} />
                  <YAxis stroke="#d4d4d8" fontSize={12} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="avg" fill="#06b6d4" name="Average Suitability" />
                  <Bar dataKey="candidates" fill="#84cc16" name="Candidate Cells" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2" style={{ height: 140 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={comparisonData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
                  <XAxis dataKey="energy" stroke="#d4d4d8" fontSize={12} />
                  <YAxis stroke="#d4d4d8" fontSize={12} />
                  <Tooltip />
                  <Line type="monotone" dataKey="confidence" stroke="#f59e0b" name="Confidence Median" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-700 p-3">
            <h4 className="font-medium">Scenario Laboratory</h4>
            <div className="mt-2 space-y-2 text-xs">
              <label className="block">Threshold: {scenarioThreshold}</label>
              <input type="range" min={20} max={95} value={scenarioThreshold} onChange={(e) => setScenarioThreshold(Number(e.target.value))} />
              <label className="block">Resource Priority: {scenarioResourcePriority.toFixed(2)}</label>
              <input type="range" min={0} max={1} step={0.05} value={scenarioResourcePriority} onChange={(e) => setScenarioResourcePriority(Number(e.target.value))} />
              <label className="block">Infrastructure Priority: {scenarioInfrastructurePriority.toFixed(2)}</label>
              <input type="range" min={0} max={1} step={0.05} value={scenarioInfrastructurePriority} onChange={(e) => setScenarioInfrastructurePriority(Number(e.target.value))} />
              <label className="block">Environmental Priority: {scenarioEnvironmentalPriority.toFixed(2)}</label>
              <input type="range" min={0} max={1} step={0.05} value={scenarioEnvironmentalPriority} onChange={(e) => setScenarioEnvironmentalPriority(Number(e.target.value))} />
              <button onClick={runScenarioCompare} className="rounded-md bg-cyan-700 px-2 py-1 text-xs">Run Scenario Compare</button>
            </div>
            <div className="mt-2 max-h-28 overflow-auto text-xs">
              {scenarioResults.map((r) => (
                <div key={r.scenario} className="mb-1 rounded bg-zinc-900 p-1">
                  <p className="font-semibold">{r.scenario}</p>
                  <p>Avg: {r.averageSuitability.toFixed(2)} | Candidate Cells: {r.candidateCells}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-zinc-700 p-3">
            <h4 className="font-medium">Resource Radar (Selected Cell/Region)</h4>
            <div className="mt-2" style={{ height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="metric" />
                  <Radar dataKey="value" stroke="#22d3ee" fill="#22d3ee" fillOpacity={0.45} />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-700 p-3">
            <h4 className="font-medium">Saved Projects</h4>
            <select
              value={selectedProjectId}
              onChange={(e) => void loadProject(e.target.value)}
              className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-2 text-sm"
            >
              <option value="">Select a project</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-xl border border-zinc-700 p-3">
            <h4 className="font-medium">Report & Export</h4>
            <div className="mt-2 flex flex-wrap gap-2">
              <button onClick={generateReport} className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs">Generate Report</button>
              <button onClick={exportGeojson} className="rounded-lg border border-zinc-600 px-3 py-1.5 text-xs">Export GeoJSON</button>
              <button onClick={exportCsv} className="rounded-lg border border-zinc-600 px-3 py-1.5 text-xs">Export CSV</button>
              <button onClick={exportJson} className="rounded-lg border border-zinc-600 px-3 py-1.5 text-xs">Export JSON</button>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-700 p-3">
            <h4 className="font-medium">Clicked Cell Details</h4>
            <pre className="mt-2 max-h-24 overflow-auto whitespace-pre-wrap text-xs text-zinc-300">
              {JSON.stringify(cellDetails, null, 2)}
            </pre>
            <h4 className="mt-3 font-medium">Clicked Candidate Site</h4>
            <pre className="mt-2 max-h-24 overflow-auto whitespace-pre-wrap text-xs text-zinc-300">
              {JSON.stringify(candidateDetails, null, 2)}
            </pre>
          </div>

          {activeModule === "Data Sources" ? (
            <div className="rounded-xl border border-zinc-700 p-3">
              <h4 className="font-medium">Data Sources</h4>
              <div className="mt-2 space-y-2">
                {sources.map((s) => (
                  <div key={`${s.provider}-${s.dataset}`} className="rounded-lg bg-zinc-900 p-2 text-xs">
                    <p className="font-semibold">{s.provider} — {s.dataset}</p>
                    <p>Resolution: {s.spatialResolution}</p>
                    <p>Coverage: {s.temporalCoverage}</p>
                    <p>License: {s.license}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
