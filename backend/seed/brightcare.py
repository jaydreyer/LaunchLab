"""BrightCare Family Medicine — seed data for practice profile."""

BRIGHTCARE_PRACTICE = {
    "name": "BrightCare Family Medicine",
    "locations": {
        "downtown": {
            "name": "Downtown Clinic",
            "address": "450 Main Street, Suite 200",
            "phone": "(555) 100-2000",
            "same_day_sick_visits": True,
        },
        "northside": {
            "name": "Northside Clinic",
            "address": "1200 North Avenue",
            "phone": "(555) 100-3000",
            "same_day_sick_visits": False,
        },
    },
    "providers": {
        "dr_smith": {
            "name": "Dr. Sarah Smith",
            "title": "MD",
            "locations": ["downtown", "northside"],
            "appointment_types": [
                "annual_physical",
                "new_patient",
                "follow_up",
                "sick_visit",
            ],
            "availability": {
                "monday": ["9:00", "10:00", "11:00", "14:00", "15:00"],
                "tuesday": ["9:00", "10:30", "14:00"],
                "wednesday": [
                    "9:00",
                    "10:00",
                    "11:00",
                    "13:00",
                    "14:00",
                    "15:00",
                ],
                "thursday": [],
                "friday": ["9:00", "10:00", "11:00"],
            },
        },
        "dr_patel": {
            "name": "Dr. Raj Patel",
            "title": "MD",
            "locations": ["downtown"],
            "appointment_types": [
                "annual_physical",
                "follow_up",
                "sick_visit",
            ],
            "availability": {
                "monday": ["9:00", "10:00", "14:00", "15:00"],
                "tuesday": ["9:00", "10:00", "11:00", "14:00", "15:00"],
                "wednesday": [],
                "thursday": ["9:00", "10:00", "11:00", "14:00"],
                "friday": ["9:00", "10:00", "11:00", "14:00", "15:00"],
            },
        },
        "np_jordan": {
            "name": "Maria Jordan",
            "title": "NP",
            "locations": ["downtown", "northside"],
            "appointment_types": [
                "new_patient",
                "follow_up",
                "sick_visit",
            ],
            "availability": {
                "monday": ["9:00", "10:00", "11:00", "13:00", "14:00"],
                "tuesday": ["9:00", "10:00", "11:00", "14:00", "15:00"],
                "wednesday": ["9:00", "10:00", "14:00"],
                "thursday": ["9:00", "10:00", "11:00", "14:00", "15:00"],
                "friday": [],
            },
        },
        "pa_lee": {
            "name": "Kevin Lee",
            "title": "PA",
            "locations": ["northside"],
            "appointment_types": ["follow_up", "sick_visit"],
            "availability": {
                "monday": ["9:00", "10:00", "11:00", "14:00"],
                "tuesday": [],
                "wednesday": ["9:00", "10:00", "11:00", "14:00", "15:00"],
                "thursday": ["9:00", "10:00", "14:00"],
                "friday": ["9:00", "10:00", "11:00", "14:00", "15:00"],
            },
        },
    },
    "hours": {
        "downtown": {
            "monday": {"open": "8:00", "close": "17:00"},
            "tuesday": {"open": "8:00", "close": "17:00"},
            "wednesday": {"open": "8:00", "close": "17:00"},
            "thursday": {"open": "8:00", "close": "17:00"},
            "friday": {"open": "8:00", "close": "16:00"},
            "saturday": "closed",
            "sunday": "closed",
        },
        "northside": {
            "monday": {"open": "9:00", "close": "17:00"},
            "tuesday": {"open": "9:00", "close": "17:00"},
            "wednesday": {"open": "9:00", "close": "17:00"},
            "thursday": {"open": "9:00", "close": "17:00"},
            "friday": {"open": "9:00", "close": "15:00"},
            "saturday": "closed",
            "sunday": "closed",
        },
    },
    "appointment_types": {
        "annual_physical": {
            "duration_min": 30,
            "is_new_patient_ok": True,
        },
        "new_patient": {
            "duration_min": 40,
            "is_new_patient_ok": True,
            "providers": ["dr_smith", "np_jordan"],
        },
        "follow_up": {
            "duration_min": 20,
            "is_new_patient_ok": False,
        },
        "sick_visit": {
            "duration_min": 15,
            "is_new_patient_ok": True,
            "same_day_only_at": ["downtown"],
        },
    },
    "insurance_rules": {
        "accepted": [
            "Blue Cross Blue Shield",
            "Aetna",
            "UnitedHealthcare",
            "Medicare",
        ],
        "not_accepted": ["Medicaid"],
        "uncertain": ["Cigna HMO"],
    },
    "escalation_rules": {
        "urgent_symptoms": [
            "chest pain",
            "shortness of breath",
            "severe bleeding",
            "difficulty breathing",
            "loss of consciousness",
        ],
        "mental_health_crisis": [
            "suicidal",
            "self-harm",
            "harm myself",
            "harm others",
        ],
        "action": "Transfer to clinical staff immediately. Do not attempt "
        "to triage or provide medical advice.",
    },
}
