import type { ApiErrorResponse } from '../types/api';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export class ApiError extends Error {
  status: number;
  data?: ApiErrorResponse;

  constructor(message: string, status: number, data?: ApiErrorResponse) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined | null>;
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { params, headers, ...customOptions } = options;

  let url = `${BASE_URL.replace(/\/$/, '')}/${endpoint.replace(/^\//, '')}`;

  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, String(value));
      }
    });
    const qs = searchParams.toString();
    if (qs) {
      url += `?${qs}`;
    }
  }

  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...headers,
  };

  try {
    const response = await fetch(url, {
      ...customOptions,
      headers: defaultHeaders,
      credentials: 'include', // Essential for HTTP-only cookies
    });

    if (!response.ok) {
      let errorData: ApiErrorResponse | undefined;
      try {
        errorData = await response.json();
      } catch {
        // Response is not JSON
      }

      const errorMessage =
        errorData?.message ||
        `HTTP ${response.status}: ${response.statusText || 'Request failed'}`;

      throw new ApiError(errorMessage, response.status, errorData);
    }

    if (response.status === 204) {
      return {} as T;
    }

    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    // Network connection errors / Backend offline
    const isNetworkError = error instanceof TypeError && error.message.includes('fetch');
    const message = isNetworkError
      ? `Cannot connect to QBank API at ${BASE_URL}. Please ensure the backend server is running.`
      : (error as Error).message || 'An unexpected network error occurred.';

    throw new ApiError(message, 0);
  }
}

export const apiClient = {
  get: <T>(endpoint: string, params?: RequestOptions['params']) =>
    request<T>(endpoint, { method: 'GET', params }),

  post: <T>(endpoint: string, body?: unknown) =>
    request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),

  patch: <T>(endpoint: string, body?: unknown) =>
    request<T>(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    }),

  delete: <T>(endpoint: string) =>
    request<T>(endpoint, { method: 'DELETE' }),
};
