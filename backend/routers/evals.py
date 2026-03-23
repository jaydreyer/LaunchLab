"""API routes for eval runs."""

from database import get_db
from fastapi import APIRouter, Depends, HTTPException
from schemas.eval import (
    EvalCaseResponse,
    EvalRunCreate,
    EvalRunResponse,
    EvalRunSummary,
)
from services import eval_runner
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(prefix="/api/eval_runs", tags=["evals"])


@router.post("", response_model=EvalRunSummary, status_code=202)
async def start_eval_run(
    data: EvalRunCreate,
    db: AsyncSession = Depends(get_db),
) -> EvalRunSummary:
    """Start a new eval suite run.

    The run executes in the background. Poll GET /api/eval_runs/{id}
    to check progress.
    """
    eval_run = await eval_runner.run_suite(
        db=db,
        practice_id=data.practice_id,
        config_id=data.config_id,
        suite_name=data.suite_name,
    )
    return EvalRunSummary.model_validate(eval_run)


@router.get("", response_model=list[EvalRunSummary])
async def list_eval_runs(
    db: AsyncSession = Depends(get_db),
) -> list[EvalRunSummary]:
    """List all eval runs (newest first)."""
    runs = await eval_runner.list_eval_runs(db)
    return [EvalRunSummary.model_validate(r) for r in runs]


@router.get("/{eval_run_id}", response_model=EvalRunResponse)
async def get_eval_run(
    eval_run_id: str,
    db: AsyncSession = Depends(get_db),
) -> EvalRunResponse:
    """Get an eval run with all its cases."""
    eval_run, cases = await eval_runner.get_eval_run(db, eval_run_id)
    if not eval_run:
        raise HTTPException(status_code=404, detail="Eval run not found")

    run_data = EvalRunResponse.model_validate(eval_run)
    run_data.cases = [EvalCaseResponse.model_validate(c) for c in cases]
    return run_data
