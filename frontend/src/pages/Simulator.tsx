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
import {
  Loader2,
  Plus,
  RotateCcw,
  MessageSquare,
  Smartphone,
} from "lucide-react";

const SCENARIOS = [
  { value: "", label: "Free conversation" },
  { value: "reschedule_appointment", label: "Reschedule Appointment" },
  { value: "book_annual_physical", label: "Book Annual Physical" },
  { value: "ask_clinic_hours", label: "Ask Clinic Hours" },
  { value: "check_insurance", label: "Check Insurance" },
  { value: "billing_question", label: "Billing Question" },
  { value: "urgent_symptom", label: "Urgent Symptom" },
];

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
    setChannelMode,
    clearSession,
  } = useSimulationStore();

  const practice = usePracticeStore((s) => s.practice);
  const fetchPractice = usePracticeStore((s) => s.fetchCurrent);
  const config = useAgentConfigStore((s) => s.config);
  const fetchConfig = useAgentConfigStore((s) => s.fetchCurrent);

  const [selectedScenario, setSelectedScenario] = useState("");

  useEffect(() => {
    if (!practice) fetchPractice();
    if (!config) fetchConfig();
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
              {SCENARIOS.map((s) => (
                <option key={s.value} value={s.value}>
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
              <Button size="sm" variant="outline" onClick={handleRerun}>
                <RotateCcw className="mr-1 h-4 w-4" />
                Rerun
              </Button>
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
        <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">
          <p>
            Set up a practice profile and agent config before running
            simulations.
          </p>
        </div>
      ) : !session ? (
        <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">
          <p>
            Click <strong>New Session</strong> to start a conversation.
          </p>
          {selectedScenario && (
            <Badge variant="secondary" className="mt-2">
              Scenario:{" "}
              {SCENARIOS.find((s) => s.value === selectedScenario)?.label}
            </Badge>
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
