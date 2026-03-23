"""LLM-as-Judge — third LLM subsystem that grades eval cases.

Calls Claude with a structured tool_use pattern to evaluate completed
conversation transcripts against scenario-defined criteria. Updates
EvalCase records with scores, pass/fail, and reasoning.
"""

import json
import logging
from datetime import UTC, datetime
from typing import Any

import anthropic
from config import settings
from models.eval_case import EvalCase
from prompts.judge import (
    JUDGE_SYSTEM_PROMPT,
    JUDGE_TOOL,
    build_judge_user_message,
)
from scenarios.definitions import ScenarioDefinition
from sqlalchemy.ext.asyncio import AsyncSession

from services.judge_rubrics import (
    Criterion,
    build_criteria_for_scenario,
    check_critical_failures,
    compute_weighted_score,
    criteria_to_prompt_json,
)

logger = logging.getLogger(__name__)

MAX_RETRIES = 1


async def evaluate_case(
    db: AsyncSession,
    eval_case: EvalCase,
    scenario: ScenarioDefinition,
) -> EvalCase:
    """Call the LLM-as-Judge to evaluate a single eval case.

    Builds structured criteria from the scenario, sends the transcript to
    Claude with a tool_use pattern, parses the response, and updates the
    EvalCase record with criteria_results, passed, score, and failure_reasons.
    """
    criteria = build_criteria_for_scenario(scenario)
    criteria_json = criteria_to_prompt_json(criteria)

    actual = eval_case.actual_behavior or {}
    transcript = actual.get("transcript", [])
    tool_calls = actual.get("tool_calls", [])
    escalation = actual.get("escalation")

    # Determine outcome string
    if actual.get("error"):
        outcome = "error: scenario execution failed"
    elif escalation:
        outcome = f"escalated: {json.dumps(escalation)}"
    elif actual.get("max_turns_hit"):
        outcome = "max turns reached without resolution"
    else:
        outcome = "completed normally"

    user_message = build_judge_user_message(
        scenario_name=scenario.name,
        scenario_description=scenario.description,
        expected_outcome=scenario.expected_outcome,
        criteria_json=criteria_json,
        transcript=transcript,
        tool_calls=tool_calls,
        outcome=outcome,
    )

    # Call the judge with retry
    evaluations = await _call_judge(user_message, retries=MAX_RETRIES)

    if evaluations is None:
        # Judge failed after retries — mark as error
        eval_case.criteria_results = {"error": "judge_error"}
        eval_case.passed = False
        eval_case.score = 0.0
        eval_case.failure_reasons = {"judge": "Judge failed to produce results"}
        eval_case.judged_at = datetime.now(UTC)
        await db.commit()
        return eval_case

    # Align evaluations with criteria (handle length mismatches)
    aligned = _align_evaluations(criteria, evaluations)

    # Compute score and pass/fail
    score = compute_weighted_score(criteria, aligned)
    critical_failures = check_critical_failures(criteria, aligned)

    # Overall pass: all criteria pass AND no critical failures
    all_passed = all(r.get("passed") for r in aligned)
    passed = all_passed and len(critical_failures) == 0

    # Build failure_reasons dict
    failure_reasons: dict[str, str] = {}
    for criterion, result in zip(criteria, aligned, strict=False):
        if not result.get("passed"):
            failure_reasons[criterion.id] = result.get("reasoning", "No reason given")

    # Build criteria_results dict
    criteria_results: dict[str, Any] = {}
    for criterion, result in zip(criteria, aligned, strict=False):
        criteria_results[criterion.id] = {
            "description": criterion.description,
            "category": criterion.category,
            "is_critical": criterion.is_critical,
            "passed": result.get("passed", False),
            "reasoning": result.get("reasoning", ""),
            "severity": result.get("severity"),
            "weight": criterion.weight,
        }

    # Update the eval case
    eval_case.criteria_results = criteria_results
    eval_case.passed = passed
    eval_case.score = score
    eval_case.failure_reasons = failure_reasons if failure_reasons else None
    eval_case.judged_at = datetime.now(UTC)

    await db.commit()

    logger.info(
        "Judged case '%s': passed=%s, score=%.2f, failures=%d",
        eval_case.scenario_name,
        passed,
        score,
        len(failure_reasons),
    )

    return eval_case


async def _call_judge(
    user_message: str,
    retries: int = 0,
) -> list[dict[str, Any]] | None:
    """Call Claude with the judge prompt and parse the tool_use response.

    Uses the submit_evaluation tool pattern to force structured output.
    Returns the evaluations list or None on failure.
    """
    client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)

    for attempt in range(retries + 1):
        try:
            response = await client.messages.create(
                model=settings.anthropic_model,
                max_tokens=4096,
                system=JUDGE_SYSTEM_PROMPT,
                messages=[{"role": "user", "content": user_message}],
                tools=[JUDGE_TOOL],
                tool_choice={"type": "tool", "name": "submit_evaluation"},
            )

            # Extract the tool_use block
            for block in response.content:
                if block.type == "tool_use" and block.name == "submit_evaluation":
                    evaluations = block.input.get("evaluations", [])
                    if evaluations:
                        return evaluations

            logger.warning(
                "Judge attempt %d: no submit_evaluation tool call found",
                attempt + 1,
            )

        except anthropic.APIError as e:
            logger.warning("Judge attempt %d failed: %s", attempt + 1, e)
        except (json.JSONDecodeError, KeyError, TypeError) as e:
            logger.warning("Judge attempt %d parse error: %s", attempt + 1, e)

    logger.error("Judge failed after %d attempts", retries + 1)
    return None


def _align_evaluations(
    criteria: list[Criterion],
    evaluations: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    """Align judge evaluations to criteria by ID, handling mismatches.

    If the judge returns evaluations by criterion_id, match them up.
    If counts differ, pad with failures for missing criteria.
    """
    # Build a lookup by criterion_id
    eval_by_id: dict[str, dict[str, Any]] = {}
    for ev in evaluations:
        cid = ev.get("criterion_id", "")
        eval_by_id[cid] = ev

    aligned: list[dict[str, Any]] = []
    for criterion in criteria:
        if criterion.id in eval_by_id:
            aligned.append(eval_by_id[criterion.id])
        else:
            # Missing evaluation — treat as failed
            aligned.append(
                {
                    "criterion_id": criterion.id,
                    "passed": False,
                    "reasoning": "Judge did not evaluate this criterion",
                    "severity": "major",
                }
            )

    return aligned
