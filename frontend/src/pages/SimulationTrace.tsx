import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  ArrowLeft,
  Bot,
  ChevronDown,
  ChevronRight,
  Clock,
  User,
  Wrench,
  FileSearch,
} from "lucide-react";
import { LoadingState, EmptyState } from "@/components/ui/empty-state";
import {
  getSimulation,
  getToolCalls,
  type ChatMessage,
  type SimulationSession,
  type ToolCallRecord,
} from "@/api/simulations";

export default function SimulationTrace() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [session, setSession] = useState<SimulationSession | null>(null);
  const [toolCalls, setToolCalls] = useState<ToolCallRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    async function load() {
      setLoading(true);
      try {
        const [s, tc] = await Promise.all([
          getSimulation(id!),
          getToolCalls(id!),
        ]);
        setSession(s);
        setToolCalls(tc);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load trace data",
        );
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div>
        <PageHeader title="Simulation Trace" />
        <LoadingState message="Loading trace data..." />
      </div>
    );
  }

  if (error || !session) {
    return (
      <div>
        <PageHeader title="Simulation Trace" />
        {error ? (
          <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        ) : (
          <EmptyState
            icon={FileSearch}
            heading="Session not found"
            description="This simulation session may have been deleted or the ID is invalid."
          />
        )}
      </div>
    );
  }

  const outcome = parseOutcome(session.outcome);
  const timeline = buildTimeline(session.messages, toolCalls);

  return (
    <div className="flex flex-col">
      <PageHeader
        title="Simulation Trace"
        description="Full timeline of messages, tool calls, and outcomes."
        actions={
          <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back
          </Button>
        }
      />

      {/* Session Metadata */}
      <Card className="mb-6">
        <CardContent className="flex flex-wrap gap-x-8 gap-y-2 pt-6 text-sm">
          <div>
            <span className="text-muted-foreground">Scenario: </span>
            <span className="font-medium">
              {session.scenario_name ?? "Free conversation"}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Channel: </span>
            <Badge variant="secondary">{session.channel_mode}</Badge>
          </div>
          <div>
            <span className="text-muted-foreground">Started: </span>
            <span>{formatTimestamp(session.started_at)}</span>
          </div>
          {session.completed_at && (
            <div>
              <span className="text-muted-foreground">Completed: </span>
              <span>{formatTimestamp(session.completed_at)}</span>
            </div>
          )}
          <div>
            <span className="text-muted-foreground">Messages: </span>
            <span>{session.messages.length}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Tool Calls: </span>
            <span>{toolCalls.length}</span>
          </div>
        </CardContent>
      </Card>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical connector line */}
        <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />

        <div className="space-y-4">
          {timeline.map((entry, i) => {
            if (entry.type === "message") {
              return <TimelineMessage key={i} message={entry.data} />;
            }
            return <TimelineToolCall key={i} toolCall={entry.data} />;
          })}
        </div>
      </div>

      {/* Escalation */}
      {outcome?.status === "escalated" && outcome.escalation && (
        <Card className="mt-6 border-destructive/50 bg-destructive/5">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm text-destructive">
              <AlertTriangle className="h-4 w-4" />
              Escalation Triggered
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Type
                </p>
                <p className="mt-0.5 font-medium">{outcome.escalation.type}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Trigger
                </p>
                <p className="mt-0.5 font-medium">
                  &ldquo;{outcome.escalation.keyword}&rdquo;
                </p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Action
                </p>
                <p className="mt-0.5 font-medium">
                  {outcome.escalation.action}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Outcome */}
      <Card className="mt-6">
        <CardContent className="flex items-center gap-3 pt-6">
          <span className="text-sm font-medium text-muted-foreground">
            Outcome:
          </span>
          {outcome ? (
            <Badge
              variant={
                outcome.status === "escalated" ? "destructive" : "default"
              }
              className={
                outcome.status === "completed"
                  ? "bg-green-600 hover:bg-green-700"
                  : ""
              }
            >
              {outcome.status}
            </Badge>
          ) : (
            <span className="text-sm text-muted-foreground">
              No outcome recorded
            </span>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* --- Timeline Builder --- */

interface TimelineMessageEntry {
  type: "message";
  data: ChatMessage;
  timestamp: number;
}

interface TimelineToolCallEntry {
  type: "tool_call";
  data: ToolCallRecord;
  timestamp: number;
}

type TimelineEntry = TimelineMessageEntry | TimelineToolCallEntry;

function buildTimeline(
  messages: ChatMessage[],
  toolCalls: ToolCallRecord[],
): TimelineEntry[] {
  // The raw message array contains tool_use blocks (in assistant messages)
  // and tool_result blocks (in user messages). These are internal orchestrator
  // messages that shouldn't be displayed as chat bubbles — they're replaced
  // by the ToolCallRecord entries from the DB.
  //
  // Strategy: walk messages. When we encounter a message whose content is
  // an array containing a tool_use or tool_result block, it's an internal
  // message. We count tool_result messages to know how many tool calls have
  // occurred, then insert the corresponding DB tool call records before the
  // next displayable assistant message.
  const entries: TimelineEntry[] = [];
  let tcIdx = 0;
  let pendingToolCalls: ToolCallRecord[] = [];

  for (const msg of messages) {
    const content = msg.content;

    // Check if this is an internal tool_use or tool_result message
    if (Array.isArray(content)) {
      const blockTypes = content.map(
        (b: Record<string, unknown>) => b.type as string,
      );

      // Count tool_result blocks — each one maps to a DB ToolCall record
      if (blockTypes.includes("tool_result")) {
        const resultCount = blockTypes.filter(
          (t) => t === "tool_result",
        ).length;
        for (let i = 0; i < resultCount && tcIdx < toolCalls.length; i++) {
          pendingToolCalls.push(toolCalls[tcIdx]);
          tcIdx++;
        }
        continue; // Don't render tool_result messages as chat bubbles
      }

      // tool_use-only assistant messages (no text) — skip the bubble,
      // the tool call card will represent this turn
      if (blockTypes.includes("tool_use") && !blockTypes.includes("text")) {
        continue;
      }
    }

    // Before a displayable assistant message, flush any pending tool calls
    if (msg.role === "assistant" && pendingToolCalls.length > 0) {
      for (const tc of pendingToolCalls) {
        entries.push({
          type: "tool_call",
          data: tc,
          timestamp: new Date(tc.created_at).getTime(),
        });
      }
      pendingToolCalls = [];
    }

    // Add displayable message (has text content)
    const text = extractTextContent(content);
    if (text) {
      entries.push({ type: "message", data: msg, timestamp: 0 });
    }
  }

  // Flush any remaining tool calls
  for (const tc of pendingToolCalls) {
    entries.push({
      type: "tool_call",
      data: tc,
      timestamp: new Date(tc.created_at).getTime(),
    });
  }
  // Any unmatched DB tool calls
  while (tcIdx < toolCalls.length) {
    entries.push({
      type: "tool_call",
      data: toolCalls[tcIdx],
      timestamp: new Date(toolCalls[tcIdx].created_at).getTime(),
    });
    tcIdx++;
  }

  return entries;
}

/* --- Sub-Components --- */

function TimelineMessage({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  const text = extractTextContent(message.content);

  if (!text) return null;

  return (
    <div className="relative flex gap-3 pl-10">
      {/* Timeline dot */}
      <div
        className={`absolute left-2 top-3 z-10 flex h-5 w-5 items-center justify-center rounded-full ${
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground"
        }`}
      >
        {isUser ? <User className="h-3 w-3" /> : <Bot className="h-3 w-3" />}
      </div>

      <div className="flex-1">
        <p className="mb-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          {isUser ? "Patient" : "Agent"}
        </p>
        <div
          className={`rounded-lg px-4 py-3 text-sm leading-relaxed ${
            isUser
              ? "bg-primary/10 text-foreground"
              : "bg-muted text-foreground"
          }`}
        >
          <span className="whitespace-pre-wrap">{text}</span>
        </div>
      </div>
    </div>
  );
}

function TimelineToolCall({ toolCall }: { toolCall: ToolCallRecord }) {
  const [expanded, setExpanded] = useState(false);
  const isError = toolCall.status === "error";

  return (
    <div className="relative pl-10">
      {/* Timeline dot */}
      <div className="absolute left-2 top-2 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
        <Wrench className="h-3 w-3" />
      </div>

      <div
        className={`rounded-md border text-sm ${
          isError
            ? "border-destructive/30 bg-destructive/5"
            : "border-amber-200 bg-amber-50/50 dark:border-amber-800/30 dark:bg-amber-900/10"
        }`}
      >
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-accent/30"
        >
          {expanded ? (
            <ChevronDown className="h-3 w-3 shrink-0 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground" />
          )}
          <span className="font-mono text-xs font-medium">
            {toolCall.tool_name}
          </span>
          <span className="ml-auto flex items-center gap-2">
            {toolCall.duration_ms != null && (
              <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <Clock className="h-3 w-3" />
                {toolCall.duration_ms}ms
              </span>
            )}
            <Badge
              variant={isError ? "destructive" : "default"}
              className={`text-[10px] ${!isError ? "bg-green-600 hover:bg-green-700" : ""}`}
            >
              {toolCall.status}
            </Badge>
          </span>
        </button>
        {expanded && (
          <div className="space-y-2 border-t border-border/50 px-3 py-2">
            <div>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Input
              </p>
              <pre className="overflow-x-auto rounded bg-background p-2 text-xs">
                {JSON.stringify(toolCall.tool_input, null, 2)}
              </pre>
            </div>
            <div>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Output
              </p>
              <pre className="overflow-x-auto rounded bg-background p-2 text-xs">
                {JSON.stringify(toolCall.tool_output, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* --- Helpers --- */

/**
 * Extract displayable text from a message content field.
 * Content can be a plain string or an array of Claude API content blocks
 * (e.g. [{type: "text", text: "..."}, {type: "tool_use", ...}]).
 * Tool_result blocks from the user side are internal and should be hidden.
 */
function extractTextContent(content: unknown): string | null {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    const textParts = content
      .filter(
        (block: Record<string, unknown>) =>
          block.type === "text" && typeof block.text === "string",
      )
      .map((block: Record<string, unknown>) => block.text as string);
    return textParts.length > 0 ? textParts.join("\n") : null;
  }
  return null;
}

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString();
}

function parseOutcome(outcome: string | null): {
  status: string;
  escalation?: { type: string; keyword: string; action: string };
} | null {
  if (!outcome) return null;
  try {
    return JSON.parse(outcome);
  } catch {
    return { status: outcome };
  }
}
