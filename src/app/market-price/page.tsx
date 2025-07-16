// pages/market-price-analysis/index.tsx

'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  ArrowLeft,
  DollarSign,
  TrendingUp,
  ShoppingBag,
  Info,
  Loader2,
  CheckCircle,
  BarChart2,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { marketPriceApi } from '@/services/api';
import {
  MarketPriceRequest,
  MarketPriceResponse,
  MarketProduct,
  MARKET_PRODUCTS
} from '@/types';

// Clean interface for form data (frontend only)
interface MarketPriceFormData {
  marketPricePerTon: number;
  demandIndex: number;
  supplyIndex: number;
  competitorPricePerTon: number;
  economicIndicator: number;
  weatherImpactScore: number;
  seasonalFactor: number;
  consumerTrendIndex: number;
  product: MarketProduct;
}

// Display result interface
interface MarketPriceDisplayResult {
  product: MarketProduct;
  predictedPrice: number;
  confidence: number;
  status: string;
  priceStatus: string;
}

const DEFAULT_FORM_VALUES: MarketPriceFormData = {
  marketPricePerTon: 0,
  demandIndex: 0,
  supplyIndex: 0,
  competitorPricePerTon: 0,
  economicIndicator: 0,
  weatherImpactScore: 0,
  seasonalFactor: 0,
  consumerTrendIndex: 0,
  product: 'wheat',
};

export default function MarketPriceAnalysisPage() {
  const [formData, setFormData] = useState<MarketPriceFormData>(DEFAULT_FORM_VALUES);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<MarketPriceDisplayResult[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [controller, setController] = useState<AbortController | null>(null);

  useEffect(() => {
    return () => controller?.abort();
  }, [controller]);

  const handleInputChange = useCallback((field: keyof MarketPriceFormData, value: string | number) => {
    const processedValue = field === 'product' ? value : typeof value === 'string' ? parseFloat(value) || 0 : value;
    setFormData(prev => ({ ...prev, [field]: processedValue as any }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  }, [errors]);

  const validateForm = useCallback((): boolean => {
    const validationRules = [
      { field: 'marketPricePerTon', min: 0, message: 'Market Price must be non-negative' },
      { field: 'demandIndex', min: 0, max: 100, message: 'Demand Index should be between 0-100' },
      { field: 'supplyIndex', min: 0, max: 100, message: 'Supply Index should be between 0-100' },
      { field: 'competitorPricePerTon', min: 0, message: 'Competitor Price must be non-negative' },
      { field: 'economicIndicator', min: -10, max: 10, message: 'Economic Indicator should be between -10 and 10' },
      { field: 'weatherImpactScore', min: -5, max: 5, message: 'Weather Impact Score should be between -5 and 5' },
      { field: 'seasonalFactor', min: 0, max: 1, message: 'Seasonal Factor should be between 0 and 1' },
      { field: 'consumerTrendIndex', min: 0, max: 100, message: 'Consumer Trend Index should be between 0-100' },
      { field: 'product', required: true, message: 'Please select a product' },
    ];

    const newErrors = validationRules.reduce((acc, rule) => {
      const value = formData[rule.field as keyof MarketPriceFormData];
      if ((rule.required && (value === undefined || value === null || (typeof value === 'string' && value.trim() === ''))) ||
          (typeof value === 'number' && ((rule.min !== undefined && value < rule.min) || (rule.max !== undefined && value > rule.max)))) {
        acc[rule.field] = rule.message;
      }
      return acc;
    }, {} as Record<string, string>);

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const getPriceStatus = useCallback((priceValue: number): string => {
    if (priceValue >= 1000) return 'High Potential';
    if (priceValue >= 500) return 'Moderate Potential';
    return 'Low Potential';
  }, []);

  const getPriceColor = useCallback((priceValue: number): string => {
    if (priceValue >= 1000) return 'text-green-600';
    if (priceValue >= 500) return 'text-yellow-600';
    return 'text-red-600';
  }, []);

  // Convert form data to API request format
  const convertToApiRequest = useCallback((data: MarketPriceFormData): MarketPriceRequest => {
    return {
      // Frontend camelCase properties (for compatibility)
      marketPricePerTon: data.marketPricePerTon,
      demandIndex: data.demandIndex,
      supplyIndex: data.supplyIndex,
      competitorPricePerTon: data.competitorPricePerTon,
      economicIndicator: data.economicIndicator,
      weatherImpactScore: data.weatherImpactScore,
      seasonalFactor: data.seasonalFactor,
      consumerTrendIndex: data.consumerTrendIndex,
      
      // Backend expected properties (snake_case/PascalCase)
      market_price_per_ton: data.marketPricePerTon,
      demand_index: data.demandIndex,
      supply_index: data.supplyIndex,
      competitor_price_per_ton: data.competitorPricePerTon,
      economic_indicator: data.economicIndicator,
      weather_impact_score: data.weatherImpactScore,
      seasonal_factor: data.seasonalFactor,
      consumer_trend_index: data.consumerTrendIndex,
      product: data.product,
    };
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error("Validation Error", { description: "Please correct the form errors" });
      return;
    }

    controller?.abort();
    const newController = new AbortController();
    setController(newController);

    setLoading(true);
    setResults([]);

    try {
      // Convert form data to API request format
      const apiRequest = convertToApiRequest(formData);
      
      // Make API call
      const response = await marketPriceApi.predict(apiRequest);

      // Handle response based on your API structure
      let predictedPrice: number;
      let confidence: number = 0.8; // Default confidence

      if (response.predictedPrice !== undefined) {
        predictedPrice = response.predictedPrice;
        confidence = response.confidence || 0.8;
      } else if (response.predicted_price !== undefined) {
        predictedPrice = response.predicted_price;
        confidence = response.confidence || 0.8;
      } else if (response.prediction !== undefined) {
        predictedPrice = response.prediction;
        confidence = response.confidence || 0.8;
      } else {
        throw new Error('Invalid response format: no prediction found');
      }

      const newResult: MarketPriceDisplayResult = {
        product: formData.product,
        predictedPrice: predictedPrice,
        confidence: confidence,
        status: response.status || 'success',
        priceStatus: getPriceStatus(predictedPrice)
      };

      setResults([newResult]);

      toast.success("Analysis Complete", {
        description: `Predicted price for ${formData.product}: $${predictedPrice.toFixed(2)} / ton`,
      });

    } catch (error: unknown) {
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('Market price prediction error:', error);
        toast.error("Analysis Failed", { description: error.message });
      } else if (!(error instanceof Error)) {
        console.error('Unknown error type:', error);
        toast.error("Analysis Failed", { description: "An unknown error occurred" });
      }
    } finally {
      setLoading(false);
    }
  }, [formData, validateForm, getPriceStatus, controller, convertToApiRequest]);

  return (
    <div className="min-h-screen container mx-auto px-4 py-8">
      <header className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>
        <div className="flex items-center gap-3 mb-4">
          <DollarSign className="h-8 w-8 text-indigo-600" />
          <h1 className="text-3xl font-bold text-gray-900">Market Price Analysis</h1>
        </div>
        <p className="text-gray-600 max-w-2xl">
          Predict market prices for agricultural products based on various economic and market indicators.
          Enter the current market conditions to get insights.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart2 className="h-5 w-5" />
              Market Data
            </CardTitle>
            <CardDescription>
              Enter the current market and economic conditions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4" />
                  Market Indicators
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="marketPricePerTon">Current Market Price (per ton)</Label>
                    <Input
                      id="marketPricePerTon"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="e.g., 500"
                      value={formData.marketPricePerTon}
                      onChange={(e) => handleInputChange('marketPricePerTon', e.target.value)}
                      className={errors.marketPricePerTon ? 'border-red-500' : ''}
                    />
                    {errors.marketPricePerTon && <p className="text-sm text-red-500">{errors.marketPricePerTon}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="demandIndex">Demand Index (%)</Label>
                    <Input
                      id="demandIndex"
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      placeholder="e.g., 75"
                      value={formData.demandIndex}
                      onChange={(e) => handleInputChange('demandIndex', e.target.value)}
                      className={errors.demandIndex ? 'border-red-500' : ''}
                    />
                    {errors.demandIndex && <p className="text-sm text-red-500">{errors.demandIndex}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="supplyIndex">Supply Index (%)</Label>
                    <Input
                      id="supplyIndex"
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      placeholder="e.g., 60"
                      value={formData.supplyIndex}
                      onChange={(e) => handleInputChange('supplyIndex', e.target.value)}
                      className={errors.supplyIndex ? 'border-red-500' : ''}
                    />
                    {errors.supplyIndex && <p className="text-sm text-red-500">{errors.supplyIndex}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="competitorPricePerTon">Competitor Price (per ton)</Label>
                    <Input
                      id="competitorPricePerTon"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="e.g., 480"
                      value={formData.competitorPricePerTon}
                      onChange={(e) => handleInputChange('competitorPricePerTon', e.target.value)}
                      className={errors.competitorPricePerTon ? 'border-red-500' : ''}
                    />
                    {errors.competitorPricePerTon && <p className="text-sm text-red-500">{errors.competitorPricePerTon}</p>}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Economic & Environmental Factors
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="economicIndicator">Economic Indicator</Label>
                    <Input
                      id="economicIndicator"
                      type="number"
                      step="0.1"
                      placeholder="e.g., 1.5 (for growth)"
                      value={formData.economicIndicator}
                      onChange={(e) => handleInputChange('economicIndicator', e.target.value)}
                      className={errors.economicIndicator ? 'border-red-500' : ''}
                    />
                    {errors.economicIndicator && <p className="text-sm text-red-500">{errors.economicIndicator}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="weatherImpactScore">Weather Impact Score</Label>
                    <Input
                      id="weatherImpactScore"
                      type="number"
                      step="0.1"
                      placeholder="e.g., -0.5 (for slight negative impact)"
                      value={formData.weatherImpactScore}
                      onChange={(e) => handleInputChange('weatherImpactScore', e.target.value)}
                      className={errors.weatherImpactScore ? 'border-red-500' : ''}
                    />
                    {errors.weatherImpactScore && <p className="text-sm text-red-500">{errors.weatherImpactScore}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="seasonalFactor">Seasonal Factor (0-1)</Label>
                    <Input
                      id="seasonalFactor"
                      type="number"
                      step="0.01"
                      min="0"
                      max="1"
                      placeholder="e.g., 0.8"
                      value={formData.seasonalFactor}
                      onChange={(e) => handleInputChange('seasonalFactor', e.target.value)}
                      className={errors.seasonalFactor ? 'border-red-500' : ''}
                    />
                    {errors.seasonalFactor && <p className="text-sm text-red-500">{errors.seasonalFactor}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="consumerTrendIndex">Consumer Trend Index (%)</Label>
                    <Input
                      id="consumerTrendIndex"
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      placeholder="e.g., 70"
                      value={formData.consumerTrendIndex}
                      onChange={(e) => handleInputChange('consumerTrendIndex', e.target.value)}
                      className={errors.consumerTrendIndex ? 'border-red-500' : ''}
                    />
                    {errors.consumerTrendIndex && <p className="text-sm text-red-500">{errors.consumerTrendIndex}</p>}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="product">Product to Analyze</Label>
                <Select
                  value={formData.product}
                  onValueChange={(value) => handleInputChange('product', value as MarketProduct)}
                >
                  <SelectTrigger className={errors.product ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select a product" />
                  </SelectTrigger>
                  <SelectContent>
                    {MARKET_PRODUCTS.map((product) => (
                      <SelectItem key={product} value={product}>
                        {product.charAt(0).toUpperCase() + product.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.product && <p className="text-sm text-red-500">{errors.product}</p>}
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Analyzing Market...
                  </>
                ) : (
                  'Get Market Price Prediction'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-800">
                <Info className="h-5 w-5" />
                Tips for Accurate Prediction
              </CardTitle>
            </CardHeader>
            <CardContent className="text-blue-700">
              <ul className="space-y-2 text-sm">
                <li>• Use real-time or most recent market data available.</li>
                <li>• Demand and Supply indices should reflect current market dynamics.</li>
                <li>• Consider local and global economic indicators.</li>
                <li>• Account for recent weather events that could impact supply.</li>
                <li>• Seasonal factors are crucial; adjust based on harvest cycles or festive demands.</li>
              </ul>
            </CardContent>
          </Card>

          {results.length > 0 && (
            <Card className="animate-fade-in">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Market Price Prediction
                </CardTitle>
                <CardDescription>
                  Predicted market price for the selected product
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {results.map((result, index) => (
                  <div key={`${result.product}-${index}`} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold capitalize">{result.product}</h3>
                      <Badge variant="default">
                        Predicted Result
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Predicted Price</p>
                        <p className={`text-xl font-bold ${getPriceColor(result.predictedPrice)}`}>
                          ${result.predictedPrice.toFixed(2)} / ton
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Price Status</p>
                        <p className={`text-lg font-semibold ${getPriceColor(result.predictedPrice)}`}>
                          {result.priceStatus}
                        </p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Confidence</p>
                      <div className="flex items-center gap-2">
                        <Progress value={result.confidence * 100} className="flex-1" />
                        <span className="text-sm font-medium">
                          {Math.round(result.confidence * 100)}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Market Insight:</strong> The predicted price for {results[0]?.product}
                    is ${results[0]?.predictedPrice.toFixed(2)}/ton, indicating {results[0]?.priceStatus}.
                    Monitor supply chain disruptions and consumer sentiment for further adjustments.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}