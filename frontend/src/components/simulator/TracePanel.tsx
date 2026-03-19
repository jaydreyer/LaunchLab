import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Wrench,
  Hash,
  Info,
  ExternalLink,
} from "lucide-react";
import type { EscalationOut } from "@/api/simulations";
import type { TrackedToolCall } from "@/stores/simulationStore";

interface TracePanelProps {
  sessionId?: string;
  scenarioName: string | null;
  toolCalls: TrackedToolCall[];
  escalation: EscalationOut | null;
  turnCount: number;
}

export function TracePanel({
  sessionId,
  scenarioName,
  toolCalls,
  escalation,
  turnCount,
}: TracePanelProps) {
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      {/* Scenario Info */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Info className="h-4 w-4" />
            Session Info
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Scenario</span>
            <span className="font-medium">
              {scenarioName ?? "Free conversation"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Turns</span>
            <Badge variant="secondary" className="gap-1">
              <Hash className="h-3 w-3" />
              {turnCount}
            </Badge>
          </div>
          {sessionId && (
            <Button
              variant="outline"
              size="sm"
              className="mt-2 w-full"
              onClick={() => navigate(`/simulator/${sessionId}/trace`)}
            >
              <ExternalLink className="mr-1 h-3 w-3" />
              View Full Trace
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Tool Calls */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Wrench className="h-4 w-4" />
            Tool Calls
            {toolCalls.length > 0 && (
              <Badge variant="secondary" className="ml-auto">
                {toolCalls.length}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {toolCalls.length === 0 ? (
            <p className="text-sm text-muted-foreground">No tool calls yet.</p>
          ) : (
            <div className="space-y-2">
              {toolCalls.map((tc, i) => (
                <ToolCallCard key={i} toolCall={tc} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Escalation */}
      {escalation && (
        <Card className="border-destructive/50">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm text-destructive">
              <AlertTriangle className="h-4 w-4" />
              Escalation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <div>
              <span className="text-muted-foreground">Type: </span>
              {escalation.type}
            </div>
            <div>
              <span className="text-muted-foreground">Keyword: </span>
              &ldquo;{escalation.keyword}&rdquo;
            </div>
            <div>
              <span className="text-muted-foreground">Action: </span>
              {escalation.action}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ToolCallCard({ toolCall }: { toolCall: TrackedToolCall }) {
  const [expanded, setExpanded] = useState(false);
  const isError = toolCall.status === "error";

  return (
    <div
      className={`rounded-md border text-sm ${
        isError ? "border-destructive/30 bg-destructive/5" : "border-border"
      }`}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-accent/50"
      >
        {expanded ? (
          <ChevronDown className="h-3 w-3 shrink-0" />
        ) : (
          <ChevronRight className="h-3 w-3 shrink-0" />
        )}
        <span className="font-mono text-xs font-medium">
          {toolCall.tool_name}
        </span>
        <span className="ml-auto flex items-center gap-2">
          {toolCall.duration_ms != null && (
            <span className="text-[10px] text-muted-foreground">
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
        <div className="space-y-2 border-t border-border px-3 py-2">
          <div>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Input
            </p>
            <pre className="overflow-x-auto rounded bg-muted p-2 text-xs">
              {JSON.stringify(toolCall.tool_input, null, 2)}
            </pre>
          </div>
          <div>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Output
            </p>
            <pre className="overflow-x-auto rounded bg-muted p-2 text-xs">
              {JSON.stringify(toolCall.output, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
