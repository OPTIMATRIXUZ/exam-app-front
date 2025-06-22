export interface UserFull {
  access: string;
  refresh: string;
  user: User;
}

export interface User {
  id: number;
  full_name: string;
  phone: string;
  email?: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface Module {
  id: number;
  title: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  slug: string;
  questions_count: number;
  isActive?: boolean; // Optional for UI state management
}

export interface QuestionOption {
  id: number;
  text: string;
  is_correct: boolean;
}

export interface Question {
  id: number;
  text: string;
  is_multiple_choice: boolean;
  options: QuestionOption[];
  module: number;
}

export interface TestAttempt {
  id: number;
  student: string;
  score: number;
  started_at: string;
  finished_at: string;
  answers: TestAnswer[];
}

export interface TestAnswer {
  question_id: number;
  selected_option_ids: number[];
  is_correct: boolean;
}

export interface TestPreview {
  id: number;
  title: string;
  description?: string;
  is_active: boolean;
  questions_count: number;
  questions: Question[];
}

export interface TestStart {
  attempt_id: number;
  questions: Question[];
}

export interface TestResult {
  attempt_id: number;
  student_name: string;
  score: number;
  total_questions: number;
  percentage: number;
  answers: {
    question: Question;
    selected_options: QuestionOption[];
    correct_options: QuestionOption[];
    is_correct: boolean;
  }[];
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  results: T[];
  count: number;
  next: string | null;
  previous: string | null;
}