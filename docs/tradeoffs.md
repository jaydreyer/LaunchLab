# Tradeoffs and Lessons Learned

Technical decisions, intentional constraints, and what we'd do differently in LaunchLab v1.

---

## 1. Why Tools Are Mocked

V1 focuses on proving the agent orchestration pattern, not real EMR/scheduling integration. The mocked tools return realistic structured data — appointment slots with provider availability, insurance verification status, scheduling confirmations — so the agent's decision-making logic is exercised against plausible inputs.

The tool interface is designed with real integration in mind. Each tool has a defined input schema and output contract. Swapping `mock_check_availability()` for a real Epic FHIR call would not require changes to the orchestrator or the agent's system prompt. The orchestrator calls tools by name and processes structured responses; it doesn't care where the data comes from.

This is intentional scope control. Building a fake EMR adapter would add weeks of work and wouldn't demonstrate anything about agent behavior. The interesting part is how the agent decides which tools to call, in what order, and how it handles edge cases — all of which work identically with mocked data.

## 2. Why One Workflow for v1

We chose schedule/reschedule as the primary workflow because it exercises the most tool calls and decision branching. A single scheduling conversation can involve availability checks, insurance verification, provider matching, time negotiation, and confirmation — five or more tool calls with conditional logic between each.

Supporting intents (hours inquiries, billing triage, urgent escalation) are included to show breadth. They prove the agent can route between workflows and handle out-of-scope requests gracefully. But they don't need the same depth of implementation to be convincing.

One deep workflow is more impressive than five shallow ones. A portfolio reviewer can see the full decision tree, the error handling, the guardrail enforcement, and the evaluation criteria all operating on a single complex flow. Shallow implementations across many workflows would demonstrate less technical depth.

The architecture supports adding more workflows without structural changes. The scenario system is extensible — new scenarios define their own tool permissions, evaluation criteria, and expected behaviors. Adding a prescription refill workflow would mean new scenario configs and tool implementations, not orchestrator changes.

## 3. Guardrail and Evaluation Design

Guardrails are enforced at multiple levels, not just in the system prompt:

- **System prompt rules** define behavioral boundaries (never diagnose, never override provider decisions, always escalate certain keywords).
- **Escalation trigger keywords** are checked before the agent response is returned. If a patient mentions chest pain or suicidal ideation, the system forces an escalation regardless of what the agent would have said.
- **Tool policy restrictions** prevent the agent from calling tools it shouldn't have access to in a given scenario. A billing-only scenario can't invoke scheduling tools.

The LLM-as-Judge evaluator uses a separate Claude call with structured output to grade conversations. It receives the full conversation transcript, the scenario's evaluation criteria, and a rubric. It returns scores across defined dimensions (accuracy, empathy, guardrail compliance, task completion) as structured JSON, not freeform text.

Evaluation criteria are defined per-scenario, not globally. A scheduling scenario cares about whether the agent confirmed the appointment details. An escalation scenario cares about whether the agent recognized the emergency and routed correctly. Global pass/fail would miss these distinctions.

The readiness dashboard aggregates eval results into actionable categories — guardrail compliance rate, task completion rate, average empathy score — rather than reducing everything to a single number. This makes it clear where the agent needs work.

## 4. Dynamic System Prompt Assembly

The core architectural bet: system prompts are assembled at runtime from practice config + agent config. The agent never has a static, hardcoded prompt.

A practice config defines the rules of the healthcare practice — accepted insurance plans, operating hours, available providers, escalation policies. An agent config defines the agent's persona, communication style, and behavioral constraints. At runtime, these are combined into a single system prompt.

This means changing practice rules automatically updates agent behavior. Add a new insurance plan to the practice config, and the agent starts accepting it in the next conversation. Change operating hours, and the agent quotes the new hours. No code changes, no redeployment.

This is the key differentiator from hardcoded prompt approaches. Most agent demos bake all context into a single prompt file. LaunchLab's approach mirrors how a real multi-tenant system would work — the orchestration logic is generic, and the business rules are data.

## 5. Three Separate LLM Subsystems

The Healthcare Agent, Patient Simulator, and LLM-as-Judge each get their own system prompt and API call. They are architecturally separate and never share a conversation context.

- **Healthcare Agent**: receives the assembled system prompt and patient messages, returns agent responses with tool calls.
- **Patient Simulator**: receives a patient persona and scenario description, generates realistic patient messages to test the agent.
- **LLM-as-Judge**: receives a completed conversation transcript and evaluation rubric, returns structured scores.

Never combining these in a single call keeps responsibilities clear. When an eval score is low, you know the issue is in the agent's behavior, not in prompt contamination between the simulator and the evaluator. Debugging is straightforward because each subsystem has a single job.

All three currently use Claude Sonnet, but they could be swapped to different models independently. The Judge could run on a larger model for better evaluation accuracy. The Simulator could run on a cheaper model since it just needs to produce realistic patient dialogue. The interface is the same regardless of which model backs it.

## 6. SQLite for v1

SQLite was chosen for zero-config, single-file persistence. No database server to install, no connection pooling to configure, no credentials to manage. The database is a single file that can be deleted and recreated in seconds during development.

For a portfolio project with single-user access patterns, SQLite's limitations (single-writer, no concurrent connections) are irrelevant. There's one developer running one instance.

The SQLAlchemy async layer means migrating to PostgreSQL would be a configuration change — swap the connection string and install `asyncpg`. The models, queries, and relationships would transfer without modification. This was a deliberate choice: use the simplest thing that works now, but don't paint yourself into a corner.

## 7. Future Expansion Ideas

These are directions the architecture could support without fundamental redesign:

- **Real voice/SMS integration via Twilio** — the agent already produces text responses; wrapping them in Twilio's API is an integration task, not an architecture change.
- **Multi-practice support** — the dynamic prompt assembly already separates practice config from agent config. Multi-tenancy would mean loading different practice configs per request.
- **A/B testing different agent configs** — run the same scenario with two different agent personas and compare eval scores. The eval system already supports this; it just needs a comparison UI.
- **Prompt versioning and comparison** — store prompt versions with timestamps, run evals against historical versions, track improvement over time.
- **Real EMR integration (FHIR)** — the mocked tool interface is designed for this. Implement the same tool contract against a FHIR server.
- **Multi-model comparison** — run the same scenario against GPT-4, Claude, and Gemini. The orchestrator is model-agnostic at the API boundary; each subsystem just needs a compatible client.
