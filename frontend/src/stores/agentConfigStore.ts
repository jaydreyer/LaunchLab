import { create } from "zustand";
import {
  type AgentConfig,
  type AgentConfigUpdate,
  listAgentConfigs,
  updateAgentConfig,
  resetAgentConfig,
  previewAgentConfig,
} from "@/api/agentConfigs";

interface AgentConfigState {
  config: AgentConfig | null;
  preview: string;
  loading: boolean;
  saving: boolean;
  previewLoading: boolean;
  error: string | null;

  fetchCurrent: () => Promise<void>;
  save: (id: string, data: AgentConfigUpdate) => Promise<void>;
  reset: (practiceId: string) => Promise<void>;
  setConfig: (config: AgentConfig) => void;
  fetchPreview: () => Promise<void>;
  clearError: () => void;
}

export const useAgentConfigStore = create<AgentConfigState>((set, get) => ({
  config: null,
  preview: "",
  loading: false,
  saving: false,
  previewLoading: false,
  error: null,

  fetchCurrent: async () => {
    set({ loading: true, error: null });
    try {
      const configs = await listAgentConfigs();
      const config = configs[0] ?? null;
      set({ config, loading: false });
      if (config) {
        get().fetchPreview();
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load agent config";
      set({ error: message, loading: false });
    }
  },

  save: async (id: string, data: AgentConfigUpdate) => {
    set({ saving: true, error: null });
    try {
      const config = await updateAgentConfig(id, data);
      set({ config, saving: false });
      get().fetchPreview();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to save agent config";
      set({ error: message, saving: false });
      throw err;
    }
  },

  reset: async (practiceId: string) => {
    set({ loading: true, error: null });
    try {
      const config = await resetAgentConfig(practiceId);
      set({ config, loading: false });
      get().fetchPreview();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to reset agent config";
      set({ error: message, loading: false });
      throw err;
    }
  },

  setConfig: (config: AgentConfig) => set({ config }),

  fetchPreview: async () => {
    const { config } = get();
    if (!config) return;
    set({ previewLoading: true });
    try {
      const assembled = await previewAgentConfig({
        practice_id: config.practice_id,
        system_prompt: config.system_prompt,
        workflow_config: config.workflow_config,
        guardrails: config.guardrails,
        escalation_triggers: config.escalation_triggers,
        tool_policy: config.tool_policy,
        tone_guidelines: config.tone_guidelines,
      });
      set({ preview: assembled, previewLoading: false });
    } catch {
      set({ previewLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
