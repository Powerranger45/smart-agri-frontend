'use client';

import { useState, useCallback, JSX } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  ArrowLeft,
  Leaf,
  Droplets,
  Thermometer,
  Zap,
  AlertCircle,
  CheckCircle,
  Info,
  Loader2,
  Globe,
  BarChart,
  Droplet,
  Activity,
  Sprout
} from 'lucide-react';
import { sustainabilityApi } from '@/services/api';
import { toast } from 'sonner';
import { SustainabilityRequest, SUSTAINABILITY_CROP_TYPES, SustainabilityCropType } from '@/types';

// Custom Progress Bar Component
const CustomProgressBar = ({ 
  value, 
  max = 100,
  color = 'bg-blue-500',
  height = 'h-2'
}: {
  value: number;
  max?: number;
  color?: string;
  height?: string;
}) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  
  return (
    <div className={`w-full bg-gray-200 rounded-full ${height} overflow-hidden`}>
      <div 
        className={`${color} ${height} rounded-full transition-all duration-500`} 
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
};

const DEFAULT_FORM_VALUES: SustainabilityRequest = {
  soil_pH: 6.5,
  soil_moisture: 50,
  temperature_C: 25,
  rainfall_mm: 1000,
  fertilizer_usage_kg: 100,
  pesticide_usage_kg: 5,
  crop_yield_ton: 3,
  crop_type: 'wheat',
};

const RATING_COLORS: Record<string, string> = {
  'excellent': 'bg-green-100 text-green-800',
  'good': 'bg-blue-100 text-blue-800',
  'fair': 'bg-yellow-100 text-yellow-800',
  'poor': 'bg-red-100 text-red-800',
};

const RATING_ICONS: Record<string, JSX.Element> = {
  'excellent': <CheckCircle className="h-5 w-5 text-green-600" />,
  'good': <Activity className="h-5 w-5 text-blue-600" />,
  'fair': <AlertCircle className="h-5 w-5 text-yellow-600" />,
  'poor': <AlertCircle className="h-5 w-5 text-red-600" />,
};

export default function SustainabilityPage() {
  const [formData, setFormData] = useState<SustainabilityRequest>(DEFAULT_FORM_VALUES);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const handleInputChange = (field: keyof SustainabilityRequest, value: string | number) => {
    const processedValue = field === 'crop_type' 
      ? value 
      : typeof value === 'string' 
        ? parseFloat(value) || 0 
        : value;
    
    setFormData(prev => ({ ...prev, [field]: processedValue }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const validateForm = useCallback((): boolean => {
    const validationRules = [
      { field: 'soil_pH', min: 0, max: 14, message: 'Soil pH should be between 0-14' },
      { field: 'soil_moisture', min: 0, max: 100, message: 'Soil moisture should be between 0-100%' },
      { field: 'temperature_C', min: -10, max: 60, message: 'Temperature should be between -10°C to 60°C' },
      { field: 'rainfall_mm', min: 0, max: 3000, message: 'Rainfall should be between 0-3000 mm' },
      { field: 'fertilizer_usage_kg', min: 0, max: 1000, message: 'Fertilizer usage should be between 0-1000 kg' },
      { field: 'pesticide_usage_kg', min: 0, max: 100, message: 'Pesticide usage should be between 0-100 kg' },
      { field: 'crop_yield_ton', min: 0, max: 20, message: 'Crop yield should be between 0-20 tons/ha' },
      { field: 'crop_type', required: true, message: 'Please select a crop type' },
    ];

    const newErrors = validationRules.reduce((acc, rule) => {
      const value = formData[rule.field as keyof SustainabilityRequest];
      if ((rule.required && !value) || (typeof value === 'number' && (value < rule.min! || value > rule.max!))) {
        acc[rule.field] = rule.message;
      }
      return acc;
    }, {} as Record<string, string>);

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // Generate improvement suggestions based on input data
  const generateImprovementSuggestions = (data: SustainabilityRequest, score: number) => {
    const suggestions = [];
    
    if (data.fertilizer_usage_kg > 200) {
      suggestions.push({
        category: "Fertilizer Management",
        suggestion: "Consider reducing fertilizer usage by implementing precision agriculture techniques and soil testing."
      });
    }
    
    if (data.pesticide_usage_kg > 10) {
      suggestions.push({
        category: "Pest Management",
        suggestion: "Explore integrated pest management (IPM) strategies to reduce pesticide dependency."
      });
    }
    
    if (data.soil_pH < 6.0 || data.soil_pH > 7.5) {
      suggestions.push({
        category: "Soil Health",
        suggestion: "Adjust soil pH through lime application or organic matter incorporation for optimal crop growth."
      });
    }
    
    if (data.soil_moisture < 40) {
      suggestions.push({
        category: "Water Management",
        suggestion: "Improve water retention through cover cropping, mulching, and organic matter addition."
      });
    }
    
    if (score < 60) {
      suggestions.push({
        category: "Overall Sustainability",
        suggestion: "Consider adopting regenerative agriculture practices like crop rotation and reduced tillage."
      });
    }
    
    return suggestions;
  };

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error("Please correct the form errors");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await sustainabilityApi.predict(formData);
      
      console.log('Raw API Response:', response);
      
      // Handle different possible response structures
      let predictionValue = 0;
      let modelName = 'Sustainability Assessment';
      let cropType = formData.crop_type;
      let status = 'success';
      let inputFeaturesUsed = 25;
      
      // Try to extract prediction value from various possible structures
      if (typeof response === 'number') {
        predictionValue = response;
      } else if (response && typeof response === 'object') {
        // Try different possible field names
        predictionValue = response.prediction || 
                         response.predicted_value || 
                         response.sustainability_score || 
                         response.score || 
                         0;
        
        modelName = response.model || response.model_name || 'Sustainability Assessment';
        cropType = response.crop_type || formData.crop_type;
        status = response.status || 'success';
        inputFeaturesUsed = response.input_features_used || response.features_used || 25;
      }
      
      // Ensure we have a valid number
      if (typeof predictionValue !== 'number' || isNaN(predictionValue)) {
        predictionValue = 0;
      }
      
      console.log('Extracted prediction value:', predictionValue);
      
      // Convert prediction to a 0-100 scale
      // Assuming prediction values are typically in range 0-1000 for sustainability
      const normalizedScore = Math.min(100, Math.max(0, (predictionValue / 1000) * 100));
      
      // Calculate rating based on normalized score
      let rating = 'poor';
      if (normalizedScore >= 80) rating = 'excellent';
      else if (normalizedScore >= 60) rating = 'good';
      else if (normalizedScore >= 40) rating = 'fair';
      
      // Create mock impact breakdown based on prediction
      const impactBreakdown = {
        carbonFootprint: Math.max(0, 800 - (predictionValue * 0.8)),
        waterEfficiency: Math.min(100, normalizedScore + 10),
        soilHealthImpact: Math.min(10, normalizedScore / 10),
        biodiversityScore: Math.min(10, normalizedScore / 12)
      };
      
      // Generate improvement suggestions
      const improvementSuggestions = generateImprovementSuggestions(formData, normalizedScore);
      
      // Create a comprehensive result object
      const processedResult = {
        prediction: predictionValue,
        model: modelName,
        sustainabilityScore: normalizedScore,
        originalPrediction: predictionValue,
        rating,
        color: RATING_COLORS[rating] || 'bg-gray-100 text-gray-800',
        cropType,
        status,
        inputFeaturesUsed,
        impactBreakdown,
        improvementSuggestions,
        // Additional metadata
        timestamp: new Date().toISOString(),
        formData: { ...formData }
      };
      
      console.log('Processed result:', processedResult);
      
      setResult(processedResult);
      toast.success("Assessment Complete! Your sustainability assessment is ready");
      
    } catch (error: unknown) {
      console.error('Sustainability prediction error:', error);
      
      // Create a fallback result with error information
      const fallbackResult = {
        prediction: 0,
        model: 'Error - Using Fallback',
        sustainabilityScore: 0,
        originalPrediction: 0,
        rating: 'poor',
        color: RATING_COLORS['poor'],
        cropType: formData.crop_type,
        status: 'error',
        inputFeaturesUsed: 0,
        impactBreakdown: {
          carbonFootprint: 800,
          waterEfficiency: 20,
          soilHealthImpact: 2,
          biodiversityScore: 2
        },
        improvementSuggestions: [{
          category: "System Error",
          suggestion: "There was an issue with the assessment. Please try again or contact support."
        }],
        error: error instanceof Error ? error.message : "An unknown error occurred"
      };
      
      setResult(fallbackResult);
      
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      toast.error(`Analysis Failed: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  }, [formData, validateForm]);

  const getProgressColor = (value: number) => {
    if (value >= 80) return 'bg-green-500';
    if (value >= 60) return 'bg-blue-500';
    if (value >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="min-h-screen container mx-auto px-4 py-8 bg-gradient-to-b from-green-50 to-white">
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
          <Globe className="h-8 w-8 text-green-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Farm Sustainability Assessment</h1>
            <p className="text-gray-600 mt-2">
              Evaluate your farm's environmental impact and get actionable insights for improvement
            </p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Form */}
        <Card className="border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart className="h-5 w-5" />
              Farm Data Input
            </CardTitle>
            <CardDescription>
              Enter your farm's operational data to assess sustainability
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Soil and Water */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Droplet className="h-4 w-4" />
                  Soil & Water
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

              {/* Climate */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Thermometer className="h-4 w-4" />
                  Climate
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

              {/* Inputs */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Farm Inputs
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fertilizer">Fertilizer Usage (kg/ha)</Label>
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
                    <Label htmlFor="pesticide">Pesticide Usage (kg/ha)</Label>
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

              {/* Crop Data */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Sprout className="h-4 w-4" />
                  Crop Data
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="crop_yield">Crop Yield (tons/ha)</Label>
                    <Input
                      id="crop_yield"
                      type="number"
                      step="0.1"
                      min="0"
                      max="20"
                      placeholder="2-10"
                      value={formData.crop_yield_ton}
                      onChange={(e) => handleInputChange('crop_yield_ton', e.target.value)}
                      className={errors.crop_yield_ton ? 'border-red-500' : ''}
                    />
                    {errors.crop_yield_ton && <p className="text-sm text-red-500">{errors.crop_yield_ton}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="crop_type">Crop Type</Label>
                    <Select
                      value={formData.crop_type}
                      onValueChange={(value) => handleInputChange('crop_type', value)}
                    >
                      <SelectTrigger className={errors.crop_type ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Select a crop" />
                      </SelectTrigger>
                      <SelectContent>
                        {SUSTAINABILITY_CROP_TYPES.map((crop) => (
                          <SelectItem key={crop} value={crop}>
                            {crop.charAt(0).toUpperCase() + crop.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.crop_type && <p className="text-sm text-red-500">{errors.crop_type}</p>}
                  </div>
                </div>
              </div>

              <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Assessing Sustainability...
                  </>
                ) : (
                  'Assess Sustainability'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Results Section */}
        <div className="space-y-6">
          {/* Tips Card */}
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-800">
                <Info className="h-5 w-5" />
                Sustainability Tips
              </CardTitle>
            </CardHeader>
            <CardContent className="text-blue-700">
              <ul className="space-y-2 text-sm">
                <li>• Use cover crops to improve soil health and prevent erosion</li>
                <li>• Implement water-efficient irrigation systems</li>
                <li>• Rotate crops to maintain soil fertility and reduce pests</li>
                <li>• Reduce tillage to preserve soil structure</li>
                <li>• Use organic fertilizers to minimize chemical runoff</li>
              </ul>
            </CardContent>
          </Card>

          {/* Results Display */}
          {result && (
            <Card className="animate-fade-in border-green-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-green-600" />
                  Sustainability Assessment Results
                </CardTitle>
                <CardDescription>
                  Your farm's environmental impact analysis
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Error Display */}
                {result.error && (
                  <Alert className="border-red-200 bg-red-50">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-red-700">
                      <strong>Error:</strong> {result.error}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Overall Rating */}
                <div className="text-center p-6 bg-green-50 rounded-lg">
                  <h3 className="text-2xl font-bold text-gray-800 mb-4">Sustainability Score</h3>
                  <div className="text-5xl font-bold text-green-600 mb-2">
                    {Math.round(result.sustainabilityScore || 0)}/100
                  </div>
                  <div className="mb-4">
                    <Badge className={result.color}>
                      {RATING_ICONS[result.rating]}
                      <span className="ml-2">{(result.rating || 'unknown').toUpperCase()}</span>
                    </Badge>
                  </div>
                  <CustomProgressBar 
                    value={result.sustainabilityScore || 0} 
                    color={getProgressColor(result.sustainabilityScore || 0)}
                    height="h-3"
                  />
                  <div className="mt-3 text-sm text-gray-600 space-y-1">
                    <p>Raw Prediction: {Number(result.originalPrediction || 0).toFixed(2)}</p>
                    <p>Model: {result.model}</p>
                    <p>Crop: {result.cropType} | Status: {result.status}</p>
                    <p>Features Used: {result.inputFeaturesUsed}</p>
                  </div>
                </div>

                {/* Impact Breakdown */}
                {result.impactBreakdown && (
                  <div>
                    <h4 className="font-semibold mb-4 flex items-center gap-2">
                      <BarChart className="h-5 w-5" />
                      Impact Breakdown
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 border rounded-lg">
                        <div className="flex justify-between mb-2">
                          <span className="font-medium">Carbon Footprint</span>
                          <span className="font-bold">{Number(result.impactBreakdown.carbonFootprint || 0).toFixed(1)} kg CO₂/ha</span>
                        </div>
                        <CustomProgressBar 
                          value={100 - ((result.impactBreakdown.carbonFootprint || 0) / 1000 * 100)} 
                          color="bg-blue-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">Lower is better</p>
                      </div>
                      
                      <div className="p-4 border rounded-lg">
                        <div className="flex justify-between mb-2">
                          <span className="font-medium">Water Efficiency</span>
                          <span className="font-bold">{Number(result.impactBreakdown.waterEfficiency || 0).toFixed(1)}%</span>
                        </div>
                        <CustomProgressBar 
                          value={result.impactBreakdown.waterEfficiency || 0} 
                          color="bg-green-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">Higher is better</p>
                      </div>
                      
                      <div className="p-4 border rounded-lg">
                        <div className="flex justify-between mb-2">
                          <span className="font-medium">Soil Health</span>
                          <span className="font-bold">{Number(result.impactBreakdown.soilHealthImpact || 0).toFixed(1)}/10</span>
                        </div>
                        <CustomProgressBar 
                          value={(result.impactBreakdown.soilHealthImpact || 0) * 10} 
                          color="bg-yellow-500"
                        />
                      </div>
                      
                      <div className="p-4 border rounded-lg">
                        <div className="flex justify-between mb-2">
                          <span className="font-medium">Biodiversity</span>
                          <span className="font-bold">{Number(result.impactBreakdown.biodiversityScore || 0).toFixed(1)}/10</span>
                        </div>
                        <CustomProgressBar 
                          value={(result.impactBreakdown.biodiversityScore || 0) * 10} 
                          color="bg-purple-500"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Improvement Suggestions */}
                {result.improvementSuggestions && result.improvementSuggestions.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-4 flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      Improvement Suggestions
                    </h4>
                    <div className="space-y-3">
                      {result.improvementSuggestions.map((suggestion: any, index: number) => (
                        <Alert key={index}>
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            <strong>{suggestion.category}:</strong> {suggestion.suggestion}
                          </AlertDescription>
                        </Alert>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}