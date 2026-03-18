"""Structured mock data for BrightCare Family Medicine.

Tools query this data with real filtering logic — these are NOT
hardcoded JSON responses. The data mirrors the seed data shape but
lives here so tools can import it directly without DB access.
"""

BRIGHTCARE_DATA: dict = {
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
                "tuesday": [
                    "9:00",
                    "10:00",
                    "11:00",
                    "14:00",
                    "15:00",
                ],
                "wednesday": [],
                "thursday": ["9:00", "10:00", "11:00", "14:00"],
                "friday": [
                    "9:00",
                    "10:00",
                    "11:00",
                    "14:00",
                    "15:00",
                ],
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
                "tuesday": [
                    "9:00",
                    "10:00",
                    "11:00",
                    "14:00",
                    "15:00",
                ],
                "wednesday": ["9:00", "10:00", "14:00"],
                "thursday": [
                    "9:00",
                    "10:00",
                    "11:00",
                    "14:00",
                    "15:00",
                ],
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
                "wednesday": [
                    "9:00",
                    "10:00",
                    "11:00",
                    "14:00",
                    "15:00",
                ],
                "thursday": ["9:00", "10:00", "14:00"],
                "friday": [
                    "9:00",
                    "10:00",
                    "11:00",
                    "14:00",
                    "15:00",
                ],
            },
        },
    },
    "locations": {
        "downtown": {
            "name": "Downtown Clinic",
            "address": "450 Main Street, Suite 200",
            "phone": "(555) 100-2000",
            "is_same_day_sick_visits": True,
        },
        "northside": {
            "name": "Northside Clinic",
            "address": "1200 North Avenue",
            "phone": "(555) 100-3000",
            "is_same_day_sick_visits": False,
        },
    },
    "hours": {
        "downtown": {
            "monday": {"open": "8:00 AM", "close": "5:00 PM"},
            "tuesday": {"open": "8:00 AM", "close": "5:00 PM"},
            "wednesday": {"open": "8:00 AM", "close": "5:00 PM"},
            "thursday": {"open": "8:00 AM", "close": "5:00 PM"},
            "friday": {"open": "8:00 AM", "close": "4:00 PM"},
            "saturday": "closed",
            "sunday": "closed",
        },
        "northside": {
            "monday": {"open": "9:00 AM", "close": "5:00 PM"},
            "tuesday": {"open": "9:00 AM", "close": "5:00 PM"},
            "wednesday": {"open": "9:00 AM", "close": "5:00 PM"},
            "thursday": {"open": "9:00 AM", "close": "5:00 PM"},
            "friday": {"open": "9:00 AM", "close": "3:00 PM"},
            "saturday": "closed",
            "sunday": "closed",
        },
    },
    "insurance": {
        "accepted": [
            "Blue Cross Blue Shield",
            "Aetna",
            "UnitedHealthcare",
            "Medicare",
        ],
        "not_accepted": ["Medicaid"],
        "uncertain": ["Cigna HMO"],
    },
    "appointment_types": {
        "annual_physical": {
            "label": "Annual Physical",
            "duration_min": 30,
            "is_new_patient_ok": True,
        },
        "new_patient": {
            "label": "New Patient Visit",
            "duration_min": 40,
            "is_new_patient_ok": True,
            "providers": ["dr_smith", "np_jordan"],
        },
        "follow_up": {
            "label": "Follow-Up Visit",
            "duration_min": 20,
            "is_new_patient_ok": False,
        },
        "sick_visit": {
            "label": "Sick Visit",
            "duration_min": 15,
            "is_new_patient_ok": True,
            "same_day_only_at": ["downtown"],
        },
    },
}
