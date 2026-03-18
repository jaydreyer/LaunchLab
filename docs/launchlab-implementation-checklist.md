# LaunchLab Implementation Checklist
## Healthcare Agent Launch Simulator

**Project:** LaunchLab
**Document Type:** Implementation Checklist
**Status:** Draft
**Last Updated:** 2026-03-17

---

## 1. Implementation Strategy

LaunchLab should be built in four major phases:

1. **Practice + Tooling Foundation**
   Create the fake healthcare practice, mocked tools, and core data structures.

2. **Simulation Core**
   Build the conversation simulator and connect it to configurable agent behavior.

3. **Evaluation + Readiness Layer**
   Add scenario-based evals, failure analysis, and the launch-readiness dashboard.

4. **Polish + Portfolio Packaging**
   Tighten the demo flow, improve documentation, and package the project for GitHub and interviews.

This build order keeps the project grounded in a believable workflow while making visible progress early.

---

## 2. Recommended Build Order

### Phase 1 — Foundation
Build first:
- practice config model
- sample BrightCare data
- mocked tool contracts
- mocked tool implementations
- agent config model
- app skeleton / page routing

### Phase 2 — Simulation
Build next:
- simulation session model
- chat/SMS-style simulator
- orchestration loop
- tool trace logging
- core happy-path scheduling/rescheduling flow
- urgent escalation path

### Phase 3 — Evals + Readiness
Build next:
- scenario suite model
- eval runner
- expected behavior schema
- pass/fail scoring
- failure summaries
- readiness dashboard

### Phase 4 — Polish
Finish with:
- better scenario library
- trace detail cleanup
- docs
- screenshots / GIFs
- architecture diagram
- demo script
- resume / portfolio framing

---

## 3. Epic Overview

### Epic 1
**Practice Configuration Foundation**

### Epic 2
**Agent Configuration and Rules**

### Epic 3
**Mocked Tool Layer**

### Epic 4
**Conversation Simulation Core**

### Epic 5
**Trace Logging and Session Inspection**

### Epic 6
**Primary Workflow: Rescheduling / Scheduling**

### Epic 7
**Secondary Intents and Escalation**

### Epic 8
**Eval Runner**

### Epic 9
**Launch Readiness Dashboard**

### Epic 10
**UI/UX Polish**

### Epic 11
**Docs, Demo, and Portfolio Packaging**

---

## 4. Detailed Epics and Tickets

---

# Epic 1: Practice Configuration Foundation

## Goal
Create the fake healthcare practice and make its rules available to the simulator.

## Success Criteria
- BrightCare Family Medicine can be created/loaded as the default practice.
- Practice rules persist across sessions.
- Agent/runtime can reference practice rules during simulations.

## Tickets

### 1.1 Create practice profile model
**Type:** Backend / Data
**Checklist**
- [ ] Create `practice_profiles` table/model
- [ ] Add fields for:
  - `id`
  - `name`
  - `locations_json`
  - `providers_json`
  - `hours_json`
  - `appointment_types_json`
  - `insurance_rules_json`
  - `escalation_rules_json`
- [ ] Add migration or seed handling

### 1.2 Define BrightCare sample data
**Type:** Product / Data
**Checklist**
- [ ] Define 2 locations
- [ ] Define 4 providers
- [ ] Define clinic hours
- [ ] Define appointment types and durations
- [ ] Define insurance acceptance rules
- [ ] Define urgent escalation rules
- [ ] Define routing rule for billing questions

### 1.3 Build practice config service
**Type:** Backend
**Checklist**
- [ ] Create service for loading/saving practice config
- [ ] Add validation for config shape
- [ ] Expose runtime access helpers

### 1.4 Build practice config API
**Type:** Backend / API
**Checklist**
- [ ] Create `GET /practice`
- [ ] Create `POST /practice`
- [ ] Create `PUT /practice`
- [ ] Add tests for CRUD behavior

### 1.5 Build Practice Setup screen
**Type:** Frontend
**Checklist**
- [ ] Create Practice Setup page
- [ ] Add sections for locations, providers, hours, appointment types, insurance rules, escalation rules
- [ ] Add Save action
- [ ] Add Reset to defaults action
- [ ] Add Load sample config action

---

# Epic 2: Agent Configuration and Rules

## Goal
Make agent behavior explicit and editable.

## Success Criteria
- Prompt, workflow rules, guardrails, and tool policy are stored separately from code where possible.
- Config changes affect simulator behavior.

## Tickets

### 2.1 Create agent config model
**Type:** Backend / Data
**Checklist**
- [ ] Create `agent_configs` table/model
- [ ] Add fields for:
  - `id`
  - `practice_id`
  - `system_prompt`
  - `workflow_config_json`
  - `guardrails_json`
  - `tool_policy_json`
  - `tone_guidelines_json`
  - `updated_at`

### 2.2 Define initial config schema
**Type:** Product / Backend
**Checklist**
- [ ] Define workflow step schema
- [ ] Define escalation rule schema
- [ ] Define guardrail schema
- [ ] Define tool policy schema
- [ ] Keep schema simple and versionable

### 2.3 Build agent config service
**Type:** Backend
**Checklist**
- [ ] Create service for loading current agent config
- [ ] Merge practice rules + agent config at runtime as needed
- [ ] Add validation helpers
- [ ] Add tests

### 2.4 Build agent config API
**Type:** Backend / API
**Checklist**
- [ ] Create `GET /agent-config`
- [ ] Create `PUT /agent-config`
- [ ] Add API tests

### 2.5 Build Agent Behavior Config screen
**Type:** Frontend
**Checklist**
- [ ] Create editable prompt area
- [ ] Add workflow steps editor
- [ ] Add guardrails editor
- [ ] Add escalation rules editor
- [ ] Add tool policy editor
- [ ] Add Save action
- [ ] Add “Run test conversation” shortcut

---

# Epic 3: Mocked Tool Layer

## Goal
Create believable mocked operational tools for the agent.

## Success Criteria
- Agent can call tools during simulation.
- Tool inputs/outputs are inspectable.
- Tool failures can be simulated.

## Tickets

### 3.1 Define tool contracts
**Type:** Backend / Architecture
**Checklist**
- [ ] Define tool schema for:
  - `get_clinic_hours`
  - `lookup_provider_availability`
  - `lookup_appointment_slots`
  - `check_insurance_acceptance`
  - `create_staff_callback_request`
  - `route_billing_question`
- [ ] Document inputs and outputs
- [ ] Keep outputs structured and deterministic

### 3.2 Implement mocked tool service
**Type:** Backend
**Checklist**
- [ ] Implement clinic hours lookup
- [ ] Implement provider availability lookup
- [ ] Implement appointment slot lookup
- [ ] Implement insurance acceptance lookup
- [ ] Implement callback request creation
- [ ] Implement billing routing action

### 3.3 Add tool failure simulation
**Type:** Backend
**Checklist**
- [ ] Add optional failure mode for slot lookup
- [ ] Add optional uncertainty case for insurance lookup
- [ ] Add error payloads that can be surfaced in traces
- [ ] Add tests

### 3.4 Build tool policy integration
**Type:** Backend
**Checklist**
- [ ] Enforce tool availability from config
- [ ] Ensure tool selection is visible to orchestration layer
- [ ] Add tests around disabled or restricted tools

---

# Epic 4: Conversation Simulation Core

## Goal
Build the simulator where scenarios are run against the configured agent.

## Success Criteria
- User can start a session and send messages.
- Agent can respond using current practice + config + tools.
- Session is persisted and reloadable.

## Tickets

### 4.1 Create simulation session model
**Type:** Backend / Data
**Checklist**
- [ ] Create `simulation_sessions` table/model
- [ ] Add fields for:
  - `id`
  - `practice_id`
  - `scenario_name`
  - `channel_mode`
  - `transcript_json`
  - `outcome`
  - `started_at`
  - `completed_at`

### 4.2 Build orchestration loop skeleton
**Type:** Backend / AI Integration
**Checklist**
- [ ] Create conversation loop service
- [ ] Inject practice config
- [ ] Inject agent config
- [ ] Allow tool calls
- [ ] Capture escalation triggers
- [ ] Return agent message + metadata

### 4.3 Build simulation APIs
**Type:** Backend / API
**Checklist**
- [ ] Create `POST /simulate/start`
- [ ] Create `POST /simulate/message`
- [ ] Create `GET /simulate/{id}`
- [ ] Add tests for session creation and message flow

### 4.4 Build Conversation Simulator screen
**Type:** Frontend
**Checklist**
- [ ] Create transcript pane
- [ ] Add scenario picker
- [ ] Add channel mode selector
- [ ] Add new session button
- [ ] Add rerun/reset control
- [ ] Show outcome state

### 4.5 Build SMS-style transcript mode
**Type:** Frontend
**Checklist**
- [ ] Add alternate transcript styling
- [ ] Allow same simulation engine to power chat and SMS-style views
- [ ] Keep this lightweight for v1

---

# Epic 5: Trace Logging and Session Inspection

## Goal
Make tool usage, escalation, and outcomes easy to inspect.

## Success Criteria
- Every simulation session has a readable trace.
- Tool calls are visible in order.
- Escalation events are visible.

## Tickets

### 5.1 Create tool call log model
**Type:** Backend / Data
**Checklist**
- [ ] Create `tool_calls` table/model
- [ ] Add fields for:
  - `id`
  - `simulation_session_id`
  - `tool_name`
  - `tool_input_json`
  - `tool_output_json`
  - `status`
  - `created_at`

### 5.2 Add trace logging utilities
**Type:** Backend
**Checklist**
- [ ] Log each tool call
- [ ] Log escalation markers
- [ ] Log key decision events if useful
- [ ] Add tests

### 5.3 Build trace endpoints
**Type:** Backend / API
**Checklist**
- [ ] Create `GET /simulate/{id}/tools`
- [ ] Optionally include trace details in `GET /simulate/{id}`
- [ ] Add tests

### 5.4 Build Simulation Trace Detail screen
**Type:** Frontend
**Checklist**
- [ ] Show full transcript
- [ ] Show tool call sequence
- [ ] Show escalation event if triggered
- [ ] Show final outcome
- [ ] Show evaluation notes placeholder

---

# Epic 6: Primary Workflow: Rescheduling / Scheduling

## Goal
Make one realistic healthcare workflow work end-to-end.

## Success Criteria
- Happy-path rescheduling works.
- Happy-path scheduling works or rescheduling works robustly enough to anchor v1.
- Agent asks for needed information before using tools or confirming outcomes.

## Tickets

### 6.1 Define primary workflow spec
**Type:** Product
**Checklist**
- [ ] Document happy-path reschedule flow
- [ ] Document required identifying info
- [ ] Document tool usage sequence
- [ ] Document completion criteria
- [ ] Document allowed fallback paths

### 6.2 Implement intent detection / workflow routing
**Type:** Backend / AI Integration
**Checklist**
- [ ] Detect schedule vs reschedule intent
- [ ] Route to workflow logic
- [ ] Add tests for clear intent cases

### 6.3 Implement reschedule flow
**Type:** Backend / AI Integration
**Checklist**
- [ ] Ask for identifying info
- [ ] Confirm appointment context
- [ ] Call slot lookup tool
- [ ] Offer valid options only
- [ ] Confirm selected slot
- [ ] Mark outcome as completed
- [ ] Add tests

### 6.4 Implement schedule flow (optional for true v1, recommended for v1.1)
**Type:** Backend / AI Integration
**Checklist**
- [ ] Collect appointment type and preferences
- [ ] Check provider/location availability
- [ ] Offer valid options
- [ ] Confirm booking summary
- [ ] Add tests

### 6.5 Add built-in scenarios for primary workflow
**Type:** Product / Data
**Checklist**
- [ ] Add “Reschedule existing appointment”
- [ ] Add “Book annual physical”
- [ ] Add “Missing information during reschedule”
- [ ] Add “No slots available”
- [ ] Add “Tool failure during slot lookup”

---

# Epic 7: Secondary Intents and Escalation

## Goal
Support a small set of additional realistic cases that make the simulator feel real.

## Success Criteria
- Hours/location questions work.
- Billing inquiries route correctly.
- Urgent symptoms escalate immediately.

## Tickets

### 7.1 Implement clinic hours / location info flow
**Type:** Backend / AI Integration
**Checklist**
- [ ] Detect hours/location intent
- [ ] Call clinic hours tool if needed
- [ ] Respond clearly
- [ ] Add tests

### 7.2 Implement billing question triage
**Type:** Backend / AI Integration
**Checklist**
- [ ] Detect billing-related request
- [ ] Route to billing tool or callback workflow
- [ ] Avoid answering out-of-scope billing specifics
- [ ] Add tests

### 7.3 Implement urgent symptom escalation
**Type:** Backend / Guardrails
**Checklist**
- [ ] Detect urgent symptom phrases
- [ ] Interrupt normal workflow
- [ ] Trigger escalation marker
- [ ] Avoid continuing scheduling flow
- [ ] Add tests

### 7.4 Add built-in scenarios for secondary intents
**Type:** Product / Data
**Checklist**
- [ ] Add “Ask clinic hours”
- [ ] Add “Billing question”
- [ ] Add “Urgent symptom mention”
- [ ] Add “Insurance question with unclear plan name”
- [ ] Add “Unsupported request outside scope”

---

# Epic 8: Eval Runner

## Goal
Run structured scenario suites and score behavior.

## Success Criteria
- A predefined scenario suite can be executed.
- Each scenario returns pass/fail and reason.
- Results are grouped into useful categories.

## Tickets

### 8.1 Create eval run model
**Type:** Backend / Data
**Checklist**
- [ ] Create `eval_runs` table/model
- [ ] Add fields for:
  - `id`
  - `practice_id`
  - `config_id`
  - `scenario_suite_name`
  - `summary_json`
  - `created_at`

### 8.2 Create eval case model
**Type:** Backend / Data
**Checklist**
- [ ] Create `eval_cases` table/model
- [ ] Add fields for:
  - `id`
  - `eval_run_id`
  - `scenario_name`
  - `expected_behavior_json`
  - `actual_behavior_json`
  - `pass_fail`
  - `failure_reason`
  - `score_json`

### 8.3 Define v1 scenario suite
**Type:** Product / Data
**Checklist**
- [ ] Create 8–12 scenarios
- [ ] Define expected behavior for each
- [ ] Define scoring criteria:
  - task completion
  - tool correctness
  - escalation correctness
  - guardrail compliance
  - unsupported-request handling

### 8.4 Build eval runner service
**Type:** Backend
**Checklist**
- [ ] Execute scenarios against current config
- [ ] Record actual behavior
- [ ] Compare to expected behavior
- [ ] Produce pass/fail
- [ ] Aggregate scores
- [ ] Add tests

### 8.5 Build eval APIs
**Type:** Backend / API
**Checklist**
- [ ] Create `POST /evals/run`
- [ ] Create `GET /evals/{id}`
- [ ] Create `GET /evals/latest`
- [ ] Add tests

### 8.6 Build Eval Runner screen
**Type:** Frontend
**Checklist**
- [ ] Add suite selector
- [ ] Add Run Evals button
- [ ] Add results table
- [ ] Show pass/fail and failure reasons
- [ ] Show summary metrics

---

# Epic 9: Launch Readiness Dashboard

## Goal
Translate eval results into a launch recommendation.

## Success Criteria
- Dashboard shows readiness score and major risk areas.
- Dashboard gives a simple recommendation.

## Tickets

### 9.1 Define readiness scoring model
**Type:** Product / Backend
**Checklist**
- [ ] Define overall readiness score formula
- [ ] Define category weights
- [ ] Define thresholds for:
  - not ready
  - ready for limited pilot
  - ready for pilot

### 9.2 Build readiness aggregation service
**Type:** Backend
**Checklist**
- [ ] Aggregate latest eval results
- [ ] Compute category pass rates
- [ ] Identify top failure themes
- [ ] Produce recommendation

### 9.3 Build dashboard API
**Type:** Backend / API
**Checklist**
- [ ] Create `GET /dashboard/readiness`
- [ ] Return score, categories, risks, recommendation
- [ ] Add tests

### 9.4 Build Launch Readiness Dashboard screen
**Type:** Frontend
**Checklist**
- [ ] Show readiness score
- [ ] Show pass rates by category
- [ ] Show top failure themes
- [ ] Show recommendation banner
- [ ] Keep layout clear and demo-friendly

---

# Epic 10: UI/UX Polish

## Goal
Make the product feel cohesive and highly demoable.

## Success Criteria
- Core screens feel connected.
- Navigation is simple.
- UI supports a 3–5 minute walkthrough.

## Tickets

### 10.1 Add app navigation and layout polish
**Type:** Frontend
**Checklist**
- [ ] Add persistent nav for:
  - Practice Setup
  - Agent Config
  - Simulator
  - Evals
  - Dashboard
- [ ] Make layout consistent across pages
- [ ] Improve spacing and hierarchy

### 10.2 Improve empty states and loading states
**Type:** Frontend
**Checklist**
- [ ] Add empty states for no practice config
- [ ] Add empty states for no sessions
- [ ] Add loading indicators for eval runs and simulations
- [ ] Keep copy concise

### 10.3 Improve trace readability
**Type:** Frontend
**Checklist**
- [ ] Make tool traces easy to scan
- [ ] Highlight escalation clearly
- [ ] Surface final outcome prominently

### 10.4 Add sample scenario quick launch
**Type:** Frontend
**Checklist**
- [ ] Add one-click starter scenarios in simulator
- [ ] Ensure good defaults for demos
- [ ] Reduce setup friction

---

# Epic 11: Docs, Demo, and Portfolio Packaging

## Goal
Make LaunchLab easy to understand on GitHub and in interviews.

## Success Criteria
- README clearly frames the project.
- Demo flow is documented.
- Architecture and design decisions are easy to explain.

## Tickets

### 11.1 Update README
**Type:** Docs
**Checklist**
- [ ] Add clear project framing
- [ ] Add feature summary
- [ ] Add screenshots of key screens
- [ ] Add “Why this project matters” section
- [ ] Add quick-start instructions

### 11.2 Create architecture diagram
**Type:** Docs / Design
**Checklist**
- [ ] Show practice config, agent config, orchestration, tools, simulator, eval runner, dashboard
- [ ] Keep diagram visually simple

### 11.3 Write demo script
**Type:** Docs
**Checklist**
- [ ] Create 3–5 minute walkthrough
- [ ] Include rescheduling scenario
- [ ] Include urgent escalation scenario
- [ ] Include eval suite run
- [ ] Include readiness dashboard explanation

### 11.4 Document tradeoffs and lessons learned
**Type:** Docs
**Checklist**
- [ ] Explain why tools are mocked
- [ ] Explain why one workflow was chosen for v1
- [ ] Explain guardrail and eval design decisions
- [ ] Capture future expansion ideas

### 11.5 Add resume / portfolio summary
**Type:** Docs
**Checklist**
- [ ] Write one-line version
- [ ] Write expanded project description
- [ ] Add bullets that map to target roles

---

## 5. Dependency Order

Build in this order to minimize rework:

### Step 1
Epic 1 — Practice Configuration Foundation

### Step 2
Epic 2 — Agent Configuration and Rules

### Step 3
Epic 3 — Mocked Tool Layer

### Step 4
Epic 4 — Conversation Simulation Core

### Step 5
Epic 5 — Trace Logging and Session Inspection

### Step 6
Epic 6 — Primary Workflow: Rescheduling / Scheduling

### Step 7
Epic 7 — Secondary Intents and Escalation

### Step 8
Epic 8 — Eval Runner

### Step 9
Epic 9 — Launch Readiness Dashboard

### Step 10
Epic 10 — UI/UX Polish

### Step 11
Epic 11 — Docs, Demo, and Portfolio Packaging

---

## 6. Suggested Milestones

### Milestone 1 — Simulator Foundation
Complete:
- practice config
- agent config
- mocked tools
- app skeleton

**Outcome:**
You can configure BrightCare and prepare the environment.

### Milestone 2 — Core Conversation Flow
Complete:
- simulation engine
- trace logging
- happy-path rescheduling flow
- urgent escalation

**Outcome:**
You can run believable conversations and inspect what happened.

### Milestone 3 — Launch Evaluation
Complete:
- scenario suite
- eval runner
- readiness dashboard

**Outcome:**
You can measure whether the deployment is ready.

### Milestone 4 — Portfolio Readiness
Complete:
- README
- screenshots / GIFs
- architecture diagram
- demo script

**Outcome:**
Project is ready for GitHub and interviews.

---

## 7. Fastest Valuable Cut

If time is tight, build this minimum version first:

- [ ] BrightCare practice config
- [ ] agent config screen
- [ ] 5–6 mocked tools
- [ ] simulator UI
- [ ] happy-path reschedule flow
- [ ] urgent escalation
- [ ] 8-scenario eval suite
- [ ] readiness dashboard

That is enough to make the project compelling.

---

## 8. Recommended Sprint Order

### Sprint 1
- Epic 1
- Epic 2
- Start Epic 3

### Sprint 2
- Finish Epic 3
- Epic 4
- Start Epic 5

### Sprint 3
- Finish Epic 5
- Epic 6
- Start Epic 7

### Sprint 4
- Finish Epic 7
- Epic 8

### Sprint 5
- Epic 9
- Epic 10

### Sprint 6
- Epic 11

---

## 9. Definition of Done

LaunchLab v1 is “done” when:

- [ ] BrightCare can be configured and saved
- [ ] agent behavior config is editable and persistent
- [ ] mocked tools are callable and logged
- [ ] a rescheduling scenario works end-to-end
- [ ] urgent symptom escalation interrupts normal flow
- [ ] users can inspect transcript + tool trace + outcome
- [ ] eval suite can be run on current config
- [ ] readiness dashboard displays score, risks, and recommendation
- [ ] README and demo materials clearly explain the project

---

## 10. Final Recommendation

Keep v1 narrow and believable.

The point of LaunchLab is not to build an entire healthcare communications company in miniature. The point is to prove that you know how to:

1. scope a customer workflow
2. translate it into agent behavior
3. connect it to tools
4. handle edge cases and escalation
5. evaluate launch readiness

That is the signal this project should optimize for.
