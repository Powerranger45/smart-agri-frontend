import { ReactNode } from "react";

// ──────────────────────────── API Response Types ──────────────────────────── //
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// ──────────────────────────── Model Configuration Types ──────────────────────────── //
export interface ModelConfig {
  name: string;
  description: string;
  input_features: string[];
  feature_count: number;
  normalization: {
    mean: number[];
    std: number[];
  };
  target_column: string;
  model: {
    ensemble_size: number;
    hidden_sizes: number[];
    dropout_rate: number;
  };
  categorical_features: string[];
  categorical_mappings: Record<string, string>;
}

export interface ModelConfigs {
  crop_yield: ModelConfig;
  market_price: ModelConfig;
  sustainability: ModelConfig;
}

// ──────────────────────────── Crop Yield Prediction Types ──────────────────────────── //
export interface CropYieldRequest {
  // Base environmental features
  soil_pH: number;
  soil_moisture: number;
  temperature_C: number;
  rainfall_mm: number;
  fertilizer_usage_kg: number;
  pesticide_usage_kg: number;
  // Crop type (will be one-hot encoded)
  crop_type: string;
}

export interface CropYieldResponse {
  predicted_yield: number;
  confidence: number;
  model_ensemble_predictions: number[];
  recommendations: string[];
  factors: Array<{
    factor: string;
    impact: number;
    importance: number;
  }>;
}

// ──────────────────────────── Market Price Prediction Types ──────────────────────────── //
export interface MarketPriceRequest {
  marketPricePerTon: string | number | readonly string[] | undefined;
  demandIndex: string | number | readonly string[] | undefined;
  supplyIndex: string | number | readonly string[] | undefined;
  competitorPricePerTon: string | number | readonly string[] | undefined;
  economicIndicator: string | number | readonly string[] | undefined;
  weatherImpactScore: string | number | readonly string[] | undefined;
  seasonalFactor: string | number | readonly string[] | undefined;
  consumerTrendIndex: string | number | readonly string[] | undefined;
  // Base market features
  market_price_per_ton: number;
  demand_index: number;
  supply_index: number;
  competitor_price_per_ton: number;
  economic_indicator: number;
  weather_impact_score: number;
  seasonal_factor: number;
  consumer_trend_index: number;
  // Product type (will be one-hot encoded)
  product: string;
}

export interface MarketPriceResponse {
  prediction: undefined;
  status: string;
  predictedPrice: any;
  predicted_price: number;
  confidence: number;
  price_trend: 'up' | 'down' | 'stable';
  market_factors: Array<{
    factor: string;
    impact: number;
    description: string;
  }>;
  recommendations: string[];
  model: string; // Add this line
  input_features_used: number; // Add this line if not already present
  product: string; // Add this line if not already present
}

// ──────────────────────────── Sustainability Assessment Types ──────────────────────────── //
export interface SustainabilityRequest {
  // Base environmental features
  soil_pH: number;
  soil_moisture: number;
  temperature_C: number;
  rainfall_mm: number;
  fertilizer_usage_kg: number;
  pesticide_usage_kg: number;
  crop_yield_ton: number;
  // Crop type (will be one-hot encoded)
  crop_type: string;
}

export interface SustainabilityResponse {
  predicted_value: number;
  score: any;
  model_name: string;
  features_used: number;
  model: string;
  crop_type: string;
  status: string;
  input_features_used: number;
  prediction: number;
  sustainability_score: number;
  confidence: number;
  rating: 'excellent' | 'good' | 'fair' | 'poor';
  impact_breakdown: {
    carbon_footprint: number;
    water_efficiency: number;
    soil_health_impact: number;
    biodiversity_score: number;
  };
  recommendations: string[];
  improvement_suggestions: Array<{
    category: string;
    suggestion: string;
    potential_impact: number;
  }>;
}

// ──────────────────────────── Legacy Compatibility Types ──────────────────────────── //
// Keep these for backward compatibility with existing components
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

export interface YieldPredictionRequest {
  // Add the required PascalCase fields
  Soil_pH: number;
  Soil_Moisture: number;
  Temperature_C: number;
  Rainfall_mm: number;
  Fertilizer_Usage_kg: number;
  Pesticide_Usage_kg: number;
  Crop_Type: string;
  
  // Keep existing fields
  crop: string;
  area: number;
  season: string;
  state: string;
  humidity: number;
  ph: number;
  fertilizer: number;
}

export interface YieldPredictionResponse {
  prediction: any;
  predicted_yield: number;
  confidence?: number;
  factors?: Array<{
    factor: string;
    impact: number;
  }>;
  recommendations?: string[];
}

// ──────────────────────────── Dashboard Types ──────────────────────────── //
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

// ──────────────────────────── Form Types ──────────────────────────── //
export interface FormData {
  [key: string]: string | number;
}

export interface FormError {
  field: string;
  message: string;
}

// ──────────────────────────── UI Component Types ──────────────────────────── //
export interface SelectOption {
  value: string;
  label: string;
}

// ──────────────────────────── Constants ──────────────────────────── //
// Crop types based on model configuration
export const CROP_TYPES = [
  'wheat', 'rice', 'corn', 'barley', 'soybean', 'cotton',
  'sugarcane', 'tomato', 'potato', 'onion', 'carrot', 'lettuce',
  'cucumber', 'pepper', 'cabbage', 'spinach', 'broccoli', 'beans'
] as const;

// Market products based on model configuration
export const MARKET_PRODUCTS = [
  'wheat', 'rice', 'corn', 'soybean', 'cotton', 'tomato', 'potato'
] as const;

// Sustainability crop types (extended list)
export const SUSTAINABILITY_CROP_TYPES = [
  'wheat', 'rice', 'corn', 'barley', 'soybean', 'cotton',
  'sugarcane', 'tomato', 'potato', 'onion', 'carrot', 'lettuce',
  'cucumber', 'pepper', 'cabbage', 'spinach', 'broccoli', 'beans'
] as const;

export const FARMING_METHODS = [
  'conventional',
  'organic',
  'precision',
  'sustainable',
  'hydroponic',
  'vertical'
] as const;

export const FERTILIZER_TYPES = [
  'organic',
  'inorganic',
  'bio-fertilizer',
  'compost',
  'mixed'
] as const;

export const SEASONS = [
  'kharif',
  'rabi',
  'zaid',
  'summer',
  'winter'
] as const;

export const REGIONS = [
  'north',
  'south',
  'east',
  'west',
  'central',
  'northeast'
] as const;

// ──────────────────────────── Type Guards ──────────────────────────── //
export function isCropType(value: string): value is typeof CROP_TYPES[number] {
  return CROP_TYPES.includes(value as any);
}

export function isMarketProduct(value: string): value is typeof MARKET_PRODUCTS[number] {
  return MARKET_PRODUCTS.includes(value as any);
}

export function isSustainabilityCropType(value: string): value is typeof SUSTAINABILITY_CROP_TYPES[number] {
  return SUSTAINABILITY_CROP_TYPES.includes(value as any);
}

// ──────────────────────────── Feature Mappings ──────────────────────────── //
export const CROP_FEATURE_NAMES = [
  'Soil_pH',
  'Soil_Moisture',
  'Temperature_C',
  'Rainfall_mm',
  'Fertilizer_Usage_kg',
  'Pesticide_Usage_kg',
  'Crop_Type_Wheat',
  'Crop_Type_Rice',
  'Crop_Type_Corn',
  'Crop_Type_Barley',
  'Crop_Type_Soybean',
  'Crop_Type_Cotton',
  'Crop_Type_Sugarcane',
  'Crop_Type_Tomato',
  'Crop_Type_Potato',
  'Crop_Type_Onion',
  'Crop_Type_Carrot',
  'Crop_Type_Lettuce',
  'Crop_Type_Cucumber',
  'Crop_Type_Pepper'
] as const;

export const MARKET_FEATURE_NAMES = [
  'Market_Price_per_ton',
  'Demand_Index',
  'Supply_Index',
  'Competitor_Price_per_ton',
  'Economic_Indicator',
  'Weather_Impact_Score',
  'Seasonal_Factor',
  'Consumer_Trend_Index',
  'Product_Wheat',
  'Product_Rice',
  'Product_Corn',
  'Product_Soybean',
  'Product_Cotton',
  'Product_Tomato',
  'Product_Potato'
] as const;

export const SUSTAINABILITY_FEATURE_NAMES = [
  'Soil_pH',
  'Soil_Moisture',
  'Temperature_C',
  'Rainfall_mm',
  'Fertilizer_Usage_kg',
  'Pesticide_Usage_kg',
  'Crop_Yield_ton',
  'Crop_Type_Wheat',
  'Crop_Type_Rice',
  'Crop_Type_Corn',
  'Crop_Type_Barley',
  'Crop_Type_Soybean',
  'Crop_Type_Cotton',
  'Crop_Type_Sugarcane',
  'Crop_Type_Tomato',
  'Crop_Type_Potato',
  'Crop_Type_Onion',
  'Crop_Type_Carrot',
  'Crop_Type_Lettuce',
  'Crop_Type_Cucumber',
  'Crop_Type_Pepper',
  'Crop_Type_Cabbage',
  'Crop_Type_Spinach',
  'Crop_Type_Broccoli',
  'Crop_Type_Beans'
] as const;

// ──────────────────────────── Utility Types ──────────────────────────── //
export type CropType = typeof CROP_TYPES[number];
export type MarketProduct = typeof MARKET_PRODUCTS[number];
export type SustainabilityCropType = typeof SUSTAINABILITY_CROP_TYPES[number];
export type FarmingMethod = typeof FARMING_METHODS[number];
export type FertilizerType = typeof FERTILIZER_TYPES[number];
export type Season = typeof SEASONS[number];
export type Region = typeof REGIONS[number];

// ──────────────────────────── Model Input Preparation Types ──────────────────────────── //
export interface PreparedModelInput {
  features: number[];
  feature_names: string[];
  model_type: 'crop_yield' | 'market_price' | 'sustainability';
}

export interface ModelPredictionResult {
  prediction: number;
  confidence: number;
  feature_importance?: Array<{
    feature: string;
    importance: number;
  }>;
}