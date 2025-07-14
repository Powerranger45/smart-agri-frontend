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
  Leaf,
  TrendingUp,
  Droplets,
  Thermometer,
  Zap,
  AlertCircle,
  CheckCircle,
  Info,
  Loader2
} from 'lucide-react';
import { cropYieldApi } from '@/services/api';
import { toast } from 'sonner';
import { CropYieldRequest, YieldPredictionRequest, CROP_TYPES, CropType } from '@/types';

interface CropRecommendation {
  crop: CropType;
  predictedYield: number;
  confidence: number;
  status: string;
}

interface ApiResponse {
  prediction: number;
  model: string;
  input_features_used: number;
  crop_type: string;
  status: string;
}

const DEFAULT_FORM_VALUES: CropYieldRequest = {
  soil_pH: 6.5,
  soil_moisture: 50,
  temperature_C: 25,
  rainfall_mm: 1000,
  fertilizer_usage_kg: 100,
  pesticide_usage_kg: 5,
  crop_type: 'wheat',
};

const MAX_CONCURRENT_REQUESTS = 3;

export default function CropRecommendationPage() {
  const [formData, setFormData] = useState<CropYieldRequest>(DEFAULT_FORM_VALUES);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<CropRecommendation[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [controller, setController] = useState<AbortController | null>(null);

  useEffect(() => {
    return () => controller?.abort();
  }, [controller]);

  const handleInputChange = useCallback((field: keyof CropYieldRequest, value: string | number) => {
    const processedValue = field === 'crop_type' ? value : typeof value === 'string' ? parseFloat(value) || 0 : value;
    setFormData(prev => ({ ...prev, [field]: processedValue }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  }, [errors]);

  const validateForm = useCallback((): boolean => {
    const validationRules = [
      { field: 'soil_pH', min: 0, max: 14, message: 'Soil pH should be between 0-14' },
      { field: 'soil_moisture', min: 0, max: 100, message: 'Soil moisture should be between 0-100%' },
      { field: 'temperature_C', min: -10, max: 60, message: 'Temperature should be between -10°C to 60°C' },
      { field: 'rainfall_mm', min: 0, max: 3000, message: 'Rainfall should be between 0-3000 mm' },
      { field: 'fertilizer_usage_kg', min: 0, max: 1000, message: 'Fertilizer usage should be between 0-1000 kg' },
      { field: 'pesticide_usage_kg', min: 0, max: 100, message: 'Pesticide usage should be between 0-100 kg' },
      { field: 'crop_type', required: true, message: 'Please select a crop type' },
    ];

    const newErrors = validationRules.reduce((acc, rule) => {
      const value = formData[rule.field as keyof CropYieldRequest];
      if ((rule.required && !value) || (typeof value === 'number' && (value < rule.min! || value > rule.max!))) {
        acc[rule.field] = rule.message;
      }
      return acc;
    }, {} as Record<string, string>);

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const convertToYieldPredictionRequest = useCallback((
    cropYieldData: CropYieldRequest,
    cropType: CropType
  ): YieldPredictionRequest => ({
    Soil_pH: cropYieldData.soil_pH,
    Soil_Moisture: cropYieldData.soil_moisture,
    Temperature_C: cropYieldData.temperature_C,
    Rainfall_mm: cropYieldData.rainfall_mm,
    Fertilizer_Usage_kg: cropYieldData.fertilizer_usage_kg,
    Pesticide_Usage_kg: cropYieldData.pesticide_usage_kg,
    Crop_Type: cropType,
    crop: cropType,
    area: 1,
    season: 'kharif',
    state: 'Maharashtra',
    humidity: cropYieldData.soil_moisture,
    ph: cropYieldData.soil_pH,
    fertilizer: cropYieldData.fertilizer_usage_kg
  }), []);

  const getYieldStatus = useCallback((yieldValue: number): string => {
    if (yieldValue >= 8) return 'Excellent';
    if (yieldValue >= 5) return 'Good';
    if (yieldValue >= 3) return 'Fair';
    return 'Poor';
  }, []);

  const getYieldColor = useCallback((yieldValue: number): string => {
    if (yieldValue >= 8) return 'text-green-600';
    if (yieldValue >= 5) return 'text-yellow-600';
    return 'text-red-600';
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
      const cropTests = CROP_TYPES.slice(0, 8);
      const successfulPredictions: CropRecommendation[] = [];

      for (let i = 0; i < cropTests.length; i += MAX_CONCURRENT_REQUESTS) {
        const batch = cropTests.slice(i, i + MAX_CONCURRENT_REQUESTS);
        const batchResults = await Promise.all(batch.map(async (crop) => {
          try {
            const testData = convertToYieldPredictionRequest(formData, crop);
            const response = await cropYieldApi.predict(testData, {
              signal: newController.signal
            }) as unknown as ApiResponse;

            if (response?.status !== 'success' || typeof response.prediction === 'undefined') {
              throw new Error('Invalid response format');
            }

            return {
              crop,
              predictedYield: response.prediction,
              confidence: 0.9,
              status: getYieldStatus(response.prediction)
            };
          } catch (error: unknown) {
            if (error instanceof Error && error.name !== 'AbortError') {
              console.error(`Error predicting yield for ${crop}:`, error);
              toast.error(`Error processing ${crop}`, { description: error.message });
            }
            return null;
          }
        }));

        for (const result of batchResults) {
          if (result) successfulPredictions.push(result);
        }
        setResults([...successfulPredictions.sort((a, b) => b.predictedYield - a.predictedYield)]);
      }

      if (successfulPredictions.length > 0) {
        toast.success("Analysis Complete", {
          description: `Found ${successfulPredictions.length} suitable crops`,
        });
      } else {
        toast.warning("No Results", {
          description: "No suitable crops found for these conditions",
        });
      }
    } catch (error: unknown) {
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('Prediction error:', error);
        toast.error("Analysis Failed", { description: error.message });
      } else if (!(error instanceof Error)) {
        console.error('Unknown error type:', error);
        toast.error("Analysis Failed", { description: "An unknown error occurred" });
      }
    } finally {
      setLoading(false);
    }
  }, [formData, validateForm, convertToYieldPredictionRequest, getYieldStatus, controller]);

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
          <Leaf className="h-8 w-8 text-green-600" />
          <h1 className="text-3xl font-bold text-gray-900">Crop Recommendation</h1>
        </div>
        <p className="text-gray-600 max-w-2xl">
          Get AI-powered crop recommendations based on your soil and climate conditions.
          Enter your farm's parameters below to receive personalized yield predictions.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Soil & Climate Data
            </CardTitle>
            <CardDescription>
              Enter your farm's soil and environmental conditions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Leaf className="h-4 w-4" />
                  Soil Conditions
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="soil_ph">Soil pH</Label>
                    <Input
                      id="soil_ph"
                      type="number"
                      step="0.1"
                      min="0"
                      max="14"
                      placeholder="6.0-8.0"
                      value={formData.soil_pH}
                      onChange={(e) => handleInputChange('soil_pH', e.target.value)}
                      className={errors.soil_pH ? 'border-red-500' : ''}
                    />
                    {errors.soil_pH && <p className="text-sm text-red-500">{errors.soil_pH}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="soil_moisture">Soil Moisture (%)</Label>
                    <Input
                      id="soil_moisture"
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      placeholder="40-80"
                      value={formData.soil_moisture}
                      onChange={(e) => handleInputChange('soil_moisture', e.target.value)}
                      className={errors.soil_moisture ? 'border-red-500' : ''}
                    />
                    {errors.soil_moisture && <p className="text-sm text-red-500">{errors.soil_moisture}</p>}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Thermometer className="h-4 w-4" />
                  Climate Conditions
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="temperature">Temperature (°C)</Label>
                    <Input
                      id="temperature"
                      type="number"
                      step="0.1"
                      min="-10"
                      max="60"
                      placeholder="20-35"
                      value={formData.temperature_C}
                      onChange={(e) => handleInputChange('temperature_C', e.target.value)}
                      className={errors.temperature_C ? 'border-red-500' : ''}
                    />
                    {errors.temperature_C && <p className="text-sm text-red-500">{errors.temperature_C}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rainfall">Rainfall (mm)</Label>
                    <Input
                      id="rainfall"
                      type="number"
                      step="0.1"
                      min="0"
                      max="3000"
                      placeholder="200-2000"
                      value={formData.rainfall_mm}
                      onChange={(e) => handleInputChange('rainfall_mm', e.target.value)}
                      className={errors.rainfall_mm ? 'border-red-500' : ''}
                    />
                    {errors.rainfall_mm && <p className="text-sm text-red-500">{errors.rainfall_mm}</p>}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Droplets className="h-4 w-4" />
                  Farming Practices
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fertilizer">Fertilizer Usage (kg)</Label>
                    <Input
                      id="fertilizer"
                      type="number"
                      step="0.1"
                      min="0"
                      max="1000"
                      placeholder="50-500"
                      value={formData.fertilizer_usage_kg}
                      onChange={(e) => handleInputChange('fertilizer_usage_kg', e.target.value)}
                      className={errors.fertilizer_usage_kg ? 'border-red-500' : ''}
                    />
                    {errors.fertilizer_usage_kg && <p className="text-sm text-red-500">{errors.fertilizer_usage_kg}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pesticide">Pesticide Usage (kg)</Label>
                    <Input
                      id="pesticide"
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      placeholder="0-50"
                      value={formData.pesticide_usage_kg}
                      onChange={(e) => handleInputChange('pesticide_usage_kg', e.target.value)}
                      className={errors.pesticide_usage_kg ? 'border-red-500' : ''}
                    />
                    {errors.pesticide_usage_kg && <p className="text-sm text-red-500">{errors.pesticide_usage_kg}</p>}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="crop_type">Test Crop Type</Label>
                <Select
                  value={formData.crop_type}
                  onValueChange={(value) => handleInputChange('crop_type', value)}
                >
                  <SelectTrigger className={errors.crop_type ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select a crop to test" />
                  </SelectTrigger>
                  <SelectContent>
                    {CROP_TYPES.map((crop) => (
                      <SelectItem key={crop} value={crop}>
                        {crop.charAt(0).toUpperCase() + crop.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.crop_type && <p className="text-sm text-red-500">{errors.crop_type}</p>}
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Analyzing Crops...
                  </>
                ) : (
                  'Get Crop Recommendations'
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
                Tips for Better Results
              </CardTitle>
            </CardHeader>
            <CardContent className="text-blue-700">
              <ul className="space-y-2 text-sm">
                <li>• Ensure soil test results are recent (within 6 months)</li>
                <li>• Use average temperature for the growing season</li>
                <li>• Include both current and expected rainfall data</li>
                <li>• Consider your local climate patterns and seasonal variations</li>
                <li>• Adjust fertilizer and pesticide usage based on crop requirements</li>
              </ul>
            </CardContent>
          </Card>

          {results.length > 0 && (
            <Card className="animate-fade-in">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Crop Recommendations
                </CardTitle>
                <CardDescription>
                  Predicted yields for different crops based on your conditions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {results.map((result, index) => (
                  <div key={`${result.crop}-${index}`} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold capitalize">{result.crop}</h3>
                      <Badge variant={index === 0 ? "default" : "secondary"}>
                        {index === 0 ? "Best Choice" : `#${index + 1}`}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Predicted Yield</p>
                        <p className={`text-xl font-bold ${getYieldColor(result.predictedYield)}`}>
                          {result.predictedYield.toFixed(1)} tons/hectare
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Yield Status</p>
                        <p className={`text-lg font-semibold ${getYieldColor(result.predictedYield)}`}>
                          {result.status}
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
                    <strong>Recommendation:</strong> Based on your soil conditions, {results[0]?.crop}
                    shows the highest yield potential. Consider soil amendments if pH is outside optimal range (6.0-7.5).
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