import logging
from contextlib import asynccontextmanager

from config import settings
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

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


@app.get("/api/health")
async def health_check():
    return {"status": "ok", "environment": settings.environment}
