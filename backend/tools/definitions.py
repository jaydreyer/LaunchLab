"""Anthropic-format tool definitions for the Healthcare Agent.

These are passed directly to the Anthropic API's `tools` parameter.
The `force_failure` param is injected by scenario overrides, not
exposed to Claude.
"""

TOOL_DEFINITIONS: list[dict] = [
    {
        "name": "get_clinic_hours",
        "description": (
            "Get clinic hours for a specific BrightCare location. "
            "Use for questions like 'When are you open?' or "
            "'What are your hours on Friday?'"
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "location": {
                    "type": "string",
                    "enum": ["downtown", "northside"],
                    "description": "Clinic location identifier",
                },
                "day": {
                    "type": "string",
                    "description": (
                        "Optional: specific day of the week "
                        "(e.g., 'monday') to check"
                    ),
                },
            },
            "required": ["location"],
        },
    },
    {
        "name": "lookup_provider_availability",
        "description": (
            "Look up a provider's availability for a specific "
            "appointment type and location. Shows which days and "
            "times the provider has openings."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "provider": {
                    "type": "string",
                    "enum": ["dr_smith", "dr_patel", "np_jordan", "pa_lee"],
                    "description": "Provider identifier",
                },
                "location": {
                    "type": "string",
                    "enum": ["downtown", "northside"],
                    "description": "Clinic location",
                },
                "appointment_type": {
                    "type": "string",
                    "enum": [
                        "annual_physical",
                        "new_patient",
                        "follow_up",
                        "sick_visit",
                    ],
                    "description": "Type of appointment",
                },
            },
            "required": ["provider", "location", "appointment_type"],
        },
    },
    {
        "name": "lookup_appointment_slots",
        "description": (
            "Look up available appointment slots for a specific "
            "provider at a specific location. Must be called before "
            "offering appointment times to the patient."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "provider": {
                    "type": "string",
                    "enum": ["dr_smith", "dr_patel", "np_jordan", "pa_lee"],
                    "description": "Provider identifier",
                },
                "location": {
                    "type": "string",
                    "enum": ["downtown", "northside"],
                    "description": "Clinic location",
                },
                "appointment_type": {
                    "type": "string",
                    "enum": [
                        "annual_physical",
                        "new_patient",
                        "follow_up",
                        "sick_visit",
                    ],
                    "description": "Type of appointment",
                },
                "preferred_date_range": {
                    "type": "string",
                    "description": (
                        "Preferred date range "
                        "(e.g., 'next_week', 'tomorrow', 'this_week')"
                    ),
                },
            },
            "required": ["provider", "location", "appointment_type"],
        },
    },
    {
        "name": "check_insurance_acceptance",
        "description": (
            "Check whether BrightCare accepts a specific insurance "
            "plan. Returns accepted, not accepted, or needs verification."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "insurance_plan": {
                    "type": "string",
                    "description": (
                        "Name of the insurance plan "
                        "(e.g., 'Blue Cross Blue Shield', 'Medicaid')"
                    ),
                },
            },
            "required": ["insurance_plan"],
        },
    },
    {
        "name": "create_staff_callback_request",
        "description": (
            "Create a request for a staff member to call the patient "
            "back. Use when you cannot resolve the request or when the "
            "patient prefers to speak with a person."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "reason": {
                    "type": "string",
                    "enum": [
                        "billing_question",
                        "insurance_verification",
                        "rescheduling_assistance",
                        "general_inquiry",
                    ],
                    "description": "Reason for the callback",
                },
                "patient_name": {
                    "type": "string",
                    "description": "Patient's full name",
                },
                "patient_phone": {
                    "type": "string",
                    "description": "Patient's phone number",
                },
                "callback_timeframe": {
                    "type": "string",
                    "enum": [
                        "today",
                        "tomorrow",
                        "within_24_hours",
                        "within_48_hours",
                    ],
                    "description": "Preferred timeframe for callback",
                },
            },
            "required": ["reason", "patient_name", "patient_phone"],
        },
    },
    {
        "name": "route_billing_question",
        "description": (
            "Route a billing-related question to the appropriate "
            "department. Provides contact info for the billing team."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "question_type": {
                    "type": "string",
                    "enum": [
                        "copay",
                        "deductible",
                        "payment_plan",
                        "general_billing",
                        "insurance_billing",
                    ],
                    "description": "Type of billing question",
                },
                "amount": {
                    "type": "number",
                    "description": ("Dollar amount if relevant (e.g., copay amount)"),
                },
            },
            "required": ["question_type"],
        },
    },
]
