"""Tool: check_insurance_acceptance — checks plan status."""

from typing import Any

from tools.base import BaseTool, ToolResult
from tools.mock_data import BRIGHTCARE_DATA


class CheckInsuranceAcceptance(BaseTool):
    name = "check_insurance_acceptance"
    description = (
        "Check whether BrightCare accepts a specific insurance plan. "
        "Returns accepted, not accepted, or needs verification."
    )

    async def execute(
        self,
        insurance_plan: str,
        force_failure: bool = False,
        **kwargs: Any,
    ) -> ToolResult:
        if force_failure:
            return self._fail("Insurance verification service temporarily unavailable.")

        ins = BRIGHTCARE_DATA["insurance"]
        plan_lower = insurance_plan.lower()

        # Check each category with case-insensitive matching
        for name in ins["accepted"]:
            if name.lower() == plan_lower:
                return ToolResult(
                    status="success",
                    output={
                        "insurance_plan": name,
                        "is_accepted": True,
                        "note": (f"{name} is accepted at all BrightCare locations."),
                    },
                )

        for name in ins["not_accepted"]:
            if name.lower() == plan_lower:
                return ToolResult(
                    status="success",
                    output={
                        "insurance_plan": name,
                        "is_accepted": False,
                        "note": (
                            f"{name} is not accepted at BrightCare. "
                            "Patient may need to pay out-of-pocket or "
                            "find another provider."
                        ),
                    },
                )

        for name in ins["uncertain"]:
            if name.lower() == plan_lower:
                return ToolResult(
                    status="success",
                    output={
                        "insurance_plan": name,
                        "is_accepted": None,
                        "note": (
                            f"{name} requires verification. Recommend "
                            "the patient call the clinic with their "
                            "member ID for confirmation."
                        ),
                    },
                )

        # Not found in any list
        return ToolResult(
            status="success",
            output={
                "insurance_plan": insurance_plan,
                "is_accepted": None,
                "note": (
                    "Plan not found in our database. Please verify "
                    "spelling or ask patient for their member ID."
                ),
            },
        )
