import logging
from contextlib import asynccontextmanager
from pathlib import Path

from config import settings
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from routers.agent_configs import preview_router as agent_config_preview_router
from routers.agent_configs import reset_router as agent_config_reset_router
from routers.agent_configs import router as agent_configs_router
from routers.dashboard import router as dashboard_router
from routers.evals import router as evals_router
from routers.practices import reset_router as practice_reset_router
from routers.practices import router as practices_router
from routers.scenarios import router as scenarios_router
from routers.simulations import router as simulations_router

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    logging.basicConfig(level=getattr(logging, settings.log_level.upper()))
    logger.info("LaunchLab starting up (env=%s)", settings.environment)
    yield
    logger.info("LaunchLab shutting down")


app = FastAPI(
    title="LaunchLab",
    description="Healthcare Agent Launch Simulator",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(practices_router)
app.include_router(practice_reset_router)
app.include_router(agent_configs_router)
app.include_router(agent_config_reset_router)
app.include_router(agent_config_preview_router)
app.include_router(dashboard_router)
app.include_router(evals_router)
app.include_router(scenarios_router)
app.include_router(simulations_router)


@app.get("/api/health")
async def health_check():
    return {"status": "ok", "environment": settings.environment}


# --- Serve frontend static build in production ---
FRONTEND_DIST = Path(__file__).resolve().parent.parent / "frontend" / "dist"

if FRONTEND_DIST.is_dir():
    app.mount("/assets", StaticFiles(directory=FRONTEND_DIST / "assets"), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        """Serve the React SPA for all non-API routes."""
        file_path = FRONTEND_DIST / full_path
        if file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(FRONTEND_DIST / "index.html")
