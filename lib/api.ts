import { AuthTokens, Module, Question, TestAttempt, TestPreview, TestStart, TestResult, TestAnswer, UserFull } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const token = this.getToken();

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        if (response.status === 401) {
          // Token expired, try to refresh
          const refreshed = await this.refreshToken();
          if (refreshed) {
            // Retry the original request
            const newToken = this.getToken();
            config.headers = {
              ...config.headers,
              Authorization: `Bearer ${newToken}`,
            };
            const retryResponse = await fetch(url, config);
            if (!retryResponse.ok) {
              throw new Error(`HTTP error! status: ${retryResponse.status}`);
            }
            return retryResponse.json();
          } else {
            // Refresh failed, redirect to login
            this.clearTokens();
            window.location.href = '/auth/login';
            throw new Error('Authentication failed');
          }
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('access');
  }

  private getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('refresh');
  }

  private setTokens(tokens: AuthTokens): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem('access', tokens.access);
    localStorage.setItem('refresh', tokens.refresh);
  }

  private clearTokens(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('access');
    localStorage.removeItem('refresh');
  }

  private async refreshToken(): Promise<boolean> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) return false;

    try {
      const response = await fetch(`${this.baseURL}/auth/refresh/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh: refreshToken }),
      });

      if (response.ok) {
        const tokens: AuthTokens = await response.json();
        this.setTokens(tokens);
        return true;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
    }

    return false;
  }

  // Auth endpoints
  async register(name: string, phone: string, password: string): Promise<AuthTokens> {
    const response = await this.request<AuthTokens>('/auth/register/', {
      method: 'POST',
      body: JSON.stringify({ name, phone, password }),
    });
    this.setTokens(response);
    return response;
  }

  async login(phone: string, password: string): Promise<AuthTokens> {
    const response = await this.request<AuthTokens>('/auth/login/', {
      method: 'POST',
      body: JSON.stringify({ phone, password }),
    });
    this.setTokens(response);
    return response;
  }

  async getMe(): Promise<UserFull> {
    return this.request<UserFull>('/auth/me/');
  }

  logout(): void {
    this.clearTokens();
  }

  // Module endpoints
  async getModules(): Promise<Module[]> {
    return this.request<Module[]>('/api/modules/');
  }

  async createModule(name: string, description?: string): Promise<Module> {
    return this.request<Module>('/api/modules/', {
      method: 'POST',
      body: JSON.stringify({ name, description }),
    });
  }

  async getModule(id: number): Promise<Module> {
    return this.request<Module>(`/api/modules/${id}/`);
  }

  async updateModule(id: number, data: Partial<Module>): Promise<Module> {
    return this.request<Module>(`/api/modules/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteModule(id: number): Promise<void> {
    return this.request<void>(`/api/modules/${id}/`, {
      method: 'DELETE',
    });
  }

  async activateModule(id: number): Promise<{ slug: string }> {
    return this.request<{ slug: string }>(`/api/modules/${id}/activate/`, {
      method: 'POST',
    });
  }

  async deactivateModule(id: number): Promise<void> {
    return this.request<void>(`/api/modules/${id}/deactivate/`, {
      method: 'POST',
    });
  }

  // Question endpoints
  async addQuestion(moduleId: number, questionData: {
    text: string;
    question_type: 'multiple_choice' | 'multiple_select';
    options: { text: string; is_correct: boolean }[];
  }): Promise<Question> {
    return this.request<Question>(`/api/modules/${moduleId}/add-question/`, {
      method: 'POST',
      body: JSON.stringify(questionData),
    });
  }

  async getQuestions(moduleId: number): Promise<Question[]> {
    return this.request<Question[]>(`/api/modules/${moduleId}/questions/`);
  }

  async getQuestion(moduleId: number, questionId: number): Promise<Question> {
    return this.request<Question>(`/api/modules/${moduleId}/questions/${questionId}/`);
  }

  async updateQuestion(moduleId: number, questionId: number, questionData: {
    text: string;
    is_multiple_choice: true | false;
    options: { text: string; is_correct: boolean }[];
  }): Promise<Question> {
    return this.request<Question>(`/api/modules/${moduleId}/questions/${questionId}/`, {
      method: 'PATCH',
      body: JSON.stringify(questionData),
    });
  }

  // Results endpoints
  async getModuleResults(moduleId: number): Promise<TestAttempt[]> {
    return this.request<TestAttempt[]>(`/api/modules/${moduleId}/results/`);
  }

  async getResult(moduleId: number, resultId: number): Promise<TestResult> {
    return this.request<TestResult>(`/api/modules/${moduleId}/results/${resultId}/`);
  }

  // Test endpoints
  async getTestPreview(slug: string): Promise<TestPreview> {
    return this.request<TestPreview>(`/api/t/${slug}/`);
  }

  async startTest(slug: string, studentName: string): Promise<TestStart> {
    return this.request<TestStart>(`/api/t/${slug}/start/`, {
      method: 'POST',
      body: JSON.stringify({ student_name: studentName }),
    });
  }

  async submitAnswers(slug: string, attemptId: number, answers: TestAnswer[]): Promise<void> {
    return this.request<void>(`/api/t/${slug}/answer/`, {
      method: 'POST',
      body: JSON.stringify({
        attempt_id: attemptId,
        answers,
      }),
    });
  }

  async getTestResult(slug: string, attemptId: number): Promise<TestResult> {
    return this.request<TestResult>(`/api/t/${slug}/result/?attempt_id=${attemptId}`);
  }
}

export const apiClient = new ApiClient(API_BASE_URL);