"use client";

import { create } from "zustand";
import {
  apiClient,
  Module,
  Question,
  TestResult,
  handleApiError,
  isApiError,
  QuestionCreate,
} from "./api";

interface ModulesState {
  modules: Module[];
  moduleCache: Record<string, Module>;
  isLoading: boolean;
  error: string | null;

  // Module actions
  fetchModules: () => Promise<void>;
  fetchModule: (id: string) => Promise<Module | null>;
  addModule: (
    module: Omit<Module, "id" | "createdAt" | "questions" | "results">
  ) => Promise<boolean>;
  updateModule: (id: string, updates: Partial<Module>) => Promise<boolean>;
  deleteModule: (id: string) => Promise<boolean>;
  activateModule: (id: string) => Promise<boolean>;
  deactivateModule: (id: string) => Promise<boolean>;

  // Question actions
  addQuestion: (
    moduleId: string,
    question: Omit<QuestionCreate, "id">
  ) => Promise<boolean>;
  updateQuestion: (
    questionId: string,
    updates: Partial<Question>
  ) => Promise<boolean>;
  deleteQuestion: (questionId: string) => Promise<boolean>;

  // Test result actions
  fetchTestResults: (moduleId: string) => Promise<TestResult[]>;
  fetchTestResult: (
    moduleId: string,
    resultId: string
  ) => Promise<TestResult | null>;
}

export const useModulesStore = create<ModulesState>((set, get) => ({
  modules: [],
  moduleCache: {},
  isLoading: false,
  error: null,

  fetchModules: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.getModules();
      if (isApiError(response)) {
        const error = response.error || "Failed to fetch modules";
        set({ error, isLoading: false });
        handleApiError(error);
        return;
      }
      const list = response.data || [];
      // заполнить и основной массив, и кеш
      const cache: Record<string, Module> = {};
      list.forEach((m) => (cache[m.id] = m));
      set({
        modules: list,
        moduleCache: cache,
        isLoading: false,
        error: null,
      });
    } catch (err) {
      const errorMessage = "Network error while fetching modules";
      set({ error: errorMessage, isLoading: false });
      handleApiError(errorMessage);
    }
  },

  fetchModule: async (id: string) => {
    const cached = get().moduleCache[id];
    // only reuse if we've already fetched details (i.e. questions are loaded)
    if (cached && Array.isArray(cached.questions)) {
      return cached;
    }

    // 2) Иначе — делаем запрос
    try {
      const response = await apiClient.getModule(id);
      if (isApiError(response)) {
        handleApiError(response.error || "Failed to fetch module");
        return null;
      }
      const moduleData = response.data!;
      // 3) Сохраняем в кеш и в modules[]
      set((state) => ({
        moduleCache: { ...state.moduleCache, [id]: moduleData },
        modules: state.modules.map((m) => (m.id === id ? moduleData : m)),
      }));
      return moduleData;
    } catch (err) {
      handleApiError("Network error while fetching module");
      return null;
    }
  },

  addModule: async (moduleData) => {
    set({ isLoading: true, error: null });

    try {
      const response = await apiClient.createModule(moduleData);

      if (isApiError(response)) {
        const error = response.error || "Failed to create module";
        set({ error, isLoading: false });
        handleApiError(error);
        return false;
      }

      const newModule = response.data!;
      set((state) => ({
        modules: [...state.modules, newModule],
        isLoading: false,
        error: null,
      }));

      return true;
    } catch (error) {
      const errorMessage = "Network error while creating module";
      set({ error: errorMessage, isLoading: false });
      handleApiError(errorMessage);
      return false;
    }
  },

  updateModule: async (id: string, updates: Partial<Module>) => {
    try {
      const response = await apiClient.updateModule(id, updates);

      if (isApiError(response)) {
        handleApiError(response.error || "Failed to update module");
        return false;
      }

      const updatedModule = response.data!;
      set((state) => ({
        modules: state.modules.map((module) =>
          module.id === id ? updatedModule : module
        ),
      }));

      return true;
    } catch (error) {
      handleApiError("Network error while updating module");
      return false;
    }
  },

  deleteModule: async (id: string) => {
    try {
      const response = await apiClient.deleteModule(id);

      if (isApiError(response)) {
        handleApiError(response.error || "Failed to delete module");
        return false;
      }

      set((state) => ({
        modules: state.modules.filter((module) => module.id !== id),
      }));

      return true;
    } catch (error) {
      handleApiError("Network error while deleting module");
      return false;
    }
  },

  activateModule: async (id: string) => {
    try {
      const response = await apiClient.activateModule(id);

      if (isApiError(response)) {
        handleApiError(response.error || "Failed to activate module");
        return false;
      }

      const updatedModule = response.data!;
      set((state) => ({
        modules: state.modules.map((module) =>
          module.id === id ? updatedModule : module
        ),
      }));

      return true;
    } catch (error) {
      handleApiError("Network error while activating module");
      return false;
    }
  },

  deactivateModule: async (id: string) => {
    try {
      const response = await apiClient.deactivateModule(id);

      if (isApiError(response)) {
        handleApiError(response.error || "Failed to deactivate module");
        return false;
      }

      const updatedModule = response.data!;
      set((state) => ({
        modules: state.modules.map((module) =>
          module.id === id ? updatedModule : module
        ),
      }));

      return true;
    } catch (error) {
      handleApiError("Network error while deactivating module");
      return false;
    }
  },

  addQuestion: async (moduleId, payload) => {
    try {
      const response = await apiClient.addQuestion(moduleId, payload);
      if (isApiError(response)) {
        handleApiError(response.error || "Failed to add question");
        return false;
      }
      const newQuestion = response.data!; // здесь сервер вернёт Question с id и options уже с id
      set((state) => ({
        modules: state.modules.map((m) =>
          m.id === moduleId
            ? { ...m, questions: [...m.questions, newQuestion] }
            : m
        ),
      }));
      return true;
    } catch {
      handleApiError("Network error while adding question");
      return false;
    }
  },

  updateQuestion: async (questionId: string, updates: Partial<Question>) => {
    try {
      const response = await apiClient.updateQuestion(questionId, updates);

      if (isApiError(response)) {
        handleApiError(response.error || "Failed to update question");
        return false;
      }

      const updatedQuestion = response.data!;
      set((state) => ({
        modules: state.modules.map((module) => ({
          ...module,
          questions: module.questions.map((question) =>
            question.id === questionId ? updatedQuestion : question
          ),
        })),
      }));

      return true;
    } catch (error) {
      handleApiError("Network error while updating question");
      return false;
    }
  },

  deleteQuestion: async (questionId: string) => {
    try {
      const response = await apiClient.deleteQuestion(questionId);

      if (isApiError(response)) {
        handleApiError(response.error || "Failed to delete question");
        return false;
      }

      set((state) => ({
        modules: state.modules.map((module) => ({
          ...module,
          questions: module.questions.filter(
            (question) => question.id !== questionId
          ),
        })),
      }));

      return true;
    } catch (error) {
      handleApiError("Network error while deleting question");
      return false;
    }
  },

  fetchTestResults: async (moduleId: string) => {
    try {
      const response = await apiClient.getTestResults(moduleId);

      if (isApiError(response)) {
        handleApiError(response.error || "Failed to fetch test results");
        return [];
      }

      return response.data || [];
    } catch (error) {
      handleApiError("Network error while fetching test results");
      return [];
    }
  },

  fetchTestResult: async (moduleId: string, resultId: string) => {
    try {
      const response = await apiClient.getTestResult(moduleId, resultId);

      if (isApiError(response)) {
        handleApiError(response.error || "Failed to fetch test result");
        return null;
      }

      return response.data || null;
    } catch (error) {
      handleApiError("Network error while fetching test result");
      return null;
    }
  },
}));

// Export initial modules data for fallback
export const initialModulesData: Module[] = [];
