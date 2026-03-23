# LaunchLab Demo Script

**Duration:** 3-5 minutes
**Audience:** Technical reviewers, hiring managers, portfolio visitors
**Prerequisites:** Backend running on port 8000, frontend on dev server

---

## Opening (15 seconds)

LaunchLab is a sandbox for deploying and evaluating a healthcare AI agent. You configure a practice, define agent behavior, simulate patient conversations, and then run an eval suite to measure whether the agent is ready for a pilot launch. It covers the full lifecycle — not just "build a chatbot," but the configuration, testing, and evaluation work that real AI deployments require.

---

## Screen 1: Practice Setup (30-45 seconds)

Open the Practice Setup screen.

**What to show:**

- BrightCare Family Medicine is pre-configured as the demo practice
- Walk through the sections: 2 locations (Downtown Clinic, Northside Clinic), 4 providers (Dr. Smith, Dr. Patel, NP Jordan, PA Lee), hours (Mon-Fri 8-5), and 4 appointment types (Annual Physical, New Patient Visit, Follow-Up, Sick Visit)
- Scroll to the rules sections: insurance acceptance rules, escalation rules
- Call out specific rules worth remembering — "new patients can only book with Dr. Smith or NP Jordan" and "urgent symptoms must escalate immediately"

**What to say:**

> All of this configuration feeds directly into the agent's system prompt. The agent doesn't have hardcoded knowledge about this practice — it gets assembled at runtime. That dynamic prompt assembly is the core architectural feature.

---

## Screen 2: Agent Config (45-60 seconds)

Navigate to Agent Config.

**What to show:**

- The system prompt section — the agent is a scheduling assistant, helpful and concise, does not give medical advice
- Workflow steps for scheduling/rescheduling: determine intent, collect info, check availability via tools, offer options, confirm
- Guardrails: never diagnose, never guess availability, escalate chest pain / shortness of breath / severe bleeding
- Escalation triggers and tool policies — `lookup_appointment_slots` before offering times, `check_insurance_acceptance` before answering insurance questions
- Tone guidelines

**Key moment — the prompt preview panel:**

- Point to the right side of the screen where the live prompt preview assembles the full system prompt
- Show that it combines practice config (locations, providers, rules) with agent config (system prompt, guardrails, tool policies) into one complete prompt
- Make a small change to a guardrail or tone guideline and show the preview update in real time

**What to say:**

> The prompt preview on the right is assembling the full system prompt from both the practice config and the agent config. This is how the agent knows about BrightCare's specific rules. Change the practice, change the prompt. Change the guardrails, change the prompt. Nothing is hardcoded.

---

## Screen 3: Simulator — Rescheduling Scenario (60-75 seconds)

Navigate to the Simulator. Select the "reschedule_existing" scenario.

**What to show:**

- Launch the scenario. The patient simulator (a separate LLM) plays the patient role
- Walk through the conversation as it unfolds:
  - Patient says they need to move their appointment with Dr. Smith
  - Agent asks for identifying info (name, DOB)
  - Agent looks up the existing appointment using a tool call
  - Agent checks provider availability
  - Agent offers 2-3 valid time slots
  - Patient picks one
  - Agent confirms the reschedule
- Point to the trace panel on the right showing tool calls in real time: `lookup_provider_availability`, `lookup_appointment_slots`
- Note that the agent did not invent time slots — it used the tool results

**What to say:**

> There are three separate LLM subsystems here. The healthcare agent is handling the conversation. A patient simulator — a different LLM with its own prompt — is generating realistic patient responses. Later, a third LLM acts as a judge for evaluation. They are architecturally separate, never mixed in a single call.

> The tools are mocked for v1, but they are structured realistically — the agent calls them, gets back structured data, and reasons over the results. Swapping in real integrations would not change the agent's behavior.

---

## Screen 4: Simulator — Urgent Escalation (45-60 seconds)

Start a new scenario. Select the urgent symptom scenario.

**What to show:**

- The patient mentions chest pain or severe symptoms during the conversation
- The agent immediately stops the scheduling flow
- The agent triggers an escalation — does not try to continue booking
- Point out the escalation banner in the UI
- Show the trace panel: note there are no scheduling tool calls after the escalation trigger, just the escalation action

**What to say:**

> This is where guardrails matter. The agent recognized an escalation trigger — chest pain — and stopped the scheduling workflow immediately. It did not ask for appointment preferences. It did not try to be helpful by continuing. It escalated. That behavior is defined in the guardrails we saw on the Agent Config screen.

---

## Screen 5: Eval Runner (45-60 seconds)

Navigate to the Eval Runner.

**What to show:**

- Start an eval run (or show results from a previous completed run if time is tight)
- The summary bar: total scenarios, passed, failed, pass rate, average score
- The results table with each scenario listed
- Expand a passing case — show the judge's criteria breakdown (intent recognized, tools used correctly, guardrails respected, outcome correct)
- Expand a failing case if there is one — show what criteria the judge flagged and why
- Point out the status filter tabs (all, passed, failed)

**What to say:**

> The eval suite runs every scenario against the current agent config. Each result is scored by an LLM-as-Judge — the third subsystem — which evaluates the conversation against specific criteria. Did the agent recognize the intent? Did it use tools before offering slots? Did it escalate when it should have? This is structured evaluation, not vibes.

---

## Screen 6: Launch Readiness Dashboard (30-45 seconds)

Navigate to the Dashboard.

**What to show:**

- The readiness score gauge — a number out of 100 with color coding (green/yellow/red)
- Category breakdown with progress bars: scheduling, rescheduling, hours/location, billing routing, urgent escalation, insurance handling
- Failure themes section — common patterns where the agent fell short
- Deployment constraints — what the dashboard recommends holding back from a pilot
- The export button that downloads a markdown report

**What to say:**

> The dashboard rolls up the eval results into a launch readiness score. It breaks down pass rates by category so you can see where the agent is strong and where it needs work. If insurance handling is at 60%, you know not to include that in a pilot. The failure themes call out patterns — not just individual failures, but recurring issues like "tool failure recovery needs improvement."

> This is the artifact you would hand to a stakeholder: here is what the agent can do, here is what it cannot do yet, and here is what we recommend for a limited pilot.

---

## Closing (15 seconds)

**What to say:**

> That is LaunchLab. Practice config, agent config, simulated conversations with full tool traces, a structured eval suite, and a readiness dashboard. It covers the workflow that real healthcare AI deployments need — not just building an agent, but proving it works before you turn it on.
