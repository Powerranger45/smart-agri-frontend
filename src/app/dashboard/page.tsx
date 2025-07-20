'use client';

import React, { useState, useEffect } from 'react';
import { Search, Volume2, MapPin, Thermometer, Droplets, Wind, Eye, Gauge, Sun, Cloud, CloudRain, CloudSnow, Zap, Sunrise, Sunset } from 'lucide-react';

const WeatherApp = () => {
  const [weatherData, setWeatherData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [locationData, setLocationData] = useState<any>(null);

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Get user's location on mount
  useEffect(() => {
    getCurrentLocationWeather();
  }, []);

  const getCurrentLocationWeather = () => {
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        fetchWeatherByCoords(position.coords.latitude, position.coords.longitude, 'Current Location');
      },
      (error) => {
        // Fallback to London coordinates if location is denied
        fetchWeatherByCoords(51.5074, -0.1278, 'London, UK');
      }
    );
  };

  const searchLocation = async (cityName: string) => {
    try {
      const response = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1&language=en&format=json`
      );
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        const location = data.results[0];
        return {
          latitude: location.latitude,
          longitude: location.longitude,
          name: location.name,
          country: location.country
        };
      }
      throw new Error('Location not found');
    } catch (err) {
      throw new Error('Unable to find location');
    }
  };

  const fetchWeatherByCoords = async (lat: number, lon: number, locationName: string | null = null) => {
    try {
      // Fetch current weather and forecast
      const currentResponse = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,surface_pressure,wind_speed_10m,wind_direction_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max&timezone=auto`
      );
      
      if (!currentResponse.ok) {
        throw new Error('Weather data not available');
      }
      
      const weatherResponse = await currentResponse.json();
      
      // If no location name provided, try to get it from reverse geocoding
      let finalLocationName = locationName;
      if (!locationName) {
        try {
          const geoResponse = await fetch(
            `https://geocoding-api.open-meteo.com/v1/search?latitude=${lat}&longitude=${lon}&count=1&language=en&format=json`
          );
          const geoData = await geoResponse.json();
          if (geoData.results && geoData.results.length > 0) {
            finalLocationName = `${geoData.results[0].name}, ${geoData.results[0].country}`;
          }
        } catch (e) {
          finalLocationName = `${lat.toFixed(2)}, ${lon.toFixed(2)}`;
        }
      }

      const processedData = {
        location: {
          name: finalLocationName,
          latitude: lat,
          longitude: lon
        },
        current: {
          temperature: Math.round(weatherResponse.current.temperature_2m),
          feels_like: Math.round(weatherResponse.current.apparent_temperature),
          humidity: weatherResponse.current.relative_humidity_2m,
          wind_speed: Math.round(weatherResponse.current.wind_speed_10m),
          wind_direction: weatherResponse.current.wind_direction_10m,
          pressure: Math.round(weatherResponse.current.surface_pressure),
          weather_code: weatherResponse.current.weather_code,
          is_day: weatherResponse.current.is_day,
          precipitation: weatherResponse.current.precipitation || 0
        },
        daily: {
          max_temp: Math.round(weatherResponse.daily.temperature_2m_max[0]),
          min_temp: Math.round(weatherResponse.daily.temperature_2m_min[0]),
          sunrise: new Date(weatherResponse.daily.sunrise[0]),
          sunset: new Date(weatherResponse.daily.sunset[0]),
          uv_index: Math.round(weatherResponse.daily.uv_index_max[0])
        }
      };

      setWeatherData(processedData);
      setLocationData({ name: finalLocationName, lat, lon });
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    try {
      const location = await searchLocation(searchQuery);
      await fetchWeatherByCoords(
        location.latitude, 
        location.longitude, 
        `${location.name}, ${location.country}`
      );
      setSearchQuery('');
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const speakWeather = () => {
    if (!weatherData || !('speechSynthesis' in window)) {
      alert('Speech synthesis not supported in your browser');
      return;
    }

    const { location, current, daily } = weatherData;
    const condition = getWeatherDescription(current.weather_code);
    
    const text = `The weather in ${location.name} is ${condition}. 
                  The temperature is ${current.temperature} degrees Celsius, feeling like ${current.feels_like} degrees. 
                  Humidity is ${current.humidity} percent with winds at ${current.wind_speed} kilometers per hour.
                  Today's high is ${daily.max_temp} and low is ${daily.min_temp} degrees.`;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.8;
    utterance.pitch = 1;
    speechSynthesis.speak(utterance);
  };

  const getWeatherDescription = (code: number) => {
    const weatherCodes: { [key: number]: string } = {
      0: 'Clear sky',
      1: 'Mainly clear',
      2: 'Partly cloudy',
      3: 'Overcast',
      45: 'Fog',
      48: 'Depositing rime fog',
      51: 'Light drizzle',
      53: 'Moderate drizzle',
      55: 'Dense drizzle',
      56: 'Light freezing drizzle',
      57: 'Dense freezing drizzle',
      61: 'Slight rain',
      63: 'Moderate rain',
      65: 'Heavy rain',
      66: 'Light freezing rain',
      67: 'Heavy freezing rain',
      71: 'Slight snow fall',
      73: 'Moderate snow fall',
      75: 'Heavy snow fall',
      77: 'Snow grains',
      80: 'Slight rain showers',
      81: 'Moderate rain showers',
      82: 'Violent rain showers',
      85: 'Slight snow showers',
      86: 'Heavy snow showers',
      95: 'Thunderstorm',
      96: 'Thunderstorm with slight hail',
      99: 'Thunderstorm with heavy hail'
    };
    return weatherCodes[code] || 'Unknown';
  };

  const getWeatherIcon = (code: number, isDay: boolean) => {
    const iconClass = "w-16 h-16";
    
    if (code === 0) {
      return isDay ? <Sun className={`${iconClass} text-yellow-500`} /> : <div className={`${iconClass} text-blue-200 flex items-center justify-center text-4xl`}>🌙</div>;
    } else if ([1, 2, 3].includes(code)) {
      return <Cloud className={`${iconClass} text-gray-500`} />;
    } else if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) {
      return <CloudRain className={`${iconClass} text-blue-500`} />;
    } else if ([56, 57, 66, 67, 71, 73, 75, 77, 85, 86].includes(code)) {
      return <CloudSnow className={`${iconClass} text-blue-300`} />;
    } else if ([95, 96, 99].includes(code)) {
      return <Zap className={`${iconClass} text-yellow-600`} />;
    }
    return <Cloud className={`${iconClass} text-gray-500`} />;
  };

  const getBackgroundGradient = () => {
    if (!weatherData) return 'from-blue-400 to-blue-600';
    
    const code = weatherData.current.weather_code;
    const isDay = weatherData.current.is_day;
    
    if (code === 0) {
      return isDay ? 'from-orange-400 to-pink-500' : 'from-indigo-900 to-purple-900';
    } else if ([1, 2, 3].includes(code)) {
      return isDay ? 'from-gray-400 to-gray-600' : 'from-gray-700 to-gray-900';
    } else if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) {
      return 'from-blue-500 to-blue-700';
    } else if ([56, 57, 66, 67, 71, 73, 75, 77, 85, 86].includes(code)) {
      return 'from-blue-200 to-blue-400';
    } else if ([95, 96, 99].includes(code)) {
      return 'from-gray-700 to-gray-900';
    }
    return 'from-blue-400 to-blue-600';
  };

  const getWindDirection = (degrees: number) => {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(degrees / 45) % 8;
    return directions[index];
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br ${getBackgroundGradient()} transition-all duration-1000 p-4`}>
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8 pt-8">
          <h1 className="text-3xl font-bold text-white mb-2">Weather App</h1>
          <p className="text-white/80">{currentTime.toLocaleString()}</p>
          <p className="text-white/60 text-sm mt-2">Powered by Open-Meteo</p>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Search for a city..."
              className="w-full px-4 py-3 pl-12 rounded-2xl bg-white/20 backdrop-blur-md text-white placeholder-white/70 border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50"
            />
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/70 w-5 h-5" />
            <button
              onClick={handleSearch}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 rounded-xl px-4 py-2 text-white text-sm transition-all duration-200"
            >
              Search
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center text-white">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            <p className="mt-2">Loading weather data...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-500/20 backdrop-blur-md rounded-2xl p-6 mb-8 border border-red-500/30">
            <p className="text-white text-center">{error}</p>
            <button
              onClick={getCurrentLocationWeather}
              className="w-full mt-4 bg-white/20 hover:bg-white/30 rounded-xl py-2 text-white transition-all duration-200"
            >
              Try Current Location
            </button>
          </div>
        )}

        {/* Weather Display */}
        {weatherData && !loading && (
          <div className="space-y-6">
            {/* Main Weather Card */}
            <div className="bg-white/20 backdrop-blur-md rounded-3xl p-6 border border-white/30">
              <div className="flex items-center justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center text-white mb-1">
                    <MapPin className="w-4 h-4 mr-1" />
                    <span className="text-lg font-semibold">{weatherData.location.name}</span>
                  </div>
                  <p className="text-white/80 text-sm">
                    {weatherData.location.latitude.toFixed(2)}, {weatherData.location.longitude.toFixed(2)}
                  </p>
                </div>
                <button
                  onClick={getCurrentLocationWeather}
                  className="bg-white/20 hover:bg-white/30 rounded-xl p-2 text-white transition-all duration-200"
                  title="Get current location weather"
                >
                  <MapPin className="w-5 h-5" />
                </button>
              </div>

              <div className="text-center mb-6">
                <div className="flex justify-center mb-4">
                  {getWeatherIcon(weatherData.current.weather_code, weatherData.current.is_day)}
                </div>
                <h2 className="text-5xl font-bold text-white mb-2">{weatherData.current.temperature}°</h2>
                <p className="text-white/90 text-lg">{getWeatherDescription(weatherData.current.weather_code)}</p>
                <p className="text-white/70 text-sm">Feels like {weatherData.current.feels_like}°</p>
                <div className="flex justify-center items-center mt-2 text-white/60 text-sm">
                  <span>H: {weatherData.daily.max_temp}°</span>
                  <span className="mx-2">•</span>
                  <span>L: {weatherData.daily.min_temp}°</span>
                </div>
              </div>

              {/* Speak Button */}
              <button
                onClick={speakWeather}
                className="w-full bg-white/20 hover:bg-white/30 rounded-2xl py-3 text-white font-semibold flex items-center justify-center space-x-2 transition-all duration-200 hover:scale-105"
              >
                <Volume2 className="w-5 h-5" />
                <span>Speak Weather</span>
              </button>
            </div>

            {/* Weather Details */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/20 backdrop-blur-md rounded-2xl p-4 border border-white/30">
                <div className="flex items-center text-white/80 mb-2">
                  <Droplets className="w-4 h-4 mr-2" />
                  <span className="text-sm">Humidity</span>
                </div>
                <p className="text-2xl font-bold text-white">{weatherData.current.humidity}%</p>
              </div>

              <div className="bg-white/20 backdrop-blur-md rounded-2xl p-4 border border-white/30">
                <div className="flex items-center text-white/80 mb-2">
                  <Wind className="w-4 h-4 mr-2" />
                  <span className="text-sm">Wind</span>
                </div>
                <p className="text-2xl font-bold text-white">{weatherData.current.wind_speed} km/h</p>
                <p className="text-white/60 text-xs">{getWindDirection(weatherData.current.wind_direction)}</p>
              </div>

              <div className="bg-white/20 backdrop-blur-md rounded-2xl p-4 border border-white/30">
                <div className="flex items-center text-white/80 mb-2">
                  <Gauge className="w-4 h-4 mr-2" />
                  <span className="text-sm">Pressure</span>
                </div>
                <p className="text-2xl font-bold text-white">{weatherData.current.pressure} hPa</p>
              </div>

              <div className="bg-white/20 backdrop-blur-md rounded-2xl p-4 border border-white/30">
                <div className="flex items-center text-white/80 mb-2">
                  <Sun className="w-4 h-4 mr-2" />
                  <span className="text-sm">UV Index</span>
                </div>
                <p className="text-2xl font-bold text-white">{weatherData.daily.uv_index}</p>
                <p className="text-white/60 text-xs">
                  {weatherData.daily.uv_index <= 2 ? 'Low' : 
                   weatherData.daily.uv_index <= 5 ? 'Moderate' :
                   weatherData.daily.uv_index <= 7 ? 'High' :
                   weatherData.daily.uv_index <= 10 ? 'Very High' : 'Extreme'}
                </p>
              </div>
            </div>

            {/* Sun Times */}
            <div className="bg-white/20 backdrop-blur-md rounded-2xl p-4 border border-white/30">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-white/80">
                    <Sunrise className="w-4 h-4 mr-2" />
                    <span className="text-sm">Sunrise</span>
                  </div>
                  <p className="text-white font-semibold">{formatTime(weatherData.daily.sunrise)}</p>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-white/80">
                    <Sunset className="w-4 h-4 mr-2" />
                    <span className="text-sm">Sunset</span>
                  </div>
                  <p className="text-white font-semibold">{formatTime(weatherData.daily.sunset)}</p>
                </div>
              </div>
            </div>

            {/* Precipitation if any */}
            {weatherData.current.precipitation > 0 && (
              <div className="bg-white/20 backdrop-blur-md rounded-2xl p-4 border border-white/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-white/80">
                    <CloudRain className="w-4 h-4 mr-2" />
                    <span className="text-sm">Precipitation</span>
                  </div>
                  <p className="text-2xl font-bold text-white">{weatherData.current.precipitation} mm</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default WeatherApp;