"""Tool: create_staff_callback_request — queues a callback for staff."""

import uuid
from typing import Any

from tools.base import BaseTool, ToolResult

VALID_REASONS = [
    "billing_question",
    "insurance_verification",
    "rescheduling_assistance",
    "general_inquiry",
]

VALID_TIMEFRAMES = [
    "today",
    "tomorrow",
    "within_24_hours",
    "within_48_hours",
]


class CreateStaffCallbackRequest(BaseTool):
    name = "create_staff_callback_request"
    description = (
        "Create a request for a staff member to call the patient back. "
        "Use when unable to resolve or patient prefers a human."
    )

    async def execute(
        self,
        reason: str,
        patient_name: str,
        patient_phone: str,
        callback_timeframe: str = "within_24_hours",
        force_failure: bool = False,
        **kwargs: Any,
    ) -> ToolResult:
        if force_failure:
            return self._fail(
                "Callback request service temporarily unavailable. "
                "Please ask the patient to call the clinic directly."
            )

        if reason not in VALID_REASONS:
            return self._fail(
                f"Invalid reason '{reason}'. "
                f"Valid reasons: {', '.join(VALID_REASONS)}"
            )

        if callback_timeframe not in VALID_TIMEFRAMES:
            return self._fail(
                f"Invalid timeframe '{callback_timeframe}'. "
                f"Valid timeframes: {', '.join(VALID_TIMEFRAMES)}"
            )

        # Simple phone validation: strip non-digits, check length
        digits = "".join(c for c in patient_phone if c.isdigit())
        if len(digits) < 10:
            return self._fail(
                "Phone number appears invalid. "
                "Please provide a valid 10-digit number."
            )

        request_id = f"cb_{uuid.uuid4().hex[:8]}"

        return ToolResult(
            status="success",
            output={
                "request_id": request_id,
                "patient_name": patient_name,
                "patient_phone": patient_phone,
                "reason": reason,
                "callback_timeframe": callback_timeframe,
                "note": (
                    "Callback request created. Our staff will call "
                    f"the patient {callback_timeframe.replace('_', ' ')}."
                ),
            },
        )
