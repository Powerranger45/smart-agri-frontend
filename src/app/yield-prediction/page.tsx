'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { YieldPredictionRequest, YieldPredictionResponse } from '@/types';
import { yieldPredictionApi } from '@/services/api';

export default function YieldPredictionPage() {
  const [formData, setFormData] = useState<YieldPredictionRequest>({
    crop: '',
    area: 0,
    season: '',
    state: '',
    rainfall: 0,
    temperature: 0,
    humidity: 0,
    ph: 0,
    fertilizer: 0
  });
  const [prediction, setPrediction] = useState<YieldPredictionResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (field: keyof YieldPredictionRequest, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Fixed: Extract the data from the AxiosResponse
const result = await yieldPredictionApi.predict(formData);
      setPrediction(result);
      toast.success("Prediction Generated", {
        description: "Yield prediction has been calculated successfully.",
      });
    } catch (error) {
      console.error('Error predicting yield:', error);
      toast.error("Error", {
        description: "Failed to generate yield prediction. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const crops = [
    'Rice', 'Wheat', 'Corn', 'Barley', 'Soybean', 'Cotton', 'Sugarcane',
    'Potato', 'Tomato', 'Onion', 'Groundnut', 'Sunflower', 'Coconut'
  ];

  const seasons = [
    'Kharif', 'Rabi', 'Zaid', 'Summer', 'Winter', 'Monsoon'
  ];

  const states = [
    'Andhra Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Gujarat', 'Haryana',
    'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh',
    'Maharashtra', 'Odisha', 'Punjab', 'Rajasthan', 'Tamil Nadu', 'Telangana',
    'Uttar Pradesh', 'West Bengal', 'Uttarakhand'
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="ag-hero-section">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Crop Yield Prediction</h1>
            <p className="text-xl text-green-100">
              Predict your crop yield using advanced machine learning models
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Input Form */}
            <Card className="ag-card">
              <CardHeader>
                <CardTitle className="text-2xl text-green-700 dark:text-green-400">
                  Enter Field Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="ag-form-grid">
                    <div>
                      <Label htmlFor="crop" className="ag-label">Crop Type</Label>
                      <Select
                        value={formData.crop}
                        onValueChange={(value) => handleInputChange('crop', value)}
                      >
                        <SelectTrigger className="ag-select">
                          <SelectValue placeholder="Select crop" />
                        </SelectTrigger>
                        <SelectContent>
                          {crops.map((crop) => (
                            <SelectItem key={crop} value={crop}>
                              {crop}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="area" className="ag-label">Area (hectares)</Label>
                      <Input
                        id="area"
                        type="number"
                        step="0.1"
                        value={formData.area}
                        onChange={(e) => handleInputChange('area', parseFloat(e.target.value))}
                        className="ag-input"
                        placeholder="Enter area in hectares"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="season" className="ag-label">Season</Label>
                      <Select
                        value={formData.season}
                        onValueChange={(value) => handleInputChange('season', value)}
                      >
                        <SelectTrigger className="ag-select">
                          <SelectValue placeholder="Select season" />
                        </SelectTrigger>
                        <SelectContent>
                          {seasons.map((season) => (
                            <SelectItem key={season} value={season}>
                              {season}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="state" className="ag-label">State</Label>
                      <Select
                        value={formData.state}
                        onValueChange={(value) => handleInputChange('state', value)}
                      >
                        <SelectTrigger className="ag-select">
                          <SelectValue placeholder="Select state" />
                        </SelectTrigger>
                        <SelectContent>
                          {states.map((state) => (
                            <SelectItem key={state} value={state}>
                              {state}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="rainfall" className="ag-label">Rainfall (mm)</Label>
                      <Input
                        id="rainfall"
                        type="number"
                        step="0.1"
                        value={formData.rainfall}
                        onChange={(e) => handleInputChange('rainfall', parseFloat(e.target.value))}
                        className="ag-input"
                        placeholder="Enter rainfall in mm"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="temperature" className="ag-label">Temperature (°C)</Label>
                      <Input
                        id="temperature"
                        type="number"
                        step="0.1"
                        value={formData.temperature}
                        onChange={(e) => handleInputChange('temperature', parseFloat(e.target.value))}
                        className="ag-input"
                        placeholder="Enter temperature in °C"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="humidity" className="ag-label">Humidity (%)</Label>
                      <Input
                        id="humidity"
                        type="number"
                        step="0.1"
                        value={formData.humidity}
                        onChange={(e) => handleInputChange('humidity', parseFloat(e.target.value))}
                        className="ag-input"
                        placeholder="Enter humidity percentage"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="ph" className="ag-label">Soil pH</Label>
                      <Input
                        id="ph"
                        type="number"
                        step="0.1"
                        value={formData.ph}
                        onChange={(e) => handleInputChange('ph', parseFloat(e.target.value))}
                        className="ag-input"
                        placeholder="Enter soil pH value"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="fertilizer" className="ag-label">Fertilizer (kg/hectare)</Label>
                      <Input
                        id="fertilizer"
                        type="number"
                        step="0.1"
                        value={formData.fertilizer}
                        onChange={(e) => handleInputChange('fertilizer', parseFloat(e.target.value))}
                        className="ag-input"
                        placeholder="Enter fertilizer amount"
                        required
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full ag-button"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Predicting...' : 'Predict Yield'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Results */}
            <div className="space-y-6">
              {prediction && (
                <Card className="ag-results-section">
                  <CardHeader>
                    <CardTitle className="text-2xl text-blue-700 dark:text-blue-400">
                      Yield Prediction Results
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                          Predicted Yield
                        </h3>
                        <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                          {prediction.predicted_yield.toFixed(2)} tonnes/hectare
                        </p>
                      </div>

                      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                          Total Production
                        </h3>
                        <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                          {(prediction.predicted_yield * formData.area).toFixed(2)} tonnes
                        </p>
                      </div>
                    </div>

                    {prediction.confidence !== undefined && (
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                          Confidence Level
                        </h3>
                        <div className="flex items-center space-x-2">
                          <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${prediction.confidence * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {(prediction.confidence * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    )}

                    {prediction.factors && (
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                          Key Influencing Factors
                        </h3>
                        <div className="space-y-2">
                          {prediction.factors.map((factor: { factor: string; impact: number }, index: number) => (
                            <div key={index} className="flex justify-between items-center">
                              <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                                {factor.factor}
                              </span>
                              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                {factor.impact}%
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {prediction.recommendations && (
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                          Recommendations
                        </h3>
                        <ul className="space-y-2">
                          {prediction.recommendations.map((rec: string, index: number) => (
                            <li key={index} className="flex items-start space-x-2">
                              <span className="text-green-500 mt-1">•</span>
                              <span className="text-sm text-gray-700 dark:text-gray-300">
                                {rec}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Information Panel */}
              <Card className="ag-card">
                <CardHeader>
                  <CardTitle className="text-xl text-green-700 dark:text-green-400">
                    How It Works
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                        <span className="text-green-600 dark:text-green-400 font-bold">1</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                          Data Collection
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Our model analyzes environmental and agricultural parameters
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                        <span className="text-green-600 dark:text-green-400 font-bold">2</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                          Machine Learning
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Advanced algorithms process historical data and current conditions
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                        <span className="text-green-600 dark:text-green-400 font-bold">3</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                          Prediction
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Get accurate yield predictions with confidence levels
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
