from fastapi import FastAPI
from pydantic import BaseModel
from typing import Any, Dict, List, Optional

app = FastAPI(title="GeoRenew AI Analytical Backend", version="1.0.0")


class RegionValidateRequest(BaseModel):
    regionGeojson: Dict[str, Any]


class AnalysisRequest(BaseModel):
    energyType: str
    regionGeojson: Dict[str, Any]
    params: Optional[Dict[str, Any]] = None


@app.get("/api/v1/health")
def health():
    return {"status": "ok", "service": "fastapi-analytics"}


@app.post("/api/v1/projects")
def create_project(payload: Dict[str, Any]):
    return {"status": "accepted", "project": payload}


@app.get("/api/v1/projects")
def list_projects():
    return {"projects": []}


@app.post("/api/v1/regions/validate")
def validate_region(payload: RegionValidateRequest):
    geom_type = payload.regionGeojson.get("geometry", {}).get("type") if payload.regionGeojson.get("type") == "Feature" else payload.regionGeojson.get("type")
    if geom_type not in ["Polygon", "MultiPolygon"]:
        return {"valid": False, "reason": "Only Polygon/MultiPolygon are supported"}
    return {"valid": True}


@app.post("/api/v1/data/ingest")
def ingest_data(payload: Dict[str, Any]):
    return {"status": "queued", "payload": payload}


@app.get("/api/v1/data/sources")
def data_sources():
    return {"sources": ["NASA POWER", "Open-Meteo Elevation"]}


@app.post("/api/v1/analysis")
def analysis(payload: AnalysisRequest):
    return {"job_id": "demo-job", "status": "Queued", "energyType": payload.energyType}


@app.get("/api/v1/analysis/{job_id}")
def analysis_job(job_id: str):
    return {"job_id": job_id, "status": "Completed"}


@app.get("/api/v1/analysis/{job_id}/results")
def analysis_results(job_id: str):
    return {"job_id": job_id, "results": {}}


@app.get("/api/v1/analysis/{job_id}/sites")
def analysis_sites(job_id: str):
    return {"job_id": job_id, "sites": []}


@app.get("/api/v1/analysis/{job_id}/layers")
def analysis_layers(job_id: str):
    return {"job_id": job_id, "layers": []}


@app.post("/api/v1/models/train")
def models_train(payload: Dict[str, Any]):
    return {"status": "queued", "payload": payload}


@app.get("/api/v1/models")
def models():
    return {"models": []}


@app.post("/api/v1/scenarios/compare")
def scenarios_compare(payload: Dict[str, Any]):
    return {"comparisons": [], "payload": payload}


@app.post("/api/v1/reports/generate")
def generate_report(payload: Dict[str, Any]):
    return {"status": "generated", "report": payload}
