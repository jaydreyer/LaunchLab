"""Tool: route_billing_question — routes billing queries to staff."""

from typing import Any

from tools.base import BaseTool, ToolResult

VALID_QUESTION_TYPES = [
    "copay",
    "deductible",
    "payment_plan",
    "general_billing",
    "insurance_billing",
]


class RouteBillingQuestion(BaseTool):
    name = "route_billing_question"
    description = (
        "Route a billing-related question to the appropriate department. "
        "Provides contact info for the billing team."
    )

    async def execute(
        self,
        question_type: str,
        amount: float | None = None,
        force_failure: bool = False,
        **kwargs: Any,
    ) -> ToolResult:
        if force_failure:
            return self._fail(
                "Billing routing service temporarily unavailable. "
                "Please call our office directly."
            )

        if question_type not in VALID_QUESTION_TYPES:
            return self._fail(
                f"Invalid question type '{question_type}'. "
                f"Valid types: {', '.join(VALID_QUESTION_TYPES)}"
            )

        output: dict[str, Any] = {
            "question_type": question_type,
            "routed_to": "Billing Department",
            "email": "billing@brightcare.example.com",
            "phone": "(555) 100-2500",
            "note": (
                "Your question has been routed to our billing team. "
                "They will respond within 24 hours."
            ),
        }

        if amount is not None:
            output["amount_referenced"] = amount

        return ToolResult(
            status="success",
            output=output,
        )
