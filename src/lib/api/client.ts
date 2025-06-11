import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient();

export const API_URL = "http://127.0.0.1:8000/api/"; // Замените на ваш API

export async function fetchWithAuth(
  endpoint: string,
  options: RequestInit = {}
) {
  const token = localStorage.getItem("access_token");
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });
  if (!response.ok) throw new Error("API request failed");
  return response.json();
}

export async function useDeleteQuestion(moduleId: string, questionId: string) {
  return await fetchWithAuth(`/questions/${questionId}/`, { method: "DELETE" });
}

export async function useFetchHeatmap(moduleId: string) {
  return await fetchWithAuth(`/modules/${moduleId}/heatmap/`); // Предполагаемый endpoint
}
