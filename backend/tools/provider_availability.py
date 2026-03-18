"""Tool: lookup_provider_availability — shows a provider's schedule."""

from typing import Any

from tools.base import BaseTool, ToolResult
from tools.mock_data import BRIGHTCARE_DATA


class LookupProviderAvailability(BaseTool):
    name = "lookup_provider_availability"
    description = (
        "Look up a provider's availability for a specific "
        "appointment type and location."
    )

    async def execute(
        self,
        provider: str,
        location: str,
        appointment_type: str,
        force_failure: bool = False,
        **kwargs: Any,
    ) -> ToolResult:
        if force_failure:
            return self._fail("Provider availability service temporarily unavailable.")

        prov = BRIGHTCARE_DATA["providers"].get(provider)
        if not prov:
            valid = ", ".join(BRIGHTCARE_DATA["providers"])
            return self._fail(
                f"Provider '{provider}' not found. Valid providers: {valid}"
            )

        if location not in prov["locations"]:
            return self._fail(
                f"{prov['name']} does not practice at '{location}'. "
                f"Available locations: {', '.join(prov['locations'])}"
            )

        if appointment_type not in prov["appointment_types"]:
            return self._fail(
                f"{prov['name']} does not offer '{appointment_type}'. "
                f"Available types: {', '.join(prov['appointment_types'])}"
            )

        # Filter to days with at least one slot
        availability = {
            day: slots for day, slots in prov["availability"].items() if slots
        }

        return ToolResult(
            status="success",
            output={
                "provider": prov["name"],
                "title": prov["title"],
                "location": BRIGHTCARE_DATA["locations"][location]["name"],
                "appointment_type": appointment_type,
                "availability_by_day": availability,
            },
        )
