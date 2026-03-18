import { create } from "zustand";
import {
  type Practice,
  type PracticeUpdate,
  listPractices,
  updatePractice,
  resetPractice,
  loadSamplePractice,
} from "@/api/practices";

interface PracticeState {
  practice: Practice | null;
  loading: boolean;
  saving: boolean;
  error: string | null;

  fetchCurrent: () => Promise<void>;
  save: (id: string, data: PracticeUpdate) => Promise<void>;
  reset: () => Promise<void>;
  loadSample: () => Promise<void>;
  setPractice: (practice: Practice) => void;
  clearError: () => void;
}

export const usePracticeStore = create<PracticeState>((set) => ({
  practice: null,
  loading: false,
  saving: false,
  error: null,

  fetchCurrent: async () => {
    set({ loading: true, error: null });
    try {
      const practices = await listPractices();
      set({ practice: practices[0] ?? null, loading: false });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load practice";
      set({ error: message, loading: false });
    }
  },

  save: async (id: string, data: PracticeUpdate) => {
    set({ saving: true, error: null });
    try {
      const practice = await updatePractice(id, data);
      set({ practice, saving: false });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to save practice";
      set({ error: message, saving: false });
      throw err;
    }
  },

  reset: async () => {
    set({ loading: true, error: null });
    try {
      const practice = await resetPractice();
      set({ practice, loading: false });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to reset practice";
      set({ error: message, loading: false });
      throw err;
    }
  },

  loadSample: async () => {
    set({ loading: true, error: null });
    try {
      const practice = await loadSamplePractice();
      set({ practice, loading: false });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load sample data";
      set({ error: message, loading: false });
      throw err;
    }
  },

  setPractice: (practice: Practice) => set({ practice }),
  clearError: () => set({ error: null }),
}));
