import { Bot, User } from "lucide-react";
import type { ChatMessage } from "@/api/simulations";

interface ChatBubbleProps {
  message: ChatMessage;
  variant: "chat" | "sms";
}

export function ChatBubble({ message, variant }: ChatBubbleProps) {
  const isUser = message.role === "user";
  const isSms = variant === "sms";

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
        <p className="whitespace-pre-wrap">{message.content}</p>
      </div>
    </div>
  );
}
