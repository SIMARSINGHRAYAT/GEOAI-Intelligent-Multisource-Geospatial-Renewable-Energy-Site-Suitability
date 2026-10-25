import { pgTable, uuid, text, timestamp, jsonb, doublePrecision } from "drizzle-orm/pg-core";

export const projects = pgTable("projects", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  regionGeojson: jsonb("region_geojson").$type<Record<string, unknown> | null>().default(null),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const analyses = pgTable("analyses", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: uuid("project_id").references(() => projects.id, { onDelete: "set null" }),
  energyType: text("energy_type").notNull(),
  status: text("status").notNull().default("Queued"),
  regionGeojson: jsonb("region_geojson").$type<Record<string, unknown>>().notNull(),
  centroidLat: doublePrecision("centroid_lat").notNull(),
  centroidLng: doublePrecision("centroid_lng").notNull(),
  inputParams: jsonb("input_params").$type<Record<string, unknown>>().notNull(),
  metrics: jsonb("metrics").$type<Record<string, unknown>>().notNull(),
  results: jsonb("results").$type<Record<string, unknown>>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const candidateSites = pgTable("candidate_sites", {
  id: uuid("id").defaultRandom().primaryKey(),
  analysisId: uuid("analysis_id")
    .references(() => analyses.id, { onDelete: "cascade" })
    .notNull(),
  siteId: text("site_id").notNull(),
  energyType: text("energy_type").notNull(),
  lat: doublePrecision("lat").notNull(),
  lng: doublePrecision("lng").notNull(),
  areaKm2: doublePrecision("area_km2").notNull(),
  suitability: doublePrecision("suitability").notNull(),
  confidence: doublePrecision("confidence").notNull(),
  boundaryGeojson: jsonb("boundary_geojson").$type<Record<string, unknown>>().notNull(),
  indicators: jsonb("indicators").$type<Record<string, unknown>>().notNull(),
  limitations: text("limitations").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const mlModels = pgTable("ml_models", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  energyType: text("energy_type").notNull(),
  algorithm: text("algorithm").notNull(),
  version: text("version").notNull(),
  metrics: jsonb("metrics").$type<Record<string, unknown>>().notNull(),
  isActive: text("is_active").notNull().default("false"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
