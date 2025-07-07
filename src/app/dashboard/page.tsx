'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { DashboardData } from '@/types';
import { dashboardApi } from '@/services/api';
export default function DashboardPage() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState('30d');

  useEffect(() => {
    loadDashboardData();
  }, [selectedTimeRange]);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const data = await dashboardApi.getData(selectedTimeRange);
      setDashboardData(data);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast("Failed to load dashboard data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const timeRanges = [
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' },
    { value: '90d', label: 'Last 3 Months' },
    { value: '1y', label: 'Last Year' }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="ag-loading h-64 w-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="ag-hero-section">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Agricultural Dashboard</h1>
              <p className="text-green-100">
                Monitor your agricultural insights and analytics
              </p>
            </div>
            <div className="mt-4 md:mt-0">
              <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
                <SelectTrigger className="w-48 bg-white dark:bg-gray-800">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {timeRanges.map((range) => (
                    <SelectItem key={range.value} value={range.value}>
                      {range.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {dashboardData && (
          <div className="space-y-8">
            {/* Key Metrics */}
            <div className="ag-stats-grid">
              <Card className="ag-metric-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Total Predictions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {dashboardData.totalPredictions}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    +{dashboardData.predictionGrowth}% from last period
                  </p>
                </CardContent>
              </Card>

              <Card className="ag-metric-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Avg. Yield Prediction
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {dashboardData.avgYieldPrediction.toFixed(1)} t/ha
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {dashboardData.yieldTrend > 0 ? '+' : ''}{dashboardData.yieldTrend.toFixed(1)}% from last period
                  </p>
                </CardContent>
              </Card>

              <Card className="ag-metric-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Sustainability Score
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                    {dashboardData.sustainabilityScore.toFixed(1)}/10
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {dashboardData.sustainabilityTrend > 0 ? '+' : ''}{dashboardData.sustainabilityTrend.toFixed(1)}% improvement
                  </p>
                </CardContent>
              </Card>

              <Card className="ag-metric-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Active Farms
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {dashboardData.activeFarms}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {dashboardData.farmGrowth > 0 ? '+' : ''}{dashboardData.farmGrowth}% new farms
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Charts and Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Crop Distribution */}
              <Card className="ag-card">
                <CardHeader>
                  <CardTitle className="text-xl text-gray-800 dark:text-gray-200">
                    Crop Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {dashboardData.cropDistribution.map((crop: any, index: number) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: crop.color }}
                          ></div>
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {crop.crop}
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold text-gray-900 dark:text-gray-100">
                            {crop.percentage}%
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {crop.count} farms
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card className="ag-card">
                <CardHeader>
                  <CardTitle className="text-xl text-gray-800 dark:text-gray-200">
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {dashboardData.recentActivity.map((activity: any, index: any) => (
                      <div key={index} className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            {activity.description}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {activity.timestamp}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Yield Trends */}
            <Card className="ag-card">
              <CardHeader>
                <CardTitle className="text-xl text-gray-800 dark:text-gray-200">
                  Yield Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {dashboardData.yieldTrends.map((trend:any, index:any) => (
                    <div key={index} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                        {trend.crop}
                      </h4>
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">
                        {trend.yield.toFixed(1)} t/ha
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`text-sm ${trend.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {trend.change >= 0 ? '↗' : '↘'} {Math.abs(trend.change).toFixed(1)}%
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          vs last period
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Regional Performance */}
            <Card className="ag-card">
              <CardHeader>
                <CardTitle className="text-xl text-gray-800 dark:text-gray-200">
                  Regional Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {dashboardData.regionalData.map((region:any, index:any) => (
                    <div key={index} className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                        {region.state}
                      </h4>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            Avg Yield
                          </span>
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {region.avgYield.toFixed(1)} t/ha
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            Farms
                          </span>
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {region.farmCount}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            Sustainability
                          </span>
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {region.sustainabilityScore.toFixed(1)}/10
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recommendations */}
            <Card className="ag-card">
              <CardHeader>
                <CardTitle className="text-xl text-gray-800 dark:text-gray-200">
                  AI Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {dashboardData.recommendations.map((rec: any, index: number) => (
                    <div key={index} className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 dark:text-blue-400 font-bold text-sm">
                            {index + 1}
                          </span>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                            {rec.title}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            {rec.description}
                          </p>
                          <div className="flex items-center space-x-2">
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              rec.priority === 'high' ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400' :
                              rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400' :
                              'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                            }`}>
                              {rec.priority} priority
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              Impact: {rec.impact}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Action Center */}
            <Card className="ag-card">
              <CardHeader>
                <CardTitle className="text-xl text-gray-800 dark:text-gray-200">
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Button
                    className="ag-button h-auto p-4 flex flex-col items-center space-y-2"
                    onClick={() => window.location.href = '/crop-recommendation'}
                  >
                    <span className="text-lg">🌱</span>
                    <span className="text-sm">Get Crop Recommendation</span>
                  </Button>

                  <Button
                    className="ag-button h-auto p-4 flex flex-col items-center space-y-2"
                    onClick={() => window.location.href = '/yield-prediction'}
                  >
                    <span className="text-lg">📊</span>
                    <span className="text-sm">Predict Yield</span>
                  </Button>

                  <Button
                    className="ag-button h-auto p-4 flex flex-col items-center space-y-2"
                    onClick={() => window.location.href = '/sustainability'}
                  >
                    <span className="text-lg">🌍</span>
                    <span className="text-sm">Sustainability Analysis</span>
                  </Button>

                  <Button
                    className="ag-button h-auto p-4 flex flex-col items-center space-y-2"
                    onClick={() => loadDashboardData()}
                  >
                    <span className="text-lg">🔄</span>
                    <span className="text-sm">Refresh Data</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
