"""API routes for the launch readiness dashboard."""

from database import get_db
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import PlainTextResponse
from models.practice import PracticeProfile
from schemas.dashboard import (
    CategoryScore,
    FailureTheme,
    ReadinessResponse,
)
from services.readiness import compute_readiness
from services.readiness_export import generate_report_markdown
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/readiness", response_model=ReadinessResponse)
async def get_readiness(
    practice_id: str = Query(..., description="Practice ID to assess"),
    db: AsyncSession = Depends(get_db),
) -> ReadinessResponse:
    """Get the launch readiness assessment for a practice.

    Computes readiness from the latest completed eval run.
    Returns 404 if no completed eval runs exist.
    """
    result = await compute_readiness(db, practice_id)
    if not result:
        raise HTTPException(
            status_code=404,
            detail="No completed eval runs found for this practice.",
        )

    return ReadinessResponse(
        overall_score=result.overall_score,
        readiness_level=result.readiness_level,
        recommendation=result.recommendation,
        category_scores=[
            CategoryScore(
                category=cs.category,
                pass_rate=cs.pass_rate,
                avg_score=cs.avg_score,
                case_count=cs.case_count,
                status=cs.status,
            )
            for cs in result.category_scores
        ],
        failure_themes=[
            FailureTheme(
                theme=ft.theme,
                count=ft.count,
                severity=ft.severity,
                affected_scenarios=ft.affected_scenarios,
            )
            for ft in result.failure_themes
        ],
        constraints=result.constraints,
        eval_run_id=result.eval_run_id,
        eval_run_date=result.eval_run_date,
        scenario_count=result.scenario_count,
        pass_count=result.pass_count,
    )


@router.get(
    "/readiness/export",
    response_class=PlainTextResponse,
    responses={200: {"content": {"text/markdown": {}}}},
)
async def export_readiness_report(
    practice_id: str = Query(..., description="Practice ID to export"),
    db: AsyncSession = Depends(get_db),
) -> PlainTextResponse:
    """Export the readiness report as a markdown document."""
    result = await compute_readiness(db, practice_id)
    if not result:
        raise HTTPException(
            status_code=404,
            detail="No completed eval runs found for this practice.",
        )

    # Fetch practice name
    practice_result = await db.execute(
        select(PracticeProfile).where(PracticeProfile.id == practice_id)
    )
    practice = practice_result.scalar_one_or_none()
    practice_name = practice.name if practice else "Unknown Practice"

    report = generate_report_markdown(result, practice_name)

    return PlainTextResponse(
        content=report,
        media_type="text/markdown",
        headers={"Content-Disposition": "attachment; filename=readiness-report.md"},
    )
