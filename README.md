# GeoRenew AI

GeoRenew AI is a full-stack geospatial renewable energy suitability platform with:

- Next.js App Router frontend + API routes
- PostgreSQL + Drizzle ORM persistence
- Interactive MapLibre map workspace
- Deterministic physically grounded baseline scoring for solar, wind, geothermal, and hydropower
- Data-source provenance API and analysis reporting
- FastAPI analytical backend scaffold in `backend/`

## Core Features

- Welcome page with research-style visual theme
- Global map explorer with street/satellite basemap toggle
- Region selection via circular study area, click-based center updates, and GeoJSON upload
- Place search via geocoding proxy (`/api/geocode`)
- Study area validation endpoint (`/api/v1/regions/validate`)
- Analysis engine with real NASA POWER climatology and real elevation lookup
- Full job-stage lifecycle tracking (`Queued`, `Fetching Data`, `Preprocessing`, `Running Models`, `Generating Spatial Results`, `Completed`, `Failed`)
- Grid suitability outputs, cell-level inspection, and ranked candidate sites
- Saved projects and reopen latest project analysis
- Multi-energy comparison run (solar/wind/geothermal/hydro)
- Report generation endpoint
- Export endpoints for GeoJSON, JSON, and CSV candidate-site tables

## Environment

Create `.env` with:

```env
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/app_db
```

## Run (Next.js app)

```bash
npm install
npx drizzle-kit push
npm run dev
```

## FastAPI backend scaffold

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

## Docker Compose (full local stack)

```bash
docker compose up --build
```

Services:
- Frontend: http://localhost:3000
- FastAPI backend: http://localhost:8000
- PostgreSQL/PostGIS: localhost:5432
- Redis: localhost:6379

## Acceptance workflow example

1. Open `/`
2. Click **Get Started**
3. Search `Dehradun, Uttarakhand, India`
4. Keep or adjust radius region
5. Choose Solar
6. Click **Start Analysis**
7. Inspect generated layer and candidate sites
8. Save project
9. Generate report by calling `/api/v1/reports/generate`

## Scientific transparency notes

- Suitability layers are screening-level and not final engineering design outputs.
- Geothermal outputs are explicitly exploratory if borehole-confirmed data is absent.
- No fabricated ML accuracy/performance values are emitted.
- Source metadata is available at `/api/v1/data/sources`.
