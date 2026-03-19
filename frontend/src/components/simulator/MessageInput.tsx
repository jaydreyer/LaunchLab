import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Send, Loader2 } from "lucide-react";

interface MessageInputProps {
  onSend: (content: string) => void;
  disabled?: boolean;
  sending?: boolean;
}

export function MessageInput({ onSend, disabled, sending }: MessageInputProps) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || disabled || sending) return;
    onSend(trimmed);
    setValue("");
    inputRef.current?.focus();
  }, [value, disabled, sending, onSend]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex gap-2 border-t border-border bg-card p-3">
      <textarea
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type a message..."
        disabled={disabled || sending}
        rows={1}
        className="min-h-[38px] flex-1 resize-none rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
      />
      <Button
        size="sm"
        onClick={handleSubmit}
        disabled={!value.trim() || disabled || sending}
        className="self-end"
      >
        {sending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Send className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}
