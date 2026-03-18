"""Tool: get_clinic_hours — returns clinic hours for a BrightCare location."""

from typing import Any

from tools.base import BaseTool, ToolResult
from tools.mock_data import BRIGHTCARE_DATA


class GetClinicHours(BaseTool):
    name = "get_clinic_hours"
    description = (
        "Get clinic hours for a specific BrightCare location. "
        "Useful for questions like 'When are you open?'"
    )

    async def execute(
        self,
        location: str,
        day: str | None = None,
        force_failure: bool = False,
        **kwargs: Any,
    ) -> ToolResult:
        if force_failure:
            return self._fail(
                "Clinic hours service temporarily unavailable. "
                "Please call the clinic directly."
            )

        loc_data = BRIGHTCARE_DATA["locations"].get(location)
        if not loc_data:
            valid = ", ".join(BRIGHTCARE_DATA["locations"])
            return self._fail(
                f"Location '{location}' not found. Valid locations: {valid}"
            )

        hours_data = BRIGHTCARE_DATA["hours"].get(location, {})

        if day:
            day_lower = day.lower()
            day_hours = hours_data.get(day_lower)
            if day_hours is None:
                valid_days = ", ".join(hours_data)
                return self._fail(
                    f"Day '{day}' not recognized. Valid days: {valid_days}"
                )
            hours_output = {day_lower: day_hours}
        else:
            hours_output = hours_data

        return ToolResult(
            status="success",
            output={
                "location": loc_data["name"],
                "address": loc_data["address"],
                "phone": loc_data["phone"],
                "hours": hours_output,
            },
        )
