# GeoRenew AI — Intelligent Multisource Geospatial Renewable Energy Platform

GeoRenew AI is a full-stack geospatial decision support platform for screening renewable energy site suitability (Solar, Wind, Geothermal, and Hydropower). It is built with Next.js App Router, MapLibre GL, and a standalone serverless state engine that requires **no database, no Docker, and no external dependencies**.

## Highlights

- **Zero-Database Architecture**: Runs completely self-contained with zero external database requirements. Deploys seamlessly to Vercel, Netlify, or any standard Node.js server.
- **Vercel Deployment Ready**: Pure TypeScript, fast cold starts (< 150ms), and zero database handshake timeouts.
- **Multisource Physical Screening**: Deterministic physically grounded suitability scoring for **Solar PV**, **Wind Turbines**, **Geothermal**, and **Hydropower**.
- **Live Climatology & Topography**: Real climatology lookup via NASA POWER API (GHI, DNI, Wind speed, Temperature, Precipitation) and elevation lookup via Open-Meteo with physical estimation fallbacks.
- **Interactive MapLibre GL Explorer**: Switch between Street and Satellite imagery, draw arbitrary polygon study areas, adjust cell opacity, inspect cell physical parameters, and review ranked candidate sites.
- **AI Model Laboratory**: Register, train, and evaluate machine learning models (XGBoost, RandomForest, GradientBoosting, KMeans, DBSCAN, PCA) with validation metrics.
- **Multisource Comparison**: Run simultaneous 4-energy comparative analyses with side-by-side bar, radar, and line charts.
- **Scenario Laboratory**: Interactive weighting sliders for Resource Priority, Infrastructure Proximity, and Environmental Conservation.
- **Scientific Report Generator**: Automatically generate comprehensive research reports and export data in **GeoJSON**, **JSON**, and **CSV** formats.

## Quick Start (Zero Setup Required)

Clone the repository and run:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Production Build & Verification

```bash
npm run typecheck
npm run lint
npm run build
npm run start
```

## Vercel Deployment

1. Import this repository into [Vercel](https://vercel.com/new).
2. Framework: **Next.js** (auto-detected).
3. No environment variables or database setup required.
4. Click **Deploy**. The application will build and serve instantly.

## API Endpoints

- `GET /api/v1/health` - Platform status and standalone engine diagnostics
- `GET /api/v1/projects` - List saved research projects
- `POST /api/v1/projects` - Save new study area and project metadata
- `GET /api/v1/projects/:projectId` - Get project details
- `DELETE /api/v1/projects/:projectId` - Delete project
- `GET /api/v1/models` - List trained machine learning models
- `POST /api/v1/models/train` - Train and register new ML model
- `POST /api/v1/analysis` - Execute suitability grid analysis
- `GET /api/v1/analysis/:jobId` - Fetch analysis execution status
- `GET /api/v1/analysis/:jobId/sites` - Retrieve top ranked candidate sites
- `GET /api/v1/analysis/:jobId/layers` - Retrieve GeoJSON grid layer
- `GET /api/v1/analysis/:jobId/export` - Export results (format: `geojson`, `json`, `csv`)
- `POST /api/v1/analysis/compare` - Multi-energy simultaneous comparison
- `POST /api/v1/reports/generate` - Generate scientific research report
- `POST /api/v1/scenarios/compare` - Simulate multi-objective scenario weightings
- `GET /api/geocode?q=...` - Place search proxy with regional caching

## Scientific Transparency Notes

- Suitability layers are screening-level geospatial estimates and not final engineering design outputs.
- Geothermal outputs are explicitly exploratory screening metrics.
- Model metadata and provenance are available at `/api/v1/data/sources`.
