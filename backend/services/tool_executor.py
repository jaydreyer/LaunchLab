"""Tool executor — dispatches tools by name and logs calls to the DB."""

import json
import time
from typing import Any

from models.tool_call import ToolCall
from sqlalchemy.ext.asyncio import AsyncSession
from tools.appointment_slots import LookupAppointmentSlots
from tools.base import BaseTool, ToolResult
from tools.billing_route import RouteBillingQuestion
from tools.callback_request import CreateStaffCallbackRequest
from tools.clinic_hours import GetClinicHours
from tools.insurance_check import CheckInsuranceAcceptance
from tools.provider_availability import LookupProviderAvailability

# Registry — maps tool name to an instance
_TOOL_REGISTRY: dict[str, BaseTool] = {
    "get_clinic_hours": GetClinicHours(),
    "lookup_provider_availability": LookupProviderAvailability(),
    "lookup_appointment_slots": LookupAppointmentSlots(),
    "check_insurance_acceptance": CheckInsuranceAcceptance(),
    "create_staff_callback_request": CreateStaffCallbackRequest(),
    "route_billing_question": RouteBillingQuestion(),
}


async def execute_tool(
    db: AsyncSession,
    session_id: str,
    tool_name: str,
    tool_input: dict[str, Any],
    scenario_overrides: dict[str, Any] | None = None,
) -> ToolResult:
    """Dispatch a tool by name, execute it, and log the call.

    Args:
        db: Database session for logging.
        session_id: Simulation session ID (for the tool_calls table).
        tool_name: Name of the tool to execute.
        tool_input: Arguments dict from Claude's tool_use block.
        scenario_overrides: Per-tool overrides from scenario config
            (e.g., {"lookup_appointment_slots": {"force_failure": true}}).

    Returns:
        ToolResult with status and structured output.
    """
    tool = _TOOL_REGISTRY.get(tool_name)
    if not tool:
        result = ToolResult(
            status="error",
            output={"error": f"Tool '{tool_name}' not found"},
        )
        await _log_call(db, session_id, tool_name, tool_input, result, 0)
        return result

    # Merge scenario overrides into tool input
    merged_input = {**tool_input}
    if scenario_overrides and tool_name in scenario_overrides:
        merged_input.update(scenario_overrides[tool_name])

    start = time.monotonic()
    result = await tool.execute(**merged_input)
    duration_ms = int((time.monotonic() - start) * 1000)

    await _log_call(db, session_id, tool_name, tool_input, result, duration_ms)
    return result


async def _log_call(
    db: AsyncSession,
    session_id: str,
    tool_name: str,
    tool_input: dict[str, Any],
    result: ToolResult,
    duration_ms: int,
) -> None:
    """Persist the tool call to the tool_calls table."""
    record = ToolCall(
        session_id=session_id,
        tool_name=tool_name,
        tool_input=_safe_json(tool_input),
        tool_output=_safe_json(result.output),
        status=result.status,
        duration_ms=duration_ms,
    )
    db.add(record)
    await db.flush()


def _safe_json(data: Any) -> dict:
    """Ensure data is JSON-serializable (no dataclass/set surprises)."""
    return json.loads(json.dumps(data, default=str))
