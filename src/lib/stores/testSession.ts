import { create } from "zustand";
import { fetchWithAuth } from "@/lib/api/client";

interface TestSessionState {
  sessionId: string | null;
  currentQuestion: any | null;
  answers: Record<number, number[]>;
  startTest: (slug: string) => Promise<void>;
  nextQuestion: (slug: string) => Promise<void>;
  submitAnswer: (
    slug: string,
    questionId: number,
    selectedIds: number[]
  ) => Promise<boolean>;
}

export const useTestSession = create<TestSessionState>((set) => ({
  sessionId: null,
  currentQuestion: null,
  answers: {},
  startTest: async (slug: string) => {
    const { session_id } = await fetchWithAuth(`/t/${slug}/start/`, {
      method: "GET",
    });
    set({ sessionId: session_id });
  },
  nextQuestion: async (slug: string) => {
    const question = await fetchWithAuth(`/t/${slug}/next/`, {
      method: "GET",
      headers: { "X-Session": useTestSession.getState().sessionId || "" },
    });
    set({ currentQuestion: question });
  },
  submitAnswer: async (
    slug: string,
    questionId: number,
    selectedIds: number[]
  ) => {
    const { is_correct } = await fetchWithAuth(`/t/${slug}/answer/`, {
      method: "POST",
      body: JSON.stringify({
        session: useTestSession.getState().sessionId,
        question_id: questionId,
        selected_ids: selectedIds,
      }),
    });
    set((state) => ({
      answers: { ...state.answers, [questionId]: selectedIds },
    }));
    return is_correct;
  },
}));
