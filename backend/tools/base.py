"""Base classes for the mocked tool layer."""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any


@dataclass
class ToolResult:
    """Structured result returned by every tool execution."""

    status: str  # "success" or "error"
    output: dict[str, Any] = field(default_factory=dict)


class BaseTool(ABC):
    """Abstract base for all mocked tools."""

    name: str
    description: str

    @abstractmethod
    async def execute(self, **kwargs: Any) -> ToolResult:
        """Run the tool with the given inputs. Never raises — returns ToolResult."""

    def _fail(self, message: str) -> ToolResult:
        """Convenience helper to return a structured error."""
        return ToolResult(status="error", output={"error": message})
