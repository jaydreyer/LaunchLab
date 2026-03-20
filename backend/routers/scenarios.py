"""API routes for scenario definitions."""

from fastapi import APIRouter, HTTPException
from scenarios.definitions import get_scenario, list_scenarios
from schemas.scenario import ScenarioResponse, ScenarioSummary

router = APIRouter(prefix="/api/scenarios", tags=["scenarios"])


@router.get("", response_model=list[ScenarioSummary])
async def list_all_scenarios() -> list[ScenarioSummary]:
    """List all available scenario definitions."""
    return [
        ScenarioSummary(
            name=s.name,
            label=s.label,
            description=s.description,
            category=s.category,
            expected_outcome=s.expected_outcome,
            evaluation_criteria=list(s.evaluation_criteria),
        )
        for s in list_scenarios()
    ]


@router.get("/{scenario_name}", response_model=ScenarioResponse)
async def get_scenario_detail(scenario_name: str) -> ScenarioResponse:
    """Get full details for a specific scenario."""
    scenario = get_scenario(scenario_name)
    if not scenario:
        raise HTTPException(status_code=404, detail="Scenario not found")
    return ScenarioResponse(
        name=scenario.name,
        label=scenario.label,
        description=scenario.description,
        category=scenario.category,
        patient_persona=scenario.patient_persona,
        expected_outcome=scenario.expected_outcome,
        evaluation_criteria=scenario.evaluation_criteria,
        tool_overrides=scenario.tool_overrides,
    )
