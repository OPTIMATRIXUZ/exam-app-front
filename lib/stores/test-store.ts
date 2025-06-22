import { create } from 'zustand';
import { TestAnswer, Question, QuestionOption } from '@/types';

interface TestState {
  attemptId: number | null;
  questions: Question[];
  currentQuestionIndex: number;
  answers: TestAnswer[];
  studentName: string;
  isStarted: boolean;
  isCompleted: boolean;
  
  setTestData: (attemptId: number, questions: Question[], studentName: string) => void;
  setCurrentQuestion: (index: number) => void;
  saveAnswer: (questionId: number, selectedOptions: number[], isCorrect: boolean) => void;
  nextQuestion: () => void;
  previousQuestion: () => void;
  completeTest: () => void;
  resetTest: () => void;
  
  // Utility functions
  getCurrentQuestion: () => Question | null;
  getAnswer: (questionId: number) => TestAnswer | null;
  getProgress: () => number;
}

// Shuffle array utility
const shuffleArray = <T>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

export const useTestStore = create<TestState>((set, get) => ({
  attemptId: null,
  questions: [],
  currentQuestionIndex: 0,
  answers: [],
  studentName: '',
  isStarted: false,
  isCompleted: false,

  setTestData: (attemptId, questions, studentName) => {
    // Shuffle questions and their options
    const shuffledQuestions = shuffleArray(questions).map(question => ({
      ...question,
      options: shuffleArray(question.options),
    }));

    set({
      attemptId,
      questions: shuffledQuestions,
      studentName,
      currentQuestionIndex: 0,
      answers: [],
      isStarted: true,
      isCompleted: false,
    });
  },

  setCurrentQuestion: (index) => {
    const { questions } = get();
    if (index >= 0 && index < questions.length) {
      set({ currentQuestionIndex: index });
    }
  },

  saveAnswer: (questionId, selectedOptions, isCorrect) => {
    const { answers, questions } = get();
    const question = questions.find(q => q.id === questionId);
    
    if (!question) return;

    // Check if answer is correct
    const correctOptionIds = question.options
      .filter(option => option.is_correct)
      .map(option => option.id);

    const newAnswer: TestAnswer = {
      question_id: questionId,
      selected_option_ids: selectedOptions,
      is_correct: isCorrect,
    };

    // Update or add answer
    const updatedAnswers = answers.filter(a => a.question_id !== questionId);
    updatedAnswers.push(newAnswer);

    set({ answers: updatedAnswers });

    // Save to localStorage as backup
    if (typeof window !== 'undefined') {
      localStorage.setItem('test_answers', JSON.stringify(updatedAnswers));
    }
  },

  nextQuestion: () => {
    const { currentQuestionIndex, questions } = get();
    if (currentQuestionIndex < questions.length - 1) {
      set({ currentQuestionIndex: currentQuestionIndex + 1 });
    }
  },

  previousQuestion: () => {
    const { currentQuestionIndex } = get();
    if (currentQuestionIndex > 0) {
      set({ currentQuestionIndex: currentQuestionIndex - 1 });
    }
  },

  completeTest: () => {
    set({ isCompleted: true });
    
    // Clear localStorage backup
    if (typeof window !== 'undefined') {
      localStorage.removeItem('test_answers');
    }
  },

  resetTest: () => {
    set({
      attemptId: null,
      questions: [],
      currentQuestionIndex: 0,
      answers: [],
      studentName: '',
      isStarted: false,
      isCompleted: false,
    });

    // Clear localStorage backup
    if (typeof window !== 'undefined') {
      localStorage.removeItem('test_answers');
    }
  },

  getCurrentQuestion: () => {
    const { questions, currentQuestionIndex } = get();
    return questions[currentQuestionIndex] || null;
  },

  getAnswer: (questionId) => {
    const { answers } = get();
    return answers.find(a => a.question_id === questionId) || null;
  },

  getProgress: () => {
    const { currentQuestionIndex, questions } = get();
    return questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0;
  },
}));