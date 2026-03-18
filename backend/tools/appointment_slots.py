"""Tool: lookup_appointment_slots — returns bookable time slots."""

import uuid
from datetime import UTC, datetime, timedelta
from typing import Any

from tools.base import BaseTool, ToolResult
from tools.mock_data import BRIGHTCARE_DATA

_DAY_NAMES = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
]


def _next_weekday_dates(count: int = 5) -> list[tuple[str, str]]:
    """Return the next `count` weekday (day_name, date_str) pairs."""
    today = datetime.now(UTC).date()
    results: list[tuple[str, str]] = []
    d = today + timedelta(days=1)
    while len(results) < count:
        if d.weekday() < 5:  # Mon-Fri
            results.append((_DAY_NAMES[d.weekday()], d.isoformat()))
        d += timedelta(days=1)
    return results


class LookupAppointmentSlots(BaseTool):
    name = "lookup_appointment_slots"
    description = (
        "Look up available appointment slots for a specific provider "
        "at a specific location. Must be called before offering times."
    )

    async def execute(
        self,
        provider: str,
        location: str,
        appointment_type: str,
        preferred_date_range: str | None = None,
        force_failure: bool = False,
        **kwargs: Any,
    ) -> ToolResult:
        if force_failure:
            return self._fail(
                "Scheduling system temporarily unavailable. " "Please try again later."
            )

        prov = BRIGHTCARE_DATA["providers"].get(provider)
        if not prov:
            valid = ", ".join(BRIGHTCARE_DATA["providers"])
            return self._fail(
                f"Provider '{provider}' not found. Valid providers: {valid}"
            )

        if location not in prov["locations"]:
            return self._fail(f"{prov['name']} does not practice at '{location}'.")

        if appointment_type not in prov["appointment_types"]:
            return self._fail(f"{prov['name']} does not offer '{appointment_type}'.")

        # Build concrete slots from the next 5 weekdays
        upcoming = _next_weekday_dates(count=5)
        slots: list[dict[str, str]] = []
        for day_name, date_str in upcoming:
            times = prov["availability"].get(day_name, [])
            for t in times:
                slots.append(
                    {
                        "date": date_str,
                        "day": day_name,
                        "time": t,
                        "slot_id": f"slot_{uuid.uuid4().hex[:8]}",
                    }
                )

        appt = BRIGHTCARE_DATA["appointment_types"].get(appointment_type, {})
        loc_name = BRIGHTCARE_DATA["locations"][location]["name"]

        return ToolResult(
            status="success",
            output={
                "provider": prov["name"],
                "location": loc_name,
                "appointment_type": appointment_type,
                "duration_min": appt.get("duration_min"),
                "slots": slots,
                "slot_count": len(slots),
            },
        )
