import { ReactNode } from "react";

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Crop Recommendation Types
export interface CropRecommendationRequest {
  nitrogen: number;
  phosphorus: number;
  potassium: number;
  temperature: number;
  humidity: number;
  ph: number;
  rainfall: number;
}

export interface CropRecommendationResponse {
  recommended_crop: string;
  confidence: number;
  soil_health: string;
  recommendations: string[];
  alternative_crops: string[];
}

// Sustainability Types
export interface SustainabilityRequest {
  crop_type: string;
  farming_method: string;
  water_usage: number;
  fertilizer_type: string;
  fertilizer_amount: number;
  pesticide_usage: number;
  land_area: number;
  energy_consumption: number;
}

export interface SustainabilityResponse {
  sustainability_score: number;
  carbon_footprint: number;
  water_efficiency: number;
  soil_health_impact: number;
  biodiversity_score: number;
  recommendations: string[];
  rating: string;
}

// Yield Prediction Types
export interface YieldPredictionRequest {
  crop: string;
  area: number;
  season: string;
  state: string;
  rainfall: number;
  temperature: number;
  humidity: number;
  ph: number;
  fertilizer: number;
}

export interface YieldPredictionResponse {
  predicted_yield: number;
  confidence?: number;
  factors?: Array<{
    factor: string;
    impact: number;
  }>;
  recommendations?: string[];
}

// Dashboard Types
export interface DashboardData {
  totalPredictions: ReactNode;
  predictionGrowth: ReactNode;
  avgYieldPrediction: any;
  yieldTrend: number;
  sustainabilityScore: any;
  sustainabilityTrend: number;
  activeFarms: ReactNode;
  farmGrowth: number;
  cropDistribution: any;
  recentActivity: any;
  yieldTrends: any;
  regionalData: any;
  recommendations: any;
  total_predictions: number;
  recent_recommendations: CropRecommendationResponse[];
  sustainability_summary: {
    average_score: number;
    total_assessments: number;
  };
  yield_summary: {
    total_predictions: number;
    average_yield: number;
  };
}

// Form Types
export interface FormData {
  [key: string]: string | number;
}

// UI Component Types
export interface SelectOption {
  value: string;
  label: string;
}

// Error Types
export interface FormError {
  field: string;
  message: string;
}

// Constants
export const CROP_TYPES = [
  'rice', 'wheat', 'corn', 'barley', 'sugarcane', 'cotton',
  'jute', 'coffee', 'coconut', 'papaya', 'orange', 'apple',
  'muskmelon', 'watermelon', 'grapes', 'mango', 'banana',
  'pomegranate', 'lentil', 'blackgram', 'mungbean', 'mothbeans',
  'pigeonpeas', 'kidneybeans', 'chickpea'
];

export const FARMING_METHODS = [
  'conventional',
  'organic',
  'precision',
  'sustainable',
  'hydroponic',
  'vertical'
];

export const FERTILIZER_TYPES = [
  'organic',
  'inorganic',
  'bio-fertilizer',
  'compost',
  'mixed'
];

export const SEASONS = [
  'kharif',
  'rabi',
  'zaid',
  'summer',
  'winter'
];

export const REGIONS = [
  'north',
  'south',
  'east',
  'west',
  'central',
  'northeast'
];
