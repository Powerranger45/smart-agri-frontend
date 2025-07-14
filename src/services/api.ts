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
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

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
    // Only use localStorage if we're in the browser
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for handling errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.detail ||
      error.response?.data?.message ||
      'An unexpected error occurred';
    return Promise.reject(new Error(message));
  }
);

// Generic API call wrapper
const apiCall = async <T>(
  apiFunction: () => Promise<AxiosResponse<T>>
): Promise<T> => {
  try {
    const response = await apiFunction();
    return response.data;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Network error occurred');
  }
};

// Sustainability key mapping for backend compatibility
const backendKeysMap: Record<keyof SustainabilityRequest, string> = {
  soil_pH: 'Soil_pH',
  soil_moisture: 'Soil_Moisture',
  temperature_C: 'Temperature_C',
  rainfall_mm: 'Rainfall_mm',
  fertilizer_usage_kg: 'Fertilizer_Usage_kg',
  pesticide_usage_kg: 'Pesticide_Usage_kg',
  crop_yield_ton: 'Crop_Yield_ton',
  crop_type: 'Crop_Type',
};

// Convert camelCase to PascalCase for backend
const toPascalCase = (data: SustainabilityRequest): Record<string, any> => {
  const converted: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    const backendKey = backendKeysMap[key as keyof SustainabilityRequest] || key;
    converted[backendKey] = value;
  }
  return converted;
};

// Convert PascalCase or snake_case to camelCase
const toCamelCase = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(toCamelCase);
  } else if (obj && typeof obj === 'object') {
    const converted: any = {};
    for (const [key, value] of Object.entries(obj)) {
      const camelKey = key
        .replace(/_([a-z])/g, (_, c) => c.toUpperCase()) // snake_case → camelCase
        .replace(/^[A-Z]/, (c) => c.toLowerCase());      // PascalCase → camelCase
      converted[camelKey] = toCamelCase(value);
    }
    return converted;
  }
  return obj;
};

// Convert SustainabilityRequest keys to backend format
const transformSustainabilityKeys = (
  data: SustainabilityRequest
): Record<string, any> => {
  const transformed: Record<string, any> = {};
  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      const backendKey = backendKeysMap[key as keyof SustainabilityRequest] || key;
      transformed[backendKey] = data[key as keyof SustainabilityRequest];
    }
  }
  return transformed;
};

// API Services

export const cropYieldApi = {
  predict: async (
    data: YieldPredictionRequest,
    options?: { signal?: AbortSignal }
  ): Promise<YieldPredictionResponse> => {
    return apiCall(() =>
      api.post<YieldPredictionResponse>('/predict/crop-yield', data, options)
    );
  },
};

export const marketPriceApi = {
  predict: async (data: {
    Market_Price_per_ton: number;
    Demand_Index: number;
    Supply_Index: number;
    Competitor_Price_per_ton: number;
    Economic_Indicator: number;
    Weather_Impact_Score: number;
    Seasonal_Factor: number;
    Consumer_Trend_Index: number;
    Product: string;
  }): Promise<{
    prediction: number;
    model: string;
    input_features_used: number;
    product: string;
    status: string;
  }> => {
    return apiCall(() => api.post('/predict/market-price', data));
  },
};

export const sustainabilityApi = {
  predict: async (data: SustainabilityRequest): Promise<SustainabilityResponse> => {
    const backendData = toPascalCase(data);
    return apiCall(async () => {
      const response = await api.post<any>('/predict/sustainability', backendData);
      return toCamelCase(response.data);
    });
  },

  getHistory: async (): Promise<SustainabilityResponse[]> => {
    return apiCall(async () => {
      const response = await api.get<SustainabilityResponse[]>('/sustainability/history');
      return toCamelCase(response.data);
    });
  },

  getAverageScore: async (): Promise<{ averageScore: number; totalAssessments: number }> => {
    return apiCall(async () => {
      const response = await api.get('/sustainability/average');
      return toCamelCase(response.data);
    });
  },

  getRecommendations: async (score: number): Promise<{
    recommendations: string[];
    improvementAreas: string[];
    currentLevel: string;
  }> => {
    return apiCall(async () => {
      const response = await api.get(`/sustainability/recommendations?score=${score}`);
      return toCamelCase(response.data);
    });
  },
};

export const cropRecommendationApi = {
  predict: async (
    data: CropRecommendationRequest
  ): Promise<CropRecommendationResponse> => {
    return apiCall(() =>
      api.post<CropRecommendationResponse>('/crop-recommendation', data)
    );
  },

  getHistory: async (): Promise<CropRecommendationResponse[]> => {
    return apiCall(() =>
      api.get<CropRecommendationResponse[]>('/crop-recommendation/history')
    );
  },

  getSuitableCrops: async (
    conditions: Partial<CropRecommendationRequest>
  ): Promise<{
    crops: Array<{
      name: string;
      suitability: number;
      reasons: string[];
    }>;
  }> => {
    return apiCall(() =>
      api.post('/crop-recommendation/suitable-crops', conditions)
    );
  },
};

export const yieldPredictionApi = {
  predict: async (
    data: YieldPredictionRequest
  ): Promise<YieldPredictionResponse> => {
    return cropYieldApi.predict(data);
  },

  getHistory: async (): Promise<YieldPredictionResponse[]> => {
    return apiCall(() =>
      api.get<YieldPredictionResponse[]>('/yield-prediction/history')
    );
  },

  getStats: async (): Promise<{
    total_predictions: number;
    average_yield: number;
  }> => {
    return apiCall(() =>
      api.get<{ total_predictions: number; average_yield: number }>(
        '/yield-prediction/stats'
      )
    );
  },

  getYieldTrends: async (
    cropType: string,
    timeRange: string
  ): Promise<{
    trends: Array<{
      date: string;
      yield: number;
      prediction: number;
    }>;
    averageYield: number;
    growthRate: number;
  }> => {
    return apiCall(() =>
      api.get(`/yield-prediction/trends?crop=${cropType}&range=${timeRange}`)
    );
  },
};

export const dashboardApi = {
  getData: async (selectedTimeRange?: string): Promise<DashboardData> => {
    const params = selectedTimeRange ? { timeRange: selectedTimeRange } : {};
    return apiCall(() => api.get<DashboardData>('/dashboard', { params }));
  },

  getMetrics: async (): Promise<{
    totalFarms: number;
    totalPredictions: number;
    averageSustainabilityScore: number;
    averageYield: number;
    topCrops: Array<{
      name: string;
      count: number;
      avgYield: number;
    }>;
  }> => {
    return apiCall(() => api.get('/dashboard/metrics'));
  },

  getChartData: async (chartType: string, timeRange: string): Promise<{
    data: Array<{
      date: string;
      value: number;
      label?: string;
    }>;
    title: string;
    unit: string;
  }> => {
    return apiCall(() =>
      api.get(`/dashboard/charts/${chartType}?range=${timeRange}`)
    );
  },
};

export const healthApi = {
  check: async (): Promise<{
    status: string;
    device: string;
    models: Record<
      string,
      {
        status: string;
        input_size?: number;
        model_name?: string;
        error?: string;
      }
    >;
  }> => {
    return apiCall(() => api.get('/health'));
  },

  getSystemInfo: async (): Promise<{
    uptime: number;
    memory: {
      total: number;
      used: number;
      available: number;
    };
    cpu: {
      usage: number;
      cores: number;
    };
    disk: {
      total: number;
      used: number;
      available: number;
    };
  }> => {
    return apiCall(() => api.get('/health/system'));
  },
};

export const modelsApi = {
  getInfo: async (): Promise<{
    available_models: Record<
      string,
      {
        input_features: string[];
        feature_count: number;
        description: string;
        target: string;
        supported_crop_types?: string[];
        supported_products?: string[];
      }
    >;
  }> => {
    return apiCall(() => api.get('/models/info'));
  },

  debug: async (
    modelType: 'crop_yield' | 'market_price' | 'sustainability'
  ): Promise<{
    model_type: string;
    expected_input_size: number;
    total_parameters: number;
    trainable_parameters: number;
    ensemble_size: number;
    hidden_sizes: number[];
    device: string;
    model_structure: string;
  }> => {
    return apiCall(() => api.get(`/models/debug/${modelType}`));
  },

  getPerformance: async (
    modelType: string
  ): Promise<{
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
    lastUpdated: string;
    trainingData: {
      samples: number;
      features: number;
    };
  }> => {
    return apiCall(() => api.get(`/models/performance/${modelType}`));
  },

  retrain: async (
    modelType: string,
    data?: any
  ): Promise<{
    status: string;
    message: string;
    jobId: string;
  }> => {
    return apiCall(() => api.post(`/models/retrain/${modelType}`, data));
  },
};

export const testApi = {
  testEncoding: async (
    data: Record<string, any>
  ): Promise<{
    original_data: Record<string, any>;
    encoded_features: Record<string, any>;
    total_features: number;
    one_hot_features: string[];
  }> => {
    return apiCall(() => api.post('/test/encoding', data));
  },

  testPrediction: async (
    modelType: string,
    data: Record<string, any>
  ): Promise<{
    prediction: any;
    confidence: number;
    processingTime: number;
    modelVersion: string;
  }> => {
    return apiCall(() => api.post(`/test/prediction/${modelType}`, data));
  },
};

export const analyticsApi = {
  getUsageStats: async (timeRange: string): Promise<{
    totalRequests: number;
    successRate: number;
    averageResponseTime: number;
    topEndpoints: Array<{
      endpoint: string;
      requests: number;
      averageTime: number;
    }>;
    errorRate: number;
    dailyUsage: Array<{
      date: string;
      requests: number;
      errors: number;
    }>;
  }> => {
    return apiCall(() => api.get(`/analytics/usage?range=${timeRange}`));
  },

  getModelAccuracy: async (): Promise<{
    models: Record<string, {
      accuracy: number;
      lastEvaluated: string;
      totalPredictions: number;
      successfulPredictions: number;
    }>;
  }> => {
    return apiCall(() => api.get('/analytics/model-accuracy'));
  },
};

export const userApi = {
  getProfile: async (): Promise<{
    id: string;
    username: string;
    email: string;
    role: string;
    createdAt: string;
    lastLogin: string;
    preferences: Record<string, any>;
  }> => {
    return apiCall(() => api.get('/user/profile'));
  },

  updateProfile: async (data: {
    username?: string;
    email?: string;
    preferences?: Record<string, any>;
  }): Promise<{
    message: string;
    user: any;
  }> => {
    return apiCall(() => api.put('/user/profile', data));
  },

  changePassword: async (data: {
    currentPassword: string;
    newPassword: string;
  }): Promise<{
    message: string;
  }> => {
    return apiCall(() => api.put('/user/password', data));
  },
};

export const authApi = {
  login: async (credentials: {
    username: string;
    password: string;
  }): Promise<{
    token: string;
    user: any;
    expiresIn: number;
  }> => {
    return apiCall(() => api.post('/auth/login', credentials));
  },

  register: async (data: {
    username: string;
    email: string;
    password: string;
  }): Promise<{
    message: string;
    user: any;
  }> => {
    return apiCall(() => api.post('/auth/register', data));
  },

  logout: async (): Promise<{
    message: string;
  }> => {
    return apiCall(() => api.post('/auth/logout'));
  },

  refreshToken: async (): Promise<{
    token: string;
    expiresIn: number;
  }> => {
    return apiCall(() => api.post('/auth/refresh'));
  },

  forgotPassword: async (email: string): Promise<{
    message: string;
  }> => {
    return apiCall(() => api.post('/auth/forgot-password', { email }));
  },

  resetPassword: async (data: {
    token: string;
    newPassword: string;
  }): Promise<{
    message: string;
  }> => {
    return apiCall(() => api.post('/auth/reset-password', data));
  },
};

// Export default axios instance
export default api;

// Export all APIs as a single object for convenience
export const apiService = {
  cropYield: cropYieldApi,
  marketPrice: marketPriceApi,
  sustainability: sustainabilityApi,
  cropRecommendation: cropRecommendationApi,
  yieldPrediction: yieldPredictionApi,
  dashboard: dashboardApi,
  health: healthApi,
  models: modelsApi,
  test: testApi,
  analytics: analyticsApi,
  user: userApi,
  auth: authApi,
};

// Utility functions for external use
export const utils = {
  toCamelCase,
  toPascalCase,
  transformSustainabilityKeys,
  apiCall,
};