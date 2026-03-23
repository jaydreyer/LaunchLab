# LaunchLab -- Portfolio Summary

## One-Line Version

Built a full-stack healthcare agent launch simulator with three-LLM-subsystem architecture, dynamic prompt assembly, realistic patient simulations via tool-use orchestration, and automated launch readiness evaluation using Claude API, FastAPI, and React.

---

## Expanded Project Description

LaunchLab is a deployment readiness platform for healthcare AI agents. It addresses a real gap in the agent development lifecycle: before a scheduling agent goes live in a medical practice, someone needs to configure it, stress-test it against realistic patient interactions, and systematically evaluate whether it handles edge cases -- billing diversions, urgent symptom escalation, tool failures, missing patient information -- before approving it for pilot. LaunchLab provides that end-to-end workflow in a single application.

The system is built around three architecturally separated LLM subsystems, all powered by Claude but with distinct roles and system prompts. The Healthcare Agent is the system under test -- a scheduling assistant whose behavior is fully controlled by dynamic system prompt assembly, where the prompt is built at runtime from practice configuration, workflow steps, guardrails, escalation rules, and tool policies. The Patient Simulator is a second LLM that generates realistic patient messages from scenario-specific personas, driving multi-turn conversations without manual input. The LLM-as-Judge Evaluator is a third LLM call that grades completed transcripts against per-scenario criteria (intent recognition, tool usage correctness, guardrail compliance, escalation behavior) and produces structured pass/fail judgments with failure reasons.

The full stack includes a FastAPI backend with async SQLAlchemy and SQLite persistence, six mocked healthcare tools with conditional logic and failure modes, a Pydantic-validated REST API, and a React 18 frontend built with TypeScript, Tailwind CSS, shadcn/ui, and Zustand. The frontend includes a practice configuration editor, an agent behavior config screen, a conversation simulator with a tool trace panel, an eval runner, and a launch readiness dashboard with category-level pass rates and go/no-go recommendations.

---

## Resume Bullets

- Architected a three-LLM-subsystem separation (Healthcare Agent, Patient Simulator, LLM-as-Judge) with distinct system prompts and execution patterns, ensuring clean boundaries between the agent under test, synthetic patient generation, and automated evaluation
- Built dynamic system prompt assembly that constructs agent behavior at runtime from practice configuration, workflow definitions, guardrails, escalation triggers, and tool policies -- enabling behavior changes through configuration without code modifications
- Implemented an LLM-as-Judge evaluation pipeline that runs a 10-scenario test suite, grades transcripts against per-scenario criteria (intent detection, tool usage, escalation correctness, guardrail compliance), and produces structured pass/fail results with failure reasoning
- Designed healthcare-specific guardrails and escalation detection including urgent symptom interruption, billing question routing, medical advice refusal, and graceful tool failure recovery across six mocked operational tools with conditional logic
- Built a full-stack application with FastAPI (async endpoints, Pydantic validation, SQLAlchemy 2.0), React 18 (TypeScript strict mode, Zustand, shadcn/ui), and SQLite, deployed via Cloudflare Pages and Cloudflare Tunnel
- Created an automated eval suite with per-scenario acceptance criteria covering happy paths, edge cases, and failure modes, feeding into a launch readiness dashboard with category-level scoring and go/no-go pilot recommendations

---

## Target Roles This Maps To

**AI/ML Engineer** -- Demonstrates prompt engineering, multi-agent orchestration, tool-use patterns, LLM evaluation methodology, and structured output handling with production-grade separation of concerns.

**Full-Stack Engineer (AI-focused)** -- Shows end-to-end ownership from database schema to API design to frontend, with async Python, TypeScript, and modern React patterns throughout.

**Healthcare Tech / Health AI** -- Highlights domain-specific design decisions: clinical guardrails, escalation protocols, appointment scheduling workflows, insurance handling, and the kind of safety-first thinking healthcare deployments require.

**Solutions Engineer / Technical Implementation** -- Demonstrates the ability to translate business requirements (practice rules, compliance constraints, workflow logic) into a configurable system, evaluate deployment readiness, and explain technical tradeoffs -- the core of what solutions engineers do when deploying AI in regulated industries.
