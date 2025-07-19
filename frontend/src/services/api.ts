/**
 * API Service Layer for Engagement Analytics Dashboard
 * Handles all API communications with proper error handling and retry logic
 */

import axios, {
  AxiosInstance,
  AxiosResponse,
  AxiosError,
  InternalAxiosRequestConfig,
} from "axios";
import {
  EngagementResponse,
  EngagementFilters,
  AnalyticsSummary,
  CSVUploadResponse,
  APIError,
  DrillDownData,
  EngagementItem,
  ExportOptions,
} from "../types/engagement";

/**
 * Extended Axios request config with metadata
 */
interface ExtendedAxiosRequestConfig extends InternalAxiosRequestConfig {
  metadata?: {
    requestId: number;
    startTime: number;
  };
}

/**
 * Configuration constants
 */
const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || "http://localhost:8000",
  TIMEOUT: 10000,
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,
};

/**
 * Custom error class for API errors
 */
class APIServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public status?: number,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "APIServiceError";
  }
}

/**
 * Retry configuration for different types of operations
 */
const RETRY_CONFIG = {
  GET: { maxRetries: 3, delay: 1000 },
  POST: { maxRetries: 2, delay: 1500 },
  PUT: { maxRetries: 2, delay: 1500 },
  DELETE: { maxRetries: 1, delay: 2000 },
};

/**
 * API Service class with comprehensive error handling and retry logic
 */
class APIService {
  private axiosInstance: AxiosInstance;
  private requestIdCounter = 0;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
      headers: {
        "Content-Type": "application/json",
        "X-Client-Version": "1.0.0",
      },
    });

    this.setupInterceptors();
  }

  /**
   * Setup request and response interceptors
   */
  private setupInterceptors(): void {
    // Request interceptor
    this.axiosInstance.interceptors.request.use(
      (config: ExtendedAxiosRequestConfig) => {
        const requestId = ++this.requestIdCounter;
        config.headers["X-Request-ID"] = requestId.toString();
        config.metadata = { requestId, startTime: Date.now() };

        // Log request in development
        if (import.meta.env.DEV) {
          console.log(`[API Request ${requestId}]`, {
            method: config.method?.toUpperCase(),
            url: config.url,
            params: config.params,
          });
        }

        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.axiosInstance.interceptors.response.use(
      (response) => {
        const { requestId, startTime } =
          (response.config as ExtendedAxiosRequestConfig).metadata || {};
        const duration = Date.now() - (startTime || 0);

        if (import.meta.env.DEV) {
          console.log(`[API Response ${requestId}]`, {
            status: response.status,
            duration: `${duration}ms`,
            size: JSON.stringify(response.data).length,
          });
        }

        return response;
      },
      (error) => {
        const { requestId } =
          (error.config as ExtendedAxiosRequestConfig)?.metadata || {};

        if (import.meta.env.DEV) {
          console.error(`[API Error ${requestId}]`, {
            status: error.response?.status,
            message: error.message,
            data: error.response?.data,
          });
        }

        return Promise.reject(this.handleError(error));
      }
    );
  }

  /**
   * Handle and transform API errors
   */
  private handleError(error: AxiosError): APIServiceError {
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      const errorData = data as any;

      return new APIServiceError(
        errorData.message || `Request failed with status ${status}`,
        errorData.code || "API_ERROR",
        status,
        errorData.details
      );
    } else if (error.request) {
      // Network error
      return new APIServiceError(
        "Network error - please check your connection",
        "NETWORK_ERROR",
        undefined,
        { originalError: error.message }
      );
    } else {
      // Request configuration error
      return new APIServiceError(
        "Request configuration error",
        "CONFIG_ERROR",
        undefined,
        { originalError: error.message }
      );
    }
  }

  /**
   * Retry logic with exponential backoff
   */
  private async retryRequest<T>(
    request: () => Promise<AxiosResponse<T>>,
    maxRetries: number = API_CONFIG.MAX_RETRIES,
    baseDelay: number = API_CONFIG.RETRY_DELAY
  ): Promise<AxiosResponse<T>> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await request();
      } catch (error) {
        lastError = error as Error;

        // Don't retry on client errors (4xx) or last attempt
        if (
          error instanceof APIServiceError &&
          error.status &&
          error.status >= 400 &&
          error.status < 500
        ) {
          break;
        }

        if (attempt === maxRetries) break;

        // Exponential backoff with jitter
        const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  }

  /**
   * Build URL with query parameters
   */
  private buildUrl(endpoint: string, params?: Record<string, unknown>): string {
    const url = new URL(endpoint, API_CONFIG.BASE_URL);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          url.searchParams.append(key, String(value));
        }
      });
    }

    return url.toString();
  }

  /**
   * Get engagement data with filters
   */
  async getEngagements(
    filters: EngagementFilters = {}
  ): Promise<EngagementResponse> {
    const { maxRetries, delay } = RETRY_CONFIG.GET;

    return this.retryRequest(
      () =>
        this.axiosInstance.get<EngagementResponse>("/api/engagement", {
          params: filters,
        }),
      maxRetries,
      delay
    ).then((response) => response.data);
  }

  /**
   * Get analytics summary
   */
  async getAnalyticsSummary(): Promise<AnalyticsSummary> {
    const { maxRetries, delay } = RETRY_CONFIG.GET;

    return this.retryRequest(
      () => this.axiosInstance.get<AnalyticsSummary>("/api/analytics/summary"),
      maxRetries,
      delay
    ).then((response) => response.data);
  }

  /**
   * Upload CSV file for processing
   */
  async uploadCSV(
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<CSVUploadResponse> {
    const formData = new FormData();
    formData.append("csvFile", file);

    const { maxRetries, delay } = RETRY_CONFIG.POST;

    return this.retryRequest(
      () =>
        this.axiosInstance.post<CSVUploadResponse>(
          "/api/engagement/upload",
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
            onUploadProgress: (progressEvent) => {
              if (onProgress && progressEvent.total) {
                const progress = Math.round(
                  (progressEvent.loaded * 100) / progressEvent.total
                );
                onProgress(progress);
              }
            },
          }
        ),
      maxRetries,
      delay
    ).then((response) => response.data);
  }

  /**
   * Get drill-down data for a specific engagement item
   */
  async getDrillDownData(itemId: number): Promise<DrillDownData> {
    const { maxRetries, delay } = RETRY_CONFIG.GET;

    return this.retryRequest(
      () =>
        this.axiosInstance.get<DrillDownData>(
          `/api/engagement/${itemId}/drill-down`
        ),
      maxRetries,
      delay
    ).then((response) => response.data);
  }

  /**
   * Export engagement data
   */
  async exportData(options: ExportOptions): Promise<Blob> {
    const { maxRetries, delay } = RETRY_CONFIG.POST;

    return this.retryRequest(
      () =>
        this.axiosInstance.post("/api/engagement/export", options, {
          responseType: "blob",
        }),
      maxRetries,
      delay
    ).then((response) => response.data);
  }

  /**
   * Get real-time engagement updates
   */
  async getRealtimeUpdates(lastTimestamp?: string): Promise<EngagementItem[]> {
    const params = lastTimestamp ? { since: lastTimestamp } : {};
    const { maxRetries, delay } = RETRY_CONFIG.GET;

    return this.retryRequest(
      () =>
        this.axiosInstance.get<EngagementItem[]>("/api/engagement/realtime", {
          params,
        }),
      maxRetries,
      delay
    ).then((response) => response.data);
  }

  /**
   * Get user segment analytics (Second Round Addition)
   */
  async getSegmentAnalytics(
    segment?: string,
    compareSegments?: string[]
  ): Promise<any> {
    const params = new URLSearchParams();

    if (segment) {
      params.append("segment", segment);
    }

    if (compareSegments && compareSegments.length > 0) {
      params.append("compareSegments", compareSegments.join(","));
    }

    const response = await this.axiosInstance.get(
      `/api/analytics/segments?${params.toString()}`
    );
    return response.data;
  }

  /**
   * Export engagement data as CSV (Second Round Addition)
   */
  async exportCSV(includeAnalytics: boolean = false): Promise<Blob> {
    const response = await this.axiosInstance.get("/api/export/csv", {
      params: { includeAnalytics },
      responseType: "blob",
    });

    return response.data;
  }

  /**
   * Health check endpoint
   */
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return this.axiosInstance
      .get("/api/health")
      .then((response) => response.data)
      .catch(() => ({
        status: "unhealthy",
        timestamp: new Date().toISOString(),
      }));
  }

  /**
   * Cancel all pending requests
   */
  cancelAllRequests(): void {
    // Create new axios instance to effectively cancel all requests
    this.axiosInstance = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
      headers: {
        "Content-Type": "application/json",
        "X-Client-Version": "1.0.0",
      },
    });

    this.setupInterceptors();
  }
}

// Export singleton instance
export const apiService = new APIService();

// Export utility functions
export const isAPIError = (error: unknown): error is APIServiceError => {
  return error instanceof APIServiceError;
};

export const getErrorMessage = (error: unknown): string => {
  if (isAPIError(error)) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "An unknown error occurred";
};

export const shouldRetry = (error: unknown): boolean => {
  if (isAPIError(error)) {
    // Don't retry client errors
    return !error.status || error.status >= 500;
  }
  return true;
};

export default apiService;
