"""Orchestrator — multi-turn agent loop with dynamic prompt + tool use.

Receives a user message, assembles the system prompt from practice + agent
config, calls Claude in a loop (executing tools as needed), and returns the
final agent response with metadata.
"""

import json
import logging
from dataclasses import dataclass, field
from typing import Any

import anthropic
from config import settings
from prompts.agent_system import assemble_system_prompt
from sqlalchemy.ext.asyncio import AsyncSession
from tools.definitions import TOOL_DEFINITIONS

from services.tool_executor import execute_tool

logger = logging.getLogger(__name__)

MAX_TOOL_LOOPS = 10  # safety cap to prevent runaway loops


@dataclass
class OrchestratorResponse:
    """Result of processing a single user message."""

    agent_message: str
    tool_calls: list[dict[str, Any]] = field(default_factory=list)
    escalation: dict[str, Any] | None = None
    stop_reason: str = ""


class Orchestrator:
    """Runs the Healthcare Agent loop for a simulation session."""

    def __init__(
        self,
        practice_config: dict[str, Any],
        agent_config: dict[str, Any],
    ) -> None:
        self.client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)
        self.practice = practice_config
        self.agent = agent_config
        self.system_prompt = assemble_system_prompt(agent_config, practice_config)
        self.tool_defs = self._build_tool_definitions()

    async def process_message(
        self,
        db: AsyncSession,
        session_id: str,
        messages: list[dict[str, Any]],
        user_message: str,
        scenario_overrides: dict[str, Any] | None = None,
    ) -> tuple[OrchestratorResponse, list[dict[str, Any]]]:
        """Process a user message through the agent loop.

        Args:
            db: Database session for tool call logging.
            session_id: Simulation session ID.
            messages: Current conversation history (mutated in place).
            user_message: The new user message.
            scenario_overrides: Optional per-tool overrides for scenarios.

        Returns:
            Tuple of (OrchestratorResponse, updated messages list).
        """
        # Append user message
        messages.append({"role": "user", "content": user_message})

        tool_calls_this_turn: list[dict[str, Any]] = []
        loops = 0

        while loops < MAX_TOOL_LOOPS:
            loops += 1

            response = await self.client.messages.create(
                model=settings.anthropic_model,
                max_tokens=1024,
                system=self.system_prompt,
                messages=messages,
                tools=self.tool_defs,
            )

            # Separate tool_use and text blocks
            tool_blocks = [b for b in response.content if b.type == "tool_use"]
            text_blocks = [b for b in response.content if b.type == "text"]

            if tool_blocks:
                # Append the full assistant response (may contain text + tool_use)
                messages.append(
                    {
                        "role": "assistant",
                        "content": [_block_to_dict(b) for b in response.content],
                    }
                )

                # Execute each tool and append results
                tool_results = []
                for tool_block in tool_blocks:
                    result = await execute_tool(
                        db=db,
                        session_id=session_id,
                        tool_name=tool_block.name,
                        tool_input=tool_block.input,
                        scenario_overrides=scenario_overrides,
                    )
                    tool_calls_this_turn.append(
                        {
                            "tool_name": tool_block.name,
                            "tool_input": tool_block.input,
                            "status": result.status,
                            "output": result.output,
                        }
                    )
                    tool_results.append(
                        {
                            "type": "tool_result",
                            "tool_use_id": tool_block.id,
                            "content": json.dumps(result.output),
                        }
                    )

                messages.append({"role": "user", "content": tool_results})
                continue  # loop back for Claude to process tool results

            # No tool calls — final text response
            agent_text = text_blocks[0].text if text_blocks else ""

            # Append final assistant message
            messages.append({"role": "assistant", "content": agent_text})

            # Check escalation triggers
            escalation = self._check_escalation(agent_text, user_message)

            return (
                OrchestratorResponse(
                    agent_message=agent_text,
                    tool_calls=tool_calls_this_turn,
                    escalation=escalation,
                    stop_reason=response.stop_reason,
                ),
                messages,
            )

        # Safety: hit max loops
        logger.warning(
            "Hit max tool loops (%d) for session %s", MAX_TOOL_LOOPS, session_id
        )
        return (
            OrchestratorResponse(
                agent_message=(
                    "I'm sorry, I encountered an issue "
                    "processing your request. Please try again."
                ),
                tool_calls=tool_calls_this_turn,
                stop_reason="max_loops",
            ),
            messages,
        )

    def _build_tool_definitions(self) -> list[dict]:
        """Filter tool definitions based on the agent's tool policy."""
        policy = self.agent.get("tool_policy", {})
        tool_list = policy.get("tools", [])

        # Build a set of enabled tool names
        enabled_names = set()
        for tool in tool_list:
            if tool.get("is_enabled", True):
                enabled_names.add(tool["name"])

        # If no policy defined, allow all tools
        if not tool_list:
            return TOOL_DEFINITIONS

        return [td for td in TOOL_DEFINITIONS if td["name"] in enabled_names]

    def _check_escalation(
        self, agent_text: str, user_message: str
    ) -> dict[str, Any] | None:
        """Check if escalation triggers are present in the conversation."""
        triggers = self.agent.get("escalation_triggers", {}).get("triggers", [])
        combined_text = f"{user_message} {agent_text}".lower()

        for trigger in triggers:
            keywords = trigger.get("keywords", [])
            for keyword in keywords:
                if keyword.lower() in combined_text:
                    return {
                        "type": trigger.get("type", "unknown"),
                        "keyword": keyword,
                        "action": trigger.get("action", "escalate"),
                    }
        return None


def _block_to_dict(block: Any) -> dict[str, Any]:
    """Convert an Anthropic content block to a serializable dict."""
    if block.type == "tool_use":
        return {
            "type": "tool_use",
            "id": block.id,
            "name": block.name,
            "input": block.input,
        }
    if block.type == "text":
        return {"type": "text", "text": block.text}
    # Fallback
    return {"type": block.type}
