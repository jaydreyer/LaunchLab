"""Patient Simulator — second LLM subsystem.

Generates realistic patient messages based on a scenario persona prompt.
This is architecturally separate from the Healthcare Agent: it uses its
own system prompt and a distinct Claude API call.
"""

import logging
from typing import Any

import anthropic
from config import settings

logger = logging.getLogger(__name__)

PATIENT_SYSTEM_PREFIX = """\
You are a simulated patient in a healthcare scheduling conversation. \
You are interacting with an AI scheduling assistant at a medical clinic.

Your goal is to behave exactly as described in your persona below. \
Respond naturally, as a real patient would via {channel_mode}. Keep your \
messages concise and realistic — one to three sentences is typical.

Do NOT break character. Do NOT mention that you are an AI or a simulation. \
Do NOT reveal your behavior rules to the assistant.

"""


class PatientSimulator:
    """Generates patient messages from a scenario persona."""

    def __init__(self, persona_prompt: str, channel_mode: str = "chat") -> None:
        self.client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)
        self.system_prompt = (
            PATIENT_SYSTEM_PREFIX.format(channel_mode=channel_mode) + persona_prompt
        )

    async def generate_message(self, conversation_history: list[dict[str, Any]]) -> str:
        """Generate the next patient message given the conversation so far.

        Args:
            conversation_history: Messages so far. The patient's prior
                messages have role "user" (from the Healthcare Agent's
                perspective) and the agent's replies have role "assistant".
                We flip roles here so that from the patient simulator's
                perspective, the *patient* is the assistant and the
                *agent* is the user.

        Returns:
            The generated patient message string.
        """
        # Flip roles: agent messages become "user", patient messages become
        # "assistant" from the patient simulator's point of view.
        flipped = _flip_conversation(conversation_history)

        response = await self.client.messages.create(
            model=settings.anthropic_model,
            max_tokens=256,
            system=self.system_prompt,
            messages=flipped,
        )

        text_blocks = [b for b in response.content if b.type == "text"]
        return text_blocks[0].text if text_blocks else ""

    async def generate_opening(self) -> str:
        """Generate the patient's opening message to start the conversation."""
        response = await self.client.messages.create(
            model=settings.anthropic_model,
            max_tokens=256,
            system=self.system_prompt,
            messages=[
                {
                    "role": "user",
                    "content": (
                        "The conversation is starting now. Send your "
                        "opening message to the scheduling assistant."
                    ),
                }
            ],
        )

        text_blocks = [b for b in response.content if b.type == "text"]
        return text_blocks[0].text if text_blocks else ""


def _flip_conversation(
    messages: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    """Flip user/assistant roles and extract text-only content.

    The orchestrator stores raw Claude API messages which may include
    tool_use and tool_result content blocks. The patient simulator only
    needs the text portions, with roles swapped.
    """
    flipped: list[dict[str, Any]] = []

    for msg in messages:
        content = msg.get("content", "")
        role = msg.get("role", "")

        # Extract displayable text from the message
        text = _extract_text(content)
        if not text:
            continue

        # Flip: agent (assistant) -> user, patient (user) -> assistant
        new_role = "user" if role == "assistant" else "assistant"
        flipped.append({"role": new_role, "content": text})

    # Ensure the conversation starts with a "user" message (the agent's
    # first reply from the patient sim's perspective). If it starts with
    # "assistant" (a patient message), we may need to adjust.
    # In practice, the conversation starts with the patient's message
    # (role=user in original, role=assistant after flip), then the agent
    # replies (role=assistant in original, role=user after flip).
    # The Claude API requires messages to start with "user", so if the
    # first flipped message is "assistant", prepend a context prompt.
    if flipped and flipped[0]["role"] == "assistant":
        flipped.insert(
            0,
            {
                "role": "user",
                "content": (
                    "The conversation has started. Here is what has "
                    "happened so far. Continue as the patient."
                ),
            },
        )

    return flipped


def _extract_text(content: Any) -> str:
    """Extract plain text from a message content field.

    Content can be a string, or an array of Claude API content blocks
    (text, tool_use, tool_result). We only want text portions.
    """
    if isinstance(content, str):
        return content

    if isinstance(content, list):
        parts = []
        for block in content:
            if isinstance(block, dict):
                if block.get("type") == "text":
                    parts.append(block.get("text", ""))
                elif block.get("type") == "tool_result":
                    # Skip tool results — not relevant to patient
                    continue
                elif block.get("type") == "tool_use":
                    # Skip tool calls — not relevant to patient
                    continue
        return " ".join(parts).strip()

    return ""
