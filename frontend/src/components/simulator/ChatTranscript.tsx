import { useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";
import type { ChatMessage, EscalationOut } from "@/api/simulations";
import { ChatBubble } from "./ChatBubble";
import { EscalationBanner } from "./EscalationBanner";

interface ChatTranscriptProps {
  messages: ChatMessage[];
  escalation: EscalationOut | null;
  sending: boolean;
  variant: "chat" | "sms";
}

export function ChatTranscript({
  messages,
  escalation,
  sending,
  variant,
}: ChatTranscriptProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, sending]);

  if (messages.length === 0 && !sending) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-sm text-muted-foreground">
        Start a conversation by typing a message below.
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
      {messages.map((msg, i) => (
        <ChatBubble key={i} message={msg} variant={variant} />
      ))}
      {escalation && <EscalationBanner escalation={escalation} />}
      {sending && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Agent is thinking...
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}
