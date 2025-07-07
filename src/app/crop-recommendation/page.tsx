'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
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
import { cropRecommendationApi } from '@/services/api';
import { CropRecommendationRequest, CropRecommendationResponse } from '@/types';
import { toast } from 'sonner';


export default function CropRecommendationPage() {
  const [formData, setFormData] = useState<CropRecommendationRequest>({
    nitrogen: 0,
    phosphorus: 0,
    potassium: 0,
    temperature: 0,
    humidity: 0,
    ph: 0,
    rainfall: 0,
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CropRecommendationResponse | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: keyof CropRecommendationRequest, value: string) => {
    const numValue = parseFloat(value) || 0;
    setFormData(prev => ({ ...prev, [field]: numValue }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (formData.nitrogen < 0 || formData.nitrogen > 200) {
      newErrors.nitrogen = 'Nitrogen should be between 0-200 kg/ha';
    }
    if (formData.phosphorus < 0 || formData.phosphorus > 200) {
      newErrors.phosphorus = 'Phosphorus should be between 0-200 kg/ha';
    }
    if (formData.potassium < 0 || formData.potassium > 200) {
      newErrors.potassium = 'Potassium should be between 0-200 kg/ha';
    }
    if (formData.temperature < -10 || formData.temperature > 60) {
      newErrors.temperature = 'Temperature should be between -10°C to 60°C';
    }
    if (formData.humidity < 0 || formData.humidity > 100) {
      newErrors.humidity = 'Humidity should be between 0-100%';
    }
    if (formData.ph < 0 || formData.ph > 14) {
      newErrors.ph = 'pH should be between 0-14';
    }
    if (formData.rainfall < 0 || formData.rainfall > 3000) {
      newErrors.rainfall = 'Rainfall should be between 0-3000 mm';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

if (!validateForm()) {
  toast("Validation Error", {
    description: "Please correct the errors in the form",
  });
  return;
}

setLoading(true);
setResult(null);

try {
  const response = await cropRecommendationApi.predict(formData);
  setResult(response);
  toast("Success!", {
    description: "Crop recommendation generated successfully",
  });
} catch (error) {
  toast("Error", {
    description: error instanceof Error ? error.message : "Failed to get recommendation",
  });
} finally {
  setLoading(false);
}

  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getSoilHealthColor = (health: string) => {
    switch (health.toLowerCase()) {
      case 'excellent': return 'bg-green-100 text-green-800';
      case 'good': return 'bg-blue-100 text-blue-800';
      case 'fair': return 'bg-yellow-100 text-yellow-800';
      case 'poor': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
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
          Enter your farm's parameters below to receive personalized suggestions.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Soil & Climate Data
            </CardTitle>
            <CardDescription>
              Enter your farm's soil nutrients and environmental conditions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Soil Nutrients */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Leaf className="h-4 w-4" />
                  Soil Nutrients (kg/ha)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nitrogen">Nitrogen (N)</Label>
                    <Input
                      id="nitrogen"
                      type="number"
                      step="0.1"
                      placeholder="0-200"
                      value={formData.nitrogen || ''}
                      onChange={(e) => handleInputChange('nitrogen', e.target.value)}
                      className={errors.nitrogen ? 'border-red-500' : ''}
                    />
                    {errors.nitrogen && (
                      <p className="text-sm text-red-500">{errors.nitrogen}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phosphorus">Phosphorus (P)</Label>
                    <Input
                      id="phosphorus"
                      type="number"
                      step="0.1"
                      placeholder="0-200"
                      value={formData.phosphorus || ''}
                      onChange={(e) => handleInputChange('phosphorus', e.target.value)}
                      className={errors.phosphorus ? 'border-red-500' : ''}
                    />
                    {errors.phosphorus && (
                      <p className="text-sm text-red-500">{errors.phosphorus}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="potassium">Potassium (K)</Label>
                    <Input
                      id="potassium"
                      type="number"
                      step="0.1"
                      placeholder="0-200"
                      value={formData.potassium || ''}
                      onChange={(e) => handleInputChange('potassium', e.target.value)}
                      className={errors.potassium ? 'border-red-500' : ''}
                    />
                    {errors.potassium && (
                      <p className="text-sm text-red-500">{errors.potassium}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Climate Conditions */}
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
                      placeholder="20-35"
                      value={formData.temperature || ''}
                      onChange={(e) => handleInputChange('temperature', e.target.value)}
                      className={errors.temperature ? 'border-red-500' : ''}
                    />
                    {errors.temperature && (
                      <p className="text-sm text-red-500">{errors.temperature}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="humidity">Humidity (%)</Label>
                    <Input
                      id="humidity"
                      type="number"
                      step="0.1"
                      placeholder="40-80"
                      value={formData.humidity || ''}
                      onChange={(e) => handleInputChange('humidity', e.target.value)}
                      className={errors.humidity ? 'border-red-500' : ''}
                    />
                    {errors.humidity && (
                      <p className="text-sm text-red-500">{errors.humidity}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ph">Soil pH</Label>
                    <Input
                      id="ph"
                      type="number"
                      step="0.1"
                      placeholder="6.0-8.0"
                      value={formData.ph || ''}
                      onChange={(e) => handleInputChange('ph', e.target.value)}
                      className={errors.ph ? 'border-red-500' : ''}
                    />
                    {errors.ph && (
                      <p className="text-sm text-red-500">{errors.ph}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rainfall">Rainfall (mm)</Label>
                    <Input
                      id="rainfall"
                      type="number"
                      step="0.1"
                      placeholder="200-2000"
                      value={formData.rainfall || ''}
                      onChange={(e) => handleInputChange('rainfall', e.target.value)}
                      className={errors.rainfall ? 'border-red-500' : ''}
                    />
                    {errors.rainfall && (
                      <p className="text-sm text-red-500">{errors.rainfall}</p>
                    )}
                  </div>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  'Get Recommendation'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Results */}
        <div className="space-y-6">
          {/* Tips Card */}
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
                <li>• Use average temperature and humidity for the growing season</li>
                <li>• Include both current and expected rainfall data</li>
                <li>• Consider your local climate patterns and seasonal variations</li>
              </ul>
            </CardContent>
          </Card>

          {/* Results Display */}
          {result && (
            <Card className="animate-fade-in">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Recommendation Results
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Recommended Crop */}
                <div className="text-center p-6 bg-green-50 rounded-lg">
                  <h3 className="text-2xl font-bold text-green-800 mb-2">
                    {result.recommended_crop.toUpperCase()}
                  </h3>
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4" />
                    <span className={`font-semibold ${getConfidenceColor(result.confidence)}`}>
                      {Math.round(result.confidence * 100)}% Confidence
                    </span>
                  </div>
                  <Progress value={result.confidence * 100} className="w-full max-w-xs mx-auto" />
                </div>

                {/* Soil Health */}
                <div>
                  <h4 className="font-semibold mb-2">Soil Health Status</h4>
                  <Badge className={getSoilHealthColor(result.soil_health)}>
                    {result.soil_health}
                  </Badge>
                </div>

                {/* Alternative Crops */}
                {result.alternative_crops.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Alternative Crops</h4>
                    <div className="flex flex-wrap gap-2">
                      {result.alternative_crops.map((crop, index) => (
                        <Badge key={index} variant="secondary">
                          {crop}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                <div>
                  <h4 className="font-semibold mb-2">Recommendations</h4>
                  <div className="space-y-2">
                    {result.recommendations.map((rec, index) => (
                      <Alert key={index}>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{rec}</AlertDescription>
                      </Alert>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
