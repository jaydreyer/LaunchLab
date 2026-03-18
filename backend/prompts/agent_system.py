"""Dynamic system prompt assembly for the Healthcare Agent.

The system prompt is built at runtime from practice config + agent config.
Changing a guardrail or workflow step in the UI immediately changes agent
behavior on the next message — this is the core architectural feature.
"""

from typing import Any


def assemble_system_prompt(
    agent_config: dict[str, Any],
    practice_config: dict[str, Any],
) -> str:
    """Build the full system prompt from agent config + practice context.

    Args:
        agent_config: Dict with keys: system_prompt, workflow_config,
            guardrails, escalation_triggers, tool_policy, tone_guidelines.
        practice_config: Dict with keys: name, locations, providers,
            hours, appointment_types, insurance_rules, escalation_rules.
    """
    parts = [
        agent_config["system_prompt"],
        _format_tone(agent_config.get("tone_guidelines", {})),
        _format_practice_context(practice_config),
        _format_workflow_steps(agent_config.get("workflow_config", {})),
        _format_guardrails(agent_config.get("guardrails", {})),
        _format_escalation_rules(agent_config.get("escalation_triggers", {})),
        _format_tool_policy(agent_config.get("tool_policy", {})),
    ]
    return "\n".join(part for part in parts if part)


def _format_tone(tone: dict[str, Any]) -> str:
    if not tone:
        return ""
    lines = [f"\n\n## Tone & Style\n{tone.get('tone', '')}"]
    for rule in tone.get("style_rules", []):
        lines.append(f"- {rule}")
    return "\n".join(lines)


def _format_practice_context(practice: dict[str, Any]) -> str:
    name = practice.get("name", "the practice")
    lines = [f"\n\n## Practice Information\nYou work for {name}."]

    # Locations
    locations = practice.get("locations", {})
    if locations:
        lines.append("\n### Locations")
        for key, loc in locations.items():
            name = loc.get("name", key)
            addr = loc.get("address", "")
            phone = loc.get("phone", "")
            same_day = loc.get("same_day_sick_visits", False)
            lines.append(f"- **{name}** ({key}): {addr}, {phone}")
            if same_day:
                lines.append("  - Accepts same-day sick visits")

    # Providers
    providers = practice.get("providers", {})
    if providers:
        lines.append("\n### Providers")
        for key, prov in providers.items():
            title = prov.get("title", "")
            name = prov.get("name", key)
            locs = ", ".join(prov.get("locations", []))
            types = ", ".join(
                t.replace("_", " ") for t in prov.get("appointment_types", [])
            )
            lines.append(
                f"- **{name}** ({title}, {key}): locations [{locs}], types [{types}]"
            )

    # Appointment types
    appt_types = practice.get("appointment_types", {})
    if appt_types:
        lines.append("\n### Appointment Types")
        for key, info in appt_types.items():
            dur = info.get("duration_min", "?")
            new_ok = "yes" if info.get("is_new_patient_ok") else "no"
            lines.append(
                f"- **{key.replace('_', ' ')}**: {dur} min, new patients: {new_ok}"
            )

    # Insurance
    insurance = practice.get("insurance_rules", {})
    if insurance:
        accepted = ", ".join(insurance.get("accepted", []))
        not_accepted = ", ".join(insurance.get("not_accepted", []))
        uncertain = ", ".join(insurance.get("uncertain", []))
        lines.append("\n### Insurance")
        if accepted:
            lines.append(f"- Accepted: {accepted}")
        if not_accepted:
            lines.append(f"- Not accepted: {not_accepted}")
        if uncertain:
            lines.append(f"- Needs verification: {uncertain}")

    return "\n".join(lines)


def _format_workflow_steps(workflow: dict[str, Any]) -> str:
    steps = workflow.get("steps", [])
    if not steps:
        return ""
    lines = ["\n\n## Workflow Steps\nFollow these steps in order:"]
    for step in sorted(steps, key=lambda s: s.get("order", 0)):
        lines.append(f"{step['order']}. {step['step']}")
    return "\n".join(lines)


def _format_guardrails(guardrails: dict[str, Any]) -> str:
    rules = guardrails.get("rules", [])
    if not rules:
        return ""
    lines = ["\n\n## Guardrails\nYou MUST follow these rules:"]
    for rule in rules:
        lines.append(f"- {rule}")
    return "\n".join(lines)


def _format_escalation_rules(triggers: dict[str, Any]) -> str:
    trigger_list = triggers.get("triggers", [])
    if not trigger_list:
        return ""
    lines = ["\n\n## Escalation Rules"]
    for trigger in trigger_list:
        t_type = trigger.get("type", "unknown")
        keywords = ", ".join(trigger.get("keywords", []))
        action = trigger.get("action", "escalate")
        lines.append(f"- **{t_type}** (keywords: {keywords}): action = {action}")
    return "\n".join(lines)


def _format_tool_policy(policy: dict[str, Any]) -> str:
    tools = policy.get("tools", [])
    if not tools:
        return ""
    lines = ["\n\n## Tool Usage Policy"]
    for tool in tools:
        name = tool.get("name", "unknown")
        enabled = tool.get("is_enabled", True)
        if not enabled:
            lines.append(f"- **{name}**: DISABLED — do not use")
            continue
        constraints = []
        if "required_before" in tool:
            constraints.append(f"required before {tool['required_before']}")
        if "use_when" in tool:
            constraints.append(f"use when {tool['use_when']}")
        suffix = f" ({', '.join(constraints)})" if constraints else ""
        lines.append(f"- **{name}**: enabled{suffix}")
    return "\n".join(lines)
