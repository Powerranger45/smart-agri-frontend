'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Leaf,
  TrendingUp,
  Recycle,
  BarChart3,
  ArrowRight,
  CheckCircle,
  Users,
  Globe,
  Zap
} from 'lucide-react';
import { healthApi } from '@/services/api';

export default function HomePage() {
  const [apiStatus, setApiStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  useEffect(() => {
    const checkApiHealth = async () => {
      try {
        await healthApi.check();
        setApiStatus('online');
      } catch (error) {
        setApiStatus('offline');
      }
    };

    checkApiHealth();
  }, []);

  const features = [
    {
      icon: <Leaf className="h-8 w-8 text-green-600" />,
      title: 'Crop Recommendation',
      description: 'Get AI-powered crop recommendations based on soil conditions, climate, and environmental factors.',
      href: '/crop-recommendation',
      color: 'bg-green-50 hover:bg-green-100',
      benefits: ['Optimal crop selection', 'Soil health analysis', 'Climate adaptation']
    },
    {
      icon: <Recycle className="h-8 w-8 text-blue-600" />,
      title: 'Sustainability Assessment',
      description: 'Evaluate the environmental impact of your farming practices and get recommendations for improvement.',
      href: '/sustainability',
      color: 'bg-blue-50 hover:bg-blue-100',
      benefits: ['Carbon footprint tracking', 'Resource efficiency', 'Eco-friendly practices']
    },
    {
      icon: <TrendingUp className="h-8 w-8 text-purple-600" />,
      title: 'Market Price Predict',
      description: 'Predict agricultural market prices using advanced ML models trained on market data, supply-demand dynamics, and economic indicators.',
      href: '/market-price',
      color: 'bg-purple-50 hover:bg-purple-100',
      benefits: ['Price forecasting', 'Market trend analysis', 'Profit optimization']
    },
    {
      icon: <BarChart3 className="h-8 w-8 text-orange-600" />,
      title: 'Weather',
      description: 'View the Weather details with a voice Functionality',
      href: '/weather',
      color: 'bg-orange-50 hover:bg-orange-100',
      benefits: ['Weather Forcasting', 'Voice to weather']
    }
  ];

  const stats = [
    { icon: <Users className="h-5 w-5" />, label: 'Farmers Helped', value: '10,000+' },
    { icon: <Globe className="h-5 w-5" />, label: 'Crops Analyzed', value: '25+' },
    { icon: <Zap className="h-5 w-5" />, label: 'Predictions Made', value: '50,000+' },
    { icon: <CheckCircle className="h-5 w-5" />, label: 'Accuracy Rate', value: '95%' }
  ];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="text-center mb-12">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Leaf className="h-10 w-10 text-green-600" />
          <h1 className="text-4xl font-bold text-gray-900">Smart Agriculture Platform</h1>
        </div>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Empowering farmers with AI-driven insights for sustainable and profitable agriculture
        </p>
        <div className="flex items-center justify-center gap-2 mt-4">
          <span className="text-sm text-gray-500">API Status:</span>
          <Badge
            variant={apiStatus === 'online' ? 'default' : apiStatus === 'offline' ? 'destructive' : 'secondary'}
            className="text-xs"
          >
            {apiStatus === 'checking' ? 'Checking...' : apiStatus === 'online' ? 'Online' : 'Offline'}
          </Badge>
        </div>
      </header>

      {/* Stats Section */}
      <section className="mb-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <Card key={index} className="text-center p-4">
              <div className="flex items-center justify-center mb-2">
                {stat.icon}
              </div>
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
              <div className="text-sm text-gray-600">{stat.label}</div>
            </Card>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-center mb-8 text-gray-900">
          Comprehensive Agricultural Solutions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className={`${feature.color} border-0 shadow-lg transition-all duration-300 hover:shadow-xl`}>
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  {feature.icon}
                  <div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-700 mb-4 text-base">
                  {feature.description}
                </CardDescription>
                <div className="space-y-2 mb-4">
                  {feature.benefits.map((benefit, benefitIndex) => (
                    <div key={benefitIndex} className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-gray-600">{benefit}</span>
                    </div>
                  ))}
                </div>
                <Link href={feature.href} className="block">
                  <Button className="w-full group">
                    Get Started
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* How It Works Section */}
      <section className="mb-12">
        <Card className="p-8 bg-gradient-to-r from-green-50 to-blue-50 border-0">
          <h2 className="text-2xl font-bold text-center mb-8 text-gray-900">
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="bg-white rounded-full p-4 w-16 h-16 mx-auto mb-4 shadow-md">
                <span className="text-2xl font-bold text-green-600">1</span>
              </div>
              <h3 className="font-semibold mb-2">Input Data</h3>
              <p className="text-gray-600 text-sm">
                Enter your soil conditions, climate data, and farming parameters
              </p>
            </div>
            <div className="text-center">
              <div className="bg-white rounded-full p-4 w-16 h-16 mx-auto mb-4 shadow-md">
                <span className="text-2xl font-bold text-blue-600">2</span>
              </div>
              <h3 className="font-semibold mb-2">AI Analysis</h3>
              <p className="text-gray-600 text-sm">
                Our machine learning models analyze your data and environmental factors
              </p>
            </div>
            <div className="text-center">
              <div className="bg-white rounded-full p-4 w-16 h-16 mx-auto mb-4 shadow-md">
                <span className="text-2xl font-bold text-purple-600">3</span>
              </div>
              <h3 className="font-semibold mb-2">Get Insights</h3>
              <p className="text-gray-600 text-sm">
                Receive personalized recommendations and predictions for your farm
              </p>
            </div>
          </div>
        </Card>
      </section>

      {/* Call to Action */}
      <section className="text-center">
        <Card className="p-8 bg-gradient-to-r from-green-600 to-blue-600 text-white border-0">
          <h2 className="text-2xl font-bold mb-4">
            Ready to Transform Your Farming?
          </h2>
          <p className="text-lg mb-6 opacity-90">
            Join thousands of farmers who are already using AI to optimize their agricultural practices
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/crop-recommendation">
              <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                Start with Crop Recommendation
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="outline" size="lg" className="w-full sm:w-auto text-white border-white hover:bg-white hover:text-green-600">
                View Dashboard
              </Button>
            </Link>
          </div>
        </Card>
      </section>
    </div>
  );
}
