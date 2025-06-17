'use client';

import { create } from 'zustand';

export interface Question {
  id: string;
  text: string;
  type: 'single' | 'multiple';
  options: string[];
  correctAnswers: number[];
}

export interface Module {
  id: string;
  title: string;
  description: string;
  isActive: boolean;
  createdAt: string;
  questions: Question[];
  results: TestResult[];
}

export interface TestResult {
  id: string;
  studentName: string;
  score: number;
  totalQuestions: number;
  answers: { questionId: string; selectedAnswers: number[] }[];
  completedAt: string;
}

// Export initial modules data for static generation
export const initialModulesData: Module[] = [
  {
    id: '1',
    title: 'Математика 10 класс',
    description: 'Тест по алгебре и геометрии',
    isActive: true,
    createdAt: '2024-01-15',
    questions: [
      {
        id: '1',
        text: 'Чему равен квадратный корень из 16?',
        type: 'single',
        options: ['2', '4', '8', '16'],
        correctAnswers: [1]
      },
      {
        id: '2',
        text: 'Какие из следующих чисел являются простыми?',
        type: 'multiple',
        options: ['2', '3', '4', '5', '6'],
        correctAnswers: [0, 1, 3]
      }
    ],
    results: [
      {
        id: '1',
        studentName: 'Иван Петров',
        score: 85,
        totalQuestions: 2,
        answers: [
          { questionId: '1', selectedAnswers: [1] },
          { questionId: '2', selectedAnswers: [0, 1] }
        ],
        completedAt: '2024-01-20T10:30:00Z'
      }
    ]
  }
];

interface ModulesState {
  modules: Module[];
  addModule: (module: Omit<Module, 'id' | 'createdAt' | 'questions' | 'results'>) => void;
  updateModule: (id: string, updates: Partial<Module>) => void;
  addQuestion: (moduleId: string, question: Omit<Question, 'id'>) => void;
  updateQuestion: (moduleId: string, questionId: string, updates: Partial<Question>) => void;
  addTestResult: (moduleId: string, result: Omit<TestResult, 'id'>) => void;
}

export const useModulesStore = create<ModulesState>((set) => ({
  modules: initialModulesData,
  addModule: (module) => set((state) => ({
    modules: [...state.modules, {
      ...module,
      id: Date.now().toString(),
      createdAt: new Date().toISOString().split('T')[0],
      questions: [],
      results: []
    }]
  })),
  updateModule: (id, updates) => set((state) => ({
    modules: state.modules.map(module => 
      module.id === id ? { ...module, ...updates } : module
    )
  })),
  addQuestion: (moduleId, question) => set((state) => ({
    modules: state.modules.map(module => 
      module.id === moduleId 
        ? { 
            ...module, 
            questions: [...module.questions, { ...question, id: Date.now().toString() }]
          }
        : module
    )
  })),
  updateQuestion: (moduleId, questionId, updates) => set((state) => ({
    modules: state.modules.map(module => 
      module.id === moduleId 
        ? {
            ...module,
            questions: module.questions.map(question =>
              question.id === questionId ? { ...question, ...updates } : question
            )
          }
        : module
    )
  })),
  addTestResult: (moduleId, result) => set((state) => ({
    modules: state.modules.map(module => 
      module.id === moduleId 
        ? { 
            ...module, 
            results: [...module.results, { ...result, id: Date.now().toString() }]
          }
        : module
    )
  }))
}));