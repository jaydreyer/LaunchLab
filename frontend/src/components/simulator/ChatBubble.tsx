import { Bot, User } from "lucide-react";
import type { ChatMessage } from "@/api/simulations";

interface ChatBubbleProps {
  message: ChatMessage;
  variant: "chat" | "sms";
}

export function ChatBubble({ message, variant }: ChatBubbleProps) {
  const isUser = message.role === "user";
  const isSms = variant === "sms";
  const text = extractText(message.content);

  // Skip non-displayable messages (tool_use / tool_result blocks)
  if (!text) return null;

  return (
    <div className={`flex gap-2 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      <div
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground"
        }`}
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>
      <div
        className={`max-w-[80%] rounded-lg px-3 py-2 text-sm leading-relaxed ${
          isSms ? "font-mono text-xs" : ""
        } ${
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-foreground"
        }`}
      >
        <span className="whitespace-pre-wrap">{text}</span>
      </div>
    </div>
  );
}

function extractText(
  content: string | Record<string, unknown>[],
): string | null {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    const parts = content
      .filter((b) => b.type === "text" && typeof b.text === "string")
      .map((b) => b.text as string);
    return parts.length > 0 ? parts.join("\n") : null;
  }
  return null;
}
