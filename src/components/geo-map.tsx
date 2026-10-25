"use client";

import * as maplibregl from "maplibre-gl";
import { type GeoJSONSource, type Map, type MapMouseEvent } from "maplibre-gl";
import type { Feature, FeatureCollection, LineString, MultiPolygon, Point, Polygon } from "geojson";
import { useEffect, useRef } from "react";

type Props = {
  selectedCenter: { lat: number; lng: number };
  regionFeature: Feature<Polygon | MultiPolygon> | null;
  layerGeojson: Record<string, unknown> | null;
  basemap: "street" | "satellite";
  layerOpacity: number;
  selectedEnergy: "solar" | "wind" | "geothermal" | "hydro";
  searchPoint: { lat: number; lng: number } | null;
  candidatePoints: Array<{ lat: number; lng: number; siteId: string; suitability: number }>;
  drawMode: boolean;
  drawPoints: Array<[number, number]>;
  onAddDrawPoint: (lng: number, lat: number) => void;
  onPickPoint: (lat: number, lng: number) => void;
  onInspectCell: (payload: Record<string, unknown> | null) => void;
  onInspectCandidate: (payload: Record<string, unknown> | null) => void;
};

const STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: "raster",
      tiles: ["https://a.tile.openstreetmap.org/{z}/{x}/{y}.png", "https://b.tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: "© OpenStreetMap contributors",
    },
    satellite: {
      type: "raster",
      tiles: [
        "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      ],
      tileSize: 256,
      attribution: "© Esri",
    },
  },
  layers: [
    { id: "osm", type: "raster", source: "osm" },
    { id: "satellite", type: "raster", source: "satellite", layout: { visibility: "none" } },
  ],
};

const paletteByEnergy = {
  solar: ["#451a03", "#a16207", "#f59e0b", "#fef08a"],
  wind: ["#082f49", "#0369a1", "#06b6d4", "#a5f3fc"],
  geothermal: ["#3f0a0a", "#991b1b", "#dc2626", "#fca5a5"],
  hydro: ["#0c4a6e", "#1d4ed8", "#2563eb", "#93c5fd"],
};

export default function GeoMap({
  selectedCenter,
  regionFeature,
  layerGeojson,
  basemap,
  layerOpacity,
  selectedEnergy,
  searchPoint,
  candidatePoints,
  drawMode,
  drawPoints,
  onAddDrawPoint,
  onPickPoint,
  onInspectCell,
  onInspectCandidate,
}: Props) {
  const mapRef = useRef<Map | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: STYLE,
      center: [selectedCenter.lng, selectedCenter.lat],
      zoom: 4,
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: true }), "top-right");

    map.on("click", (e: MapMouseEvent) => {
      if (drawMode) {
        onAddDrawPoint(e.lngLat.lng, e.lngLat.lat);
        return;
      }

      const candidateFeatures = map.queryRenderedFeatures(e.point, { layers: ["candidate-points"] });
      if (candidateFeatures?.[0]?.properties) {
        onInspectCandidate(candidateFeatures[0].properties as Record<string, unknown>);
        return;
      }

      const features = map.queryRenderedFeatures(e.point, { layers: ["analysis-fill"] });
      const inspected = features?.[0]?.properties as Record<string, unknown> | undefined;
      onInspectCell(inspected ?? null);
      onPickPoint(e.lngLat.lat, e.lngLat.lng);
    });

    map.on("load", () => {
      map.addSource("region", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
      map.addLayer({
        id: "region-fill",
        type: "fill",
        source: "region",
        paint: {
          "fill-color": "#22d3ee",
          "fill-opacity": 0.12,
        },
      });
      map.addLayer({
        id: "region-line",
        type: "line",
        source: "region",
        paint: {
          "line-color": "#06b6d4",
          "line-width": 2,
        },
      });

      map.addSource("analysis", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
      map.addLayer({
        id: "analysis-fill",
        type: "fill",
        source: "analysis",
        paint: {
          "fill-color": [
            "interpolate",
            ["linear"],
            ["coalesce", ["get", "suitability"], 0],
            0,
            "#ef4444",
            25,
            "#fb923c",
            45,
            "#fde047",
            65,
            "#4ade80",
            80,
            "#166534",
          ],
          "fill-opacity": 0.45,
        },
      });
      map.addLayer({
        id: "analysis-line",
        type: "line",
        source: "analysis",
        paint: {
          "line-color": "#111827",
          "line-opacity": 0.2,
          "line-width": 1,
        },
      });

      map.addSource("search-point", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
      map.addLayer({
        id: "search-point-halo",
        type: "circle",
        source: "search-point",
        paint: {
          "circle-color": "#ffffff",
          "circle-radius": 12,
          "circle-opacity": 0.25,
        },
      });
      map.addLayer({
        id: "search-point-core",
        type: "circle",
        source: "search-point",
        paint: {
          "circle-color": "#f43f5e",
          "circle-radius": 6,
          "circle-stroke-width": 2,
          "circle-stroke-color": "#ffffff",
        },
      });

      map.addSource("candidate-sites", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
      map.addLayer({
        id: "candidate-points",
        type: "circle",
        source: "candidate-sites",
        paint: {
          "circle-color": "#f8fafc",
          "circle-radius": 4,
          "circle-stroke-width": 1.5,
          "circle-stroke-color": "#1d4ed8",
        },
      });

      map.addSource("draw-line", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
      map.addLayer({
        id: "draw-line-layer",
        type: "line",
        source: "draw-line",
        paint: {
          "line-color": "#f97316",
          "line-width": 3,
          "line-dasharray": [1, 1],
        },
      });

      map.addSource("draw-points", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
      map.addLayer({
        id: "draw-points-layer",
        type: "circle",
        source: "draw-points",
        paint: {
          "circle-color": "#f97316",
          "circle-radius": 4,
          "circle-stroke-width": 1.5,
          "circle-stroke-color": "#ffffff",
        },
      });
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [drawMode, onAddDrawPoint, onInspectCandidate, onInspectCell, onPickPoint, selectedCenter.lat, selectedCenter.lng]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    map.getCanvas().style.cursor = drawMode ? "crosshair" : "default";
  }, [drawMode]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    map.flyTo({
      center: [selectedCenter.lng, selectedCenter.lat],
      zoom: Math.max(5, map.getZoom()),
      essential: true,
    });
  }, [selectedCenter]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    map.setLayoutProperty("osm", "visibility", basemap === "street" ? "visible" : "none");
    map.setLayoutProperty("satellite", "visibility", basemap === "satellite" ? "visible" : "none");
  }, [basemap]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    map.setPaintProperty("analysis-fill", "fill-opacity", layerOpacity);
  }, [layerOpacity]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    const palette = paletteByEnergy[selectedEnergy];
    map.setPaintProperty("analysis-fill", "fill-color", [
      "interpolate",
      ["linear"],
      ["coalesce", ["get", "suitability"], 0],
      0,
      palette[0],
      35,
      palette[1],
      60,
      palette[2],
      85,
      palette[3],
    ]);
  }, [selectedEnergy]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    const source = map.getSource("region") as GeoJSONSource | undefined;
    if (!source) return;

    source.setData(
      regionFeature
        ? { type: "FeatureCollection", features: [regionFeature] }
        : { type: "FeatureCollection", features: [] },
    );
  }, [regionFeature]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    const source = map.getSource("analysis") as GeoJSONSource | undefined;
    if (!source) return;

    source.setData(
      (layerGeojson as unknown as FeatureCollection) ?? {
        type: "FeatureCollection",
        features: [],
      },
    );
  }, [layerGeojson]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    const source = map.getSource("search-point") as GeoJSONSource | undefined;
    if (!source) return;

    const collection: FeatureCollection<Point> = searchPoint
      ? {
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              geometry: {
                type: "Point",
                coordinates: [searchPoint.lng, searchPoint.lat],
              },
              properties: { kind: "search" },
            },
          ],
        }
      : { type: "FeatureCollection", features: [] };

    source.setData(collection);
  }, [searchPoint]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    const source = map.getSource("candidate-sites") as GeoJSONSource | undefined;
    if (!source) return;

    const collection: FeatureCollection<Point> = {
      type: "FeatureCollection",
      features: candidatePoints.map((c) => ({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [c.lng, c.lat],
        },
        properties: {
          siteId: c.siteId,
          suitability: c.suitability,
        },
      })),
    };

    source.setData(collection);
  }, [candidatePoints]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    const pointSource = map.getSource("draw-points") as GeoJSONSource | undefined;
    const lineSource = map.getSource("draw-line") as GeoJSONSource | undefined;
    if (!pointSource || !lineSource) return;

    const pointsCollection: FeatureCollection<Point> = {
      type: "FeatureCollection",
      features: drawPoints.map((c) => ({
        type: "Feature",
        geometry: { type: "Point", coordinates: c },
        properties: {},
      })),
    };

    const lineFeature: Feature<LineString> | null =
      drawPoints.length >= 2
        ? {
            type: "Feature",
            geometry: {
              type: "LineString",
              coordinates: drawPoints,
            },
            properties: {},
          }
        : null;

    pointSource.setData(pointsCollection);
    lineSource.setData({
      type: "FeatureCollection",
      features: lineFeature ? [lineFeature] : [],
    });
  }, [drawPoints]);

  return <div ref={containerRef} className="h-full w-full" />;
}
