// const API_BASE_URL = 'http://10.10.10.204:8000';
const API_BASE_URL = "http://localhost:8000";

// Types for API responses
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface User {
  id: string;
  full_name: string;
  phone: string;
  email?: string;
}

export interface Question {
  id: string;
  text: string;
  is_multiple_choice: boolean;
  options: Option[];
}

export interface Option {
  id: string;
  text: string;
  is_correct: boolean;
}

export interface QuestionCreate {
  text: string;
  is_multiple_choice: boolean;
  options: Omit<Option, "id">[];
}

export interface Module {
  id: string;
  title: string;
  description: string;
  isActive: boolean;
  created_at: string;
  questions: Question[];
  results: TestResult[];
  slug?: string;
}

export interface TestResult {
  id: string;
  studentName: string;
  score: number;
  totalQuestions: number;
  answers: { questionId: string; selectedAnswers: number[] }[];
  completedAt: string;
}

export interface TestAttempt {
  id: string;
  moduleId: string;
  studentName: string;
  startedAt: string;
  currentQuestion?: Question;
}

// API Client class
class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseURL}${endpoint}`;
      const config: RequestInit = {
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
        ...options,
      };

      // Add auth token if available
      const token = localStorage.getItem("access_token");
      if (token) {
        config.headers = {
          ...config.headers,
          Authorization: `Bearer ${token}`,
        };
      }

      const response = await fetch(url, config);

      // Handle empty responses
      let data;
      try {
        data = await response.json();
      } catch {
        data = {};
      }

      if (!response.ok) {
        return {
          success: false,
          error:
            data.message ||
            data.detail ||
            `HTTP error! status: ${response.status}`,
        };
      }

      return {
        success: true,
        data: data,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  // Auth endpoints
  async login(
    phone: string,
    password: string
  ): Promise<ApiResponse<{ user: User; access: string; refresh: string }>> {
    return this.request("/auth/login/", {
      method: "POST",
      body: JSON.stringify({ phone, password }),
    });
  }

  async register(
    full_name: string,
    phone: string,
    password: string
  ): Promise<ApiResponse<{ user: User; access: string; refresh: string }>> {
    return this.request("/auth/register/", {
      method: "POST",
      body: JSON.stringify({ full_name, phone, password }),
    });
  }

  async getMe(): Promise<ApiResponse<User>> {
    return this.request("/auth/me/");
  }

  async refresh(): Promise<ApiResponse<{ access: string; refresh: string }>> {
    return this.request("/auth/refresh/", {
      method: "POST",
      body: JSON.stringify({ refresh: localStorage.getItem("refresh_token") }),
    });
  }

  async updateMe(updates: Partial<User>): Promise<ApiResponse<User>> {
    return this.request("/auth/me/", {
      method: "PUT",
      body: JSON.stringify(updates),
    });
  }

  // Module endpoints
  async getModules(): Promise<ApiResponse<Module[]>> {
    return this.request("/api/modules/");
  }

  async getModule(id: string): Promise<ApiResponse<Module>> {
    return this.request(`/api/modules/${id}/`);
  }

  async createModule(
    module: Omit<Module, "id" | "createdAt" | "questions" | "results">
  ): Promise<ApiResponse<Module>> {
    return this.request("/api/modules/", {
      method: "POST",
      body: JSON.stringify(module),
    });
  }

  async updateModule(
    id: string,
    updates: Partial<Module>
  ): Promise<ApiResponse<Module>> {
    return this.request(`/api/modules/${id}/`, {
      method: "PUT",
      body: JSON.stringify(updates),
    });
  }

  async partialUpdateModule(
    id: string,
    updates: Partial<Module>
  ): Promise<ApiResponse<Module>> {
    return this.request(`/api/modules/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    });
  }

  async deleteModule(id: string): Promise<ApiResponse<null>> {
    return this.request(`/api/modules/${id}/`, {
      method: "DELETE",
    });
  }

  async activateModule(id: string): Promise<ApiResponse<Module>> {
    return this.request(`/api/modules/${id}/activate/`, {
      method: "POST",
    });
  }

  async deactivateModule(id: string): Promise<ApiResponse<Module>> {
    return this.request(`/api/modules/${id}/deactivate/`, {
      method: "POST",
    });
  }

  // Question endpoints
  async getQuestions(moduleId: string): Promise<ApiResponse<Question[]>> {
    return this.request(`/api/modules/${moduleId}/questions/`);
  }

  async addQuestion(
    moduleId: string,
    question: Omit<QuestionCreate, "id">
  ): Promise<ApiResponse<Question>> {
    return this.request(`/api/modules/${moduleId}/add-question/`, {
      method: "POST",
      body: JSON.stringify(question),
    });
  }

  async updateQuestion(
    questionId: string,
    updates: Partial<Question>
  ): Promise<ApiResponse<Question>> {
    return this.request(`/api/modules/questions/${questionId}/`, {
      method: "PUT",
      body: JSON.stringify(updates),
    });
  }

  async partialUpdateQuestion(
    questionId: string,
    updates: Partial<Question>
  ): Promise<ApiResponse<Question>> {
    return this.request(`/api/modules/questions/${questionId}/`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    });
  }

  async deleteQuestion(questionId: string): Promise<ApiResponse<null>> {
    return this.request(`/api/modules/questions/${questionId}/delete/`, {
      method: "DELETE",
    });
  }

  // Test result endpoints
  async getTestResults(moduleId: string): Promise<ApiResponse<TestResult[]>> {
    return this.request(`/api/modules/${moduleId}/results/`);
  }

  async addAttempt() {}

  async getTestResult(
    moduleId: string,
    resultId: string
  ): Promise<ApiResponse<TestResult>> {
    return this.request(`/api/modules/${moduleId}/results/${resultId}/`);
  }

  // Test taking endpoints (slug-based)
  async startTest(slug: string): Promise<ApiResponse<TestAttempt>> {
    return this.request(`/api/t/${slug}/start/`);
  }

  async getNextQuestion(slug: string): Promise<ApiResponse<Question>> {
    return this.request(`/api/t/${slug}/next/`);
  }

  async submitAnswer(
    slug: string,
    answer: { questionId: string; selectedAnswers: number[] }
  ): Promise<ApiResponse<any>> {
    return this.request(`/api/t/${slug}/answer/`, {
      method: "POST",
      body: JSON.stringify(answer),
    });
  }

  async getTestResultUser(slug: string): Promise<ApiResponse<TestResult>> {
    return this.request(`/api/t/${slug}/result/`);
  }

  // Alternative test taking endpoints (module_id based)
  async startTestById(moduleId: string): Promise<ApiResponse<TestAttempt>> {
    return this.request(`/api/test/${moduleId}/start/`, {
      method: "POST",
    });
  }

  async getNextQuestionById(
    moduleId: string,
    attemptId: string
  ): Promise<ApiResponse<Question>> {
    return this.request(`/api/test/${moduleId}/attempt/${attemptId}/next/`);
  }

  async submitAnswerById(
    moduleId: string,
    attemptId: string,
    answer: { questionId: string; selectedAnswers: number[] }
  ): Promise<ApiResponse<any>> {
    return this.request(`/api/test/${moduleId}/attempt/${attemptId}/answer/`, {
      method: "POST",
      body: JSON.stringify(answer),
    });
  }

  async finishTest(
    moduleId: string,
    attemptId: string
  ): Promise<ApiResponse<TestResult>> {
    return this.request(`/api/test/${moduleId}/attempt/${attemptId}/finish/`, {
      method: "POST",
    });
  }
}

// Export singleton instance
export const apiClient = new ApiClient(API_BASE_URL);

// Utility functions for error handling
export const handleApiError = (error: string) => {
  console.error("API Error:", error);
  // You can add toast notifications here
  return error;
};

export const isApiError = (
  response: ApiResponse<any>
): response is ApiResponse<never> & { success: false } => {
  return !response.success;
};
