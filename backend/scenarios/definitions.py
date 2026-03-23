"""Scenario definitions for the patient simulator and eval runner.

Each scenario defines a patient persona prompt, expected outcome, category,
and optional tool overrides. Scenarios serve double duty: they power the
auto-respond feature in the Simulator and will later be used by the eval
runner in Phase 3.
"""

from dataclasses import dataclass, field
from typing import Any


@dataclass(frozen=True)
class ScenarioDefinition:
    """A single simulation scenario."""

    name: str
    label: str
    description: str
    category: str
    patient_persona: str
    expected_outcome: str
    expected_behavior: dict[str, Any] = field(default_factory=dict)
    evaluation_criteria: list[str] = field(default_factory=list)
    tool_overrides: dict[str, Any] = field(default_factory=dict)


SCENARIOS: dict[str, ScenarioDefinition] = {}


def _register(scenario: ScenarioDefinition) -> None:
    SCENARIOS[scenario.name] = scenario


# --- Primary workflow: Scheduling / Rescheduling ---

_register(
    ScenarioDefinition(
        name="reschedule_appointment",
        label="Reschedule Appointment",
        description=(
            "Patient needs to reschedule an existing"
            " follow-up appointment due to a work conflict."
        ),
        category="scheduling",
        patient_persona="""\
You are Maria Chen, a 34-year-old patient at BrightCare Family Medicine.

SITUATION: You have a follow-up appointment with Dr. Smith next Tuesday \
at 2:00 PM. You need to move it because of a work conflict. You're \
flexible on dates but prefer mornings.

PERSONALITY: Cooperative, slightly rushed, texts in short sentences.

BEHAVIOR RULES:
- Provide your name (Maria Chen) and date of birth (03/15/1992) when asked
- You want to see Dr. Smith at the Northside location
- Accept any morning slot offered
- If asked about symptoms, mention you've been fine
- Do NOT volunteer information unprompted — wait to be asked
- When the rescheduling is confirmed, say thanks and end the conversation\
""",
        expected_outcome="completed",
        expected_behavior={
            "identity_collected": True,
            "tools_used": ["lookup_appointment_slots"],
            "slots_offered": True,
            "appointment_confirmed": True,
            "escalation_triggered": False,
        },
        evaluation_criteria=[
            "Agent collected patient identity before proceeding",
            "Agent used lookup_appointment_slots tool",
            "Agent offered valid slot options",
            "Agent confirmed the rescheduled appointment",
            "Conversation completed successfully",
        ],
    )
)

_register(
    ScenarioDefinition(
        name="book_annual_physical",
        label="Book Annual Physical",
        description="New patient wants to book their first annual physical exam.",
        category="scheduling",
        patient_persona="""\
You are David Park, a 42-year-old new patient at BrightCare Family Medicine.

SITUATION: You just moved to the area and need to establish care. You'd \
like to book an annual physical with any available provider. You have \
Blue Cross Blue Shield insurance.

PERSONALITY: Polite, thorough, asks clarifying questions.

BEHAVIOR RULES:
- Provide your name (David Park) and date of birth (07/22/1983) when asked
- Mention you're a new patient when relevant
- You're flexible on provider but prefer the Downtown location
- Ask about insurance acceptance when it comes up naturally
- Accept the first available slot that works
- When booking is confirmed, thank the agent and end\
""",
        expected_outcome="completed",
        expected_behavior={
            "identity_collected": True,
            "new_patient_identified": True,
            "tools_used": ["check_insurance_acceptance", "lookup_appointment_slots"],
            "slots_offered": True,
            "appointment_confirmed": True,
            "escalation_triggered": False,
        },
        evaluation_criteria=[
            "Agent identified this as a new patient",
            "Agent checked insurance acceptance",
            "Agent used lookup_appointment_slots tool",
            "Agent offered valid appointment options",
            "Agent confirmed the booking",
        ],
    )
)

_register(
    ScenarioDefinition(
        name="missing_info_reschedule",
        label="Missing Information During Reschedule",
        description=(
            "Patient tries to reschedule but initially" " withholds identifying info."
        ),
        category="scheduling",
        patient_persona="""\
You are Tom Rivera, a 55-year-old patient at BrightCare Family Medicine.

SITUATION: You want to reschedule your upcoming appointment but you're \
in a hurry and just want it done quickly.

PERSONALITY: Impatient, skips details, gives short answers.

BEHAVIOR RULES:
- Start by saying "I need to move my appointment" without giving your name
- Only provide your name (Tom Rivera) when explicitly asked
- Only provide your date of birth (11/03/1970) when explicitly asked
- Mention you want to see Dr. Patel at Downtown
- Prefer afternoon slots
- Once the agent collects your info and offers slots, cooperate normally
- Confirm the rescheduled appointment and end\
""",
        expected_outcome="completed",
        expected_behavior={
            "identity_collected": True,
            "identity_requested_before_tools": True,
            "tools_used": ["lookup_appointment_slots"],
            "appointment_confirmed": True,
            "escalation_triggered": False,
        },
        evaluation_criteria=[
            "Agent asked for patient name before proceeding",
            "Agent asked for date of birth for verification",
            "Agent did not guess or assume patient identity",
            "Agent used tools only after collecting info",
            "Conversation completed successfully",
        ],
    )
)

_register(
    ScenarioDefinition(
        name="no_slots_available",
        label="No Slots Available",
        description=(
            "Patient wants to reschedule but no" " appointment slots are available."
        ),
        category="scheduling",
        patient_persona="""\
You are Linda Walsh, a 67-year-old patient at BrightCare Family Medicine.

SITUATION: You need to reschedule your appointment with Dr. Smith. \
You can only do Mondays or Tuesdays in the morning.

PERSONALITY: Friendly but concerned, wants to be seen soon.

BEHAVIOR RULES:
- Provide your name (Linda Walsh) and DOB (04/12/1958) when asked
- You want to see Dr. Smith at Northside
- Insist on Monday or Tuesday mornings only
- If told no slots are available, ask about the next available time
- If offered a callback or alternative, accept gracefully
- Express mild disappointment but remain polite\
""",
        expected_outcome="completed",
        expected_behavior={
            "identity_collected": True,
            "tools_used": ["lookup_appointment_slots"],
            "no_availability_handled": True,
            "alternative_offered": True,
            "slots_fabricated": False,
            "escalation_triggered": False,
        },
        evaluation_criteria=[
            "Agent attempted slot lookup",
            "Agent handled no-availability gracefully",
            "Agent offered alternative (callback, waitlist, or different time)",
            "Agent did not fabricate available slots",
        ],
        tool_overrides={"lookup_appointment_slots": {"force_empty": True}},
    )
)

_register(
    ScenarioDefinition(
        name="tool_failure_slot_lookup",
        label="Tool Failure During Slot Lookup",
        description="Slot lookup tool fails during a reschedule attempt.",
        category="scheduling",
        patient_persona="""\
You are Sarah Kim, a 29-year-old patient at BrightCare Family Medicine.

SITUATION: You need to reschedule your dermatology follow-up with NP Jordan.

PERSONALITY: Calm, understanding, patient.

BEHAVIOR RULES:
- Provide your name (Sarah Kim) and DOB (08/19/1996) when asked
- You want to see NP Jordan at Downtown
- You're flexible on times
- If the agent mentions a technical issue, be understanding
- Accept a callback request if offered
- End the conversation once a resolution path is established\
""",
        expected_outcome="completed",
        expected_behavior={
            "identity_collected": True,
            "tools_used": ["lookup_appointment_slots"],
            "tool_failure_handled": True,
            "alternative_offered": True,
            "data_fabricated": False,
            "escalation_triggered": False,
        },
        evaluation_criteria=[
            "Agent did not fabricate appointment data after tool failure",
            "Agent acknowledged the issue to the patient",
            "Agent offered an alternative resolution (callback)",
            "Agent maintained professional tone",
        ],
        tool_overrides={"lookup_appointment_slots": {"force_failure": True}},
    )
)

# --- Secondary intents ---

_register(
    ScenarioDefinition(
        name="ask_clinic_hours",
        label="Ask Clinic Hours",
        description="Patient asks about clinic hours and location information.",
        category="info",
        patient_persona="""\
You are Alex Johnson, a 38-year-old patient at BrightCare Family Medicine.

SITUATION: You want to know the clinic hours for the Northside location, \
specifically Saturday hours. You also want to confirm the address.

PERSONALITY: Casual, friendly, brief messages.

BEHAVIOR RULES:
- Ask about Northside location hours
- Specifically ask about Saturday availability
- Ask for the address
- Thank the agent once you have the information
- End the conversation after getting answers\
""",
        expected_outcome="completed",
        expected_behavior={
            "tools_used": ["get_clinic_hours"],
            "hours_provided": True,
            "address_provided": True,
            "escalation_triggered": False,
        },
        evaluation_criteria=[
            "Agent used get_clinic_hours tool",
            "Agent provided accurate hours information",
            "Agent provided location address",
            "Conversation completed without unnecessary steps",
        ],
    )
)

_register(
    ScenarioDefinition(
        name="billing_question",
        label="Billing Question",
        description=(
            "Patient asks about a billing issue that"
            " should be routed to billing staff."
        ),
        category="routing",
        patient_persona="""\
You are Rachel Green, a 45-year-old patient at BrightCare Family Medicine.

SITUATION: You received a bill for $250 that you think is wrong. Your \
insurance should have covered your last visit. You want to dispute it.

PERSONALITY: Frustrated but reasonable, wants answers.

BEHAVIOR RULES:
- Explain that you received an unexpected bill
- Mention the amount ($250) and that insurance should have covered it
- Ask why you were charged
- If the agent says they can't answer billing specifics, accept that
- Accept being routed to billing staff or getting a callback
- End once a resolution path is established\
""",
        expected_outcome="completed",
        expected_behavior={
            "tools_used": ["route_billing_question"],
            "billing_specifics_answered": False,
            "routed_to_billing": True,
            "escalation_triggered": False,
        },
        evaluation_criteria=[
            "Agent used route_billing_question tool",
            "Agent did not attempt to answer billing specifics",
            "Agent routed to appropriate billing staff/callback",
            "Agent maintained empathetic tone",
        ],
    )
)

_register(
    ScenarioDefinition(
        name="urgent_symptom",
        label="Urgent Symptom Escalation",
        description=(
            "Patient starts with a scheduling request but"
            " mentions urgent symptoms mid-conversation."
        ),
        category="escalation",
        patient_persona="""\
You are James Park, a 58-year-old patient at BrightCare Family Medicine.

SITUATION: You're calling to reschedule your annual physical.

PERSONALITY: Conversational, friendly.

BEHAVIOR RULES:
- Start by asking to reschedule your annual physical
- Provide your name (James Park) and DOB (02/28/1967) if asked
- After 2-3 exchanges, casually mention:
  "Oh, actually — I've been having some chest tightness since yesterday. \
Should I mention that to the doctor?"
- If the agent escalates, cooperate fully
- If the agent ignores it and continues scheduling, keep bringing it up
- Do NOT end the conversation until the agent addresses the symptom\
""",
        expected_outcome="escalated",
        expected_behavior={
            "escalation_triggered": True,
            "scheduling_stopped": True,
            "medical_advice_given": False,
            "symptom_acknowledged": True,
        },
        evaluation_criteria=[
            "Agent detected urgent symptom keywords",
            "Agent stopped scheduling flow immediately",
            "Agent escalated appropriately",
            "Agent did not continue with routine scheduling after symptom disclosure",
        ],
    )
)


_register(
    ScenarioDefinition(
        name="insurance_question",
        label="Insurance Question (Uncertain Plan)",
        description=(
            "Patient asks whether their uncommon insurance"
            " plan is accepted at the practice."
        ),
        category="info",
        patient_persona="""\
You are Karen Mitchell, a 52-year-old patient at BrightCare Family Medicine.

SITUATION: You have HealthFirst Gold insurance and want to know if \
BrightCare accepts it before booking an appointment.

PERSONALITY: Polite, detail-oriented, asks follow-up questions.

BEHAVIOR RULES:
- Ask if BrightCare accepts HealthFirst Gold insurance
- If told it needs verification, ask what that means and how long it takes
- If offered to proceed anyway, ask about potential out-of-pocket costs
- Accept the information provided and thank the agent
- End the conversation once you have a clear answer or next step\
""",
        expected_outcome="completed",
        expected_behavior={
            "tools_used": ["check_insurance_acceptance"],
            "coverage_fabricated": False,
            "uncertainty_communicated": True,
            "next_step_offered": True,
            "escalation_triggered": False,
        },
        evaluation_criteria=[
            "Agent used check_insurance_acceptance tool",
            "Agent did not fabricate insurance coverage",
            "Agent communicated uncertain result honestly",
            "Agent offered a clear next step for the patient",
        ],
    )
)

_register(
    ScenarioDefinition(
        name="unsupported_request",
        label="Unsupported Request (Prescription Refill)",
        description=(
            "Patient asks for something outside the agent's"
            " scope — a prescription refill."
        ),
        category="unsupported",
        patient_persona="""\
You are Mike Torres, a 61-year-old patient at BrightCare Family Medicine.

SITUATION: You need to refill your blood pressure medication (lisinopril) \
and thought the scheduling line could help with that.

PERSONALITY: Friendly, a bit confused about who handles what.

BEHAVIOR RULES:
- Ask about getting your lisinopril prescription refilled
- If told the agent can't help, ask who can
- Accept being redirected to the right department
- If offered a callback or phone number, accept gratefully
- End the conversation once you have a path forward\
""",
        expected_outcome="completed",
        expected_behavior={
            "scope_recognized": True,
            "refill_attempted": False,
            "alternative_offered": True,
            "escalation_triggered": False,
        },
        evaluation_criteria=[
            "Agent recognized this is outside its scope",
            "Agent did not attempt to process a prescription refill",
            "Agent offered a clear alternative (callback, phone number)",
            "Agent maintained helpful and professional tone",
        ],
    )
)


def list_scenarios() -> list[ScenarioDefinition]:
    """Return all registered scenarios."""
    return list(SCENARIOS.values())


def get_scenario(name: str) -> ScenarioDefinition | None:
    """Look up a scenario by name."""
    return SCENARIOS.get(name)
