import { create } from "zustand";
import {
  type ChatMessage,
  type EscalationOut,
  type ToolCallOut,
  type SimulationSession,
  createSimulation,
  getSimulation,
  sendMessage,
  autoRespond as autoRespondApi,
} from "@/api/simulations";

export interface TrackedToolCall extends ToolCallOut {
  turn: number;
  duration_ms?: number | null;
}

interface SimulationState {
  session: SimulationSession | null;
  transcript: ChatMessage[];
  toolCalls: TrackedToolCall[];
  escalation: EscalationOut | null;
  channelMode: "chat" | "sms";
  loading: boolean;
  sending: boolean;
  error: string | null;

  createSession: (
    practiceId: string,
    configId: string,
    scenarioName?: string | null,
  ) => Promise<void>;
  fetchSession: (id: string) => Promise<void>;
  send: (content: string) => Promise<void>;
  autoRespond: () => Promise<void>;
  setChannelMode: (mode: "chat" | "sms") => void;
  clearSession: () => void;
  clearError: () => void;
}

export const useSimulationStore = create<SimulationState>((set, get) => ({
  session: null,
  transcript: [],
  toolCalls: [],
  escalation: null,
  channelMode: "chat",
  loading: false,
  sending: false,
  error: null,

  createSession: async (practiceId, configId, scenarioName) => {
    set({ loading: true, error: null });
    try {
      const session = await createSimulation({
        practice_id: practiceId,
        config_id: configId,
        scenario_name: scenarioName,
        channel_mode: get().channelMode,
      });
      set({
        session,
        transcript: session.messages ?? [],
        toolCalls: [],
        escalation: null,
        loading: false,
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to create session";
      set({ error: message, loading: false });
    }
  },

  fetchSession: async (id) => {
    set({ loading: true, error: null });
    try {
      const session = await getSimulation(id);
      set({
        session,
        transcript: session.messages ?? [],
        loading: false,
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load session";
      set({ error: message, loading: false });
    }
  },

  send: async (content) => {
    const { session, transcript, toolCalls } = get();
    if (!session) return;

    const userMsg: ChatMessage = { role: "user", content };
    set({ sending: true, error: null, transcript: [...transcript, userMsg] });

    try {
      const response = await sendMessage(session.id, { content });

      const turn = Math.floor((transcript.length + 1) / 2) + 1;
      const newToolCalls: TrackedToolCall[] = response.tool_calls.map((tc) => ({
        ...tc,
        turn,
      }));

      const agentMsg: ChatMessage = {
        role: "assistant",
        content: response.agent_message,
      };

      set({
        transcript: [...get().transcript, agentMsg],
        toolCalls: [...toolCalls, ...newToolCalls],
        escalation: response.escalation ?? get().escalation,
        sending: false,
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to send message";
      set({ error: message, sending: false });
    }
  },

  autoRespond: async () => {
    const { session, transcript, toolCalls } = get();
    if (!session) return;

    set({ sending: true, error: null });

    try {
      const response = await autoRespondApi(session.id);

      const turn = Math.floor((transcript.length + 1) / 2) + 1;
      const newToolCalls: TrackedToolCall[] = response.tool_calls.map((tc) => ({
        ...tc,
        turn,
      }));

      const patientMsg: ChatMessage = {
        role: "user",
        content: response.patient_message,
      };
      const agentMsg: ChatMessage = {
        role: "assistant",
        content: response.agent_message,
      };

      set({
        transcript: [...get().transcript, patientMsg, agentMsg],
        toolCalls: [...toolCalls, ...newToolCalls],
        escalation: response.escalation ?? get().escalation,
        sending: false,
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Auto-respond failed";
      set({ error: message, sending: false });
    }
  },

  setChannelMode: (mode) => set({ channelMode: mode }),

  clearSession: () =>
    set({
      session: null,
      transcript: [],
      toolCalls: [],
      escalation: null,
      error: null,
    }),

  clearError: () => set({ error: null }),
}));
