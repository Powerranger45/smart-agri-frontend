import axios, { AxiosResponse } from 'axios';
import {
  ApiResponse,
  CropRecommendationRequest,
  CropRecommendationResponse,
  SustainabilityRequest,
  SustainabilityResponse,
  YieldPredictionRequest,
  YieldPredictionResponse,
  DashboardData,
} from '@/types';

// Base API configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth tokens if needed
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || 'An unexpected error occurred';
    return Promise.reject(new Error(message));
  }
);

// Generic API call wrapper
const apiCall = async <T>(
  apiFunction: () => Promise<AxiosResponse<ApiResponse<T>>>
): Promise<T> => {
  try {
    const response = await apiFunction();

    if (response.data.success) {
      return response.data.data!;
    } else {
      throw new Error(response.data.error || 'API request failed');
    }
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Network error occurred');
  }
};

// Crop Recommendation API
export const cropRecommendationApi = {
  predict: async (data: CropRecommendationRequest): Promise<CropRecommendationResponse> => {
    return apiCall(() =>
      api.post<ApiResponse<CropRecommendationResponse>>('/api/crop-recommendation', data)
    );
  },

  getHistory: async (): Promise<CropRecommendationResponse[]> => {
    return apiCall(() =>
      api.get<ApiResponse<CropRecommendationResponse[]>>('/api/crop-recommendation/history')
    );
  },
};

// Sustainability API
export const sustainabilityApi = {
  predict: async (data: SustainabilityRequest): Promise<SustainabilityResponse> => {
    return apiCall(() =>
      api.post<ApiResponse<SustainabilityResponse>>('/api/sustainability', data)
    );
  },

  getHistory: async (): Promise<SustainabilityResponse[]> => {
    return apiCall(() =>
      api.get<ApiResponse<SustainabilityResponse[]>>('/api/sustainability/history')
    );
  },

  getAverageScore: async (): Promise<{ average_score: number; total_assessments: number }> => {
    return apiCall(() =>
      api.get<ApiResponse<{ average_score: number; total_assessments: number }>>('/api/sustainability/average')
    );
  },
};

// Yield Prediction API
export const yieldPredictionApi = {
  predict: async (data: YieldPredictionRequest): Promise<YieldPredictionResponse> => {
    return apiCall(() =>
      api.post<ApiResponse<YieldPredictionResponse>>('/api/yield-prediction', data)
    );
  },

  getHistory: async (): Promise<YieldPredictionResponse[]> => {
    return apiCall(() =>
      api.get<ApiResponse<YieldPredictionResponse[]>>('/api/yield-prediction/history')
    );
  },

  getStats: async (): Promise<{ total_predictions: number; average_yield: number }> => {
    return apiCall(() =>
      api.get<ApiResponse<{ total_predictions: number; average_yield: number }>>('/api/yield-prediction/stats')
    );
  },
};

// Dashboard API
export const dashboardApi = {
  getData: async (selectedTimeRange: any): Promise<DashboardData> => {
    return apiCall(() =>
      api.get<ApiResponse<DashboardData>>('/api/dashboard')
    );
  },
};

// Health Check API
export const healthApi = {
  check: async (): Promise<{ status: string; timestamp: string }> => {
    return apiCall(() =>
      api.get<ApiResponse<{ status: string; timestamp: string }>>('/api/health')
    );
  },
};

// Export default api instance for custom requests
export default api;
