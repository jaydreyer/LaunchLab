import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/PageHeader";
import { ChatTranscript } from "@/components/simulator/ChatTranscript";
import { MessageInput } from "@/components/simulator/MessageInput";
import { TracePanel } from "@/components/simulator/TracePanel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSimulationStore } from "@/stores/simulationStore";
import { usePracticeStore } from "@/stores/practiceStore";
import { useAgentConfigStore } from "@/stores/agentConfigStore";
import { type ScenarioSummary, listScenarios } from "@/api/scenarios";
import {
  Loader2,
  Plus,
  RotateCcw,
  MessageSquare,
  Smartphone,
  Bot,
  Settings,
} from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

export default function Simulator() {
  const {
    session,
    transcript,
    toolCalls,
    escalation,
    channelMode,
    loading,
    sending,
    error,
    createSession,
    send,
    autoRespond,
    setChannelMode,
    clearSession,
  } = useSimulationStore();

  const practice = usePracticeStore((s) => s.practice);
  const fetchPractice = usePracticeStore((s) => s.fetchCurrent);
  const config = useAgentConfigStore((s) => s.config);
  const fetchConfig = useAgentConfigStore((s) => s.fetchCurrent);

  const [selectedScenario, setSelectedScenario] = useState("");
  const [scenarios, setScenarios] = useState<ScenarioSummary[]>([]);

  useEffect(() => {
    if (!practice) fetchPractice();
    if (!config) fetchConfig();
    listScenarios()
      .then(setScenarios)
      .catch(() => {
        /* fallback: empty list, free conversation only */
      });
  }, [practice, config, fetchPractice, fetchConfig]);

  async function handleNewSession() {
    if (!practice || !config) {
      toast.error("Load a practice and agent config first.");
      return;
    }
    await createSession(practice.id, config.id, selectedScenario || null);
  }

  async function handleRerun() {
    clearSession();
    await handleNewSession();
  }

  function handleSend(content: string) {
    send(content);
  }

  const turnCount = Math.floor(
    transcript.filter((m) => m.role === "user").length,
  );

  const needsSetup = !practice || !config;

  return (
    <div className="flex flex-col">
      <PageHeader
        title="Conversation Simulator"
        description="Run live conversations between the healthcare agent and simulated patients."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {/* Scenario picker */}
            <select
              value={selectedScenario}
              onChange={(e) => setSelectedScenario(e.target.value)}
              disabled={!!session}
              className="h-8 rounded-md border border-input bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
            >
              <option value="">Free conversation</option>
              {scenarios.map((s) => (
                <option key={s.name} value={s.name}>
                  {s.label}
                </option>
              ))}
            </select>

            {/* Channel mode toggle */}
            <div className="flex rounded-md border border-input">
              <button
                onClick={() => setChannelMode("chat")}
                className={`flex items-center gap-1 px-2 py-1 text-xs ${
                  channelMode === "chat"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent"
                } rounded-l-md`}
              >
                <MessageSquare className="h-3 w-3" />
                Chat
              </button>
              <button
                onClick={() => setChannelMode("sms")}
                className={`flex items-center gap-1 px-2 py-1 text-xs ${
                  channelMode === "sms"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent"
                } rounded-r-md`}
              >
                <Smartphone className="h-3 w-3" />
                SMS
              </button>
            </div>

            {session ? (
              <>
                {session.scenario_name && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={autoRespond}
                    disabled={sending}
                  >
                    {sending ? (
                      <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                    ) : (
                      <Bot className="mr-1 h-4 w-4" />
                    )}
                    Auto-respond
                  </Button>
                )}
                <Button size="sm" variant="outline" onClick={handleRerun}>
                  <RotateCcw className="mr-1 h-4 w-4" />
                  Rerun
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                onClick={handleNewSession}
                disabled={loading || needsSetup}
              >
                {loading ? (
                  <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="mr-1 h-4 w-4" />
                )}
                New Session
              </Button>
            )}
          </div>
        }
      />

      {error && (
        <div className="mb-4 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {needsSetup && !session ? (
        <EmptyState
          icon={Settings}
          heading="Setup required"
          description="Configure a practice profile and agent config before running simulations."
        />
      ) : !session ? (
        <div className="space-y-6">
          <EmptyState
            icon={MessageSquare}
            heading="Ready to simulate"
            description="Pick a scenario below to launch a conversation, or use the controls above for a free conversation."
          />

          {/* Quick-launch scenario cards */}
          {scenarios.length > 0 && (
            <div>
              <h3 className="mb-3 text-sm font-semibold text-muted-foreground">
                Quick Launch Scenarios
              </h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {scenarios.map((s) => (
                  <button
                    key={s.name}
                    onClick={() => {
                      setSelectedScenario(s.name);
                      if (practice && config) {
                        createSession(practice.id, config.id, s.name);
                      }
                    }}
                    disabled={loading}
                    className="group rounded-lg border border-border bg-card p-4 text-left transition-colors hover:border-teal-300 hover:bg-teal-50/50"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-sm font-medium text-foreground group-hover:text-teal-700">
                        {s.label}
                      </span>
                      <Badge
                        variant="outline"
                        className="shrink-0 text-[10px] capitalize"
                      >
                        {s.category}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground line-clamp-2">
                      {s.description}
                    </p>
                    <p className="mt-2 text-[10px] text-muted-foreground/60">
                      Expected:{" "}
                      <span className="capitalize">{s.expected_outcome}</span>
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
          {/* Left pane — Chat */}
          <div
            className="flex flex-col overflow-hidden rounded-lg border border-border bg-card lg:col-span-3"
            style={{ height: "calc(100vh - 220px)" }}
          >
            <ChatTranscript
              messages={transcript}
              escalation={escalation}
              sending={sending}
              variant={channelMode}
            />
            <MessageInput
              onSend={handleSend}
              disabled={!session}
              sending={sending}
            />
          </div>

          {/* Right pane — Trace */}
          <div className="lg:col-span-2 lg:max-h-[calc(100vh-220px)] lg:overflow-y-auto">
            <TracePanel
              sessionId={session.id}
              scenarioName={session.scenario_name}
              toolCalls={toolCalls}
              escalation={escalation}
              turnCount={turnCount}
            />
          </div>
        </div>
      )}
    </div>
  );
}
