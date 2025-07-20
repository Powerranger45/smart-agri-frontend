'use client'

import React, { useState, useEffect } from 'react'
import { Search, Volume2, MapPin, Thermometer, Droplets, Wind, Eye, Gauge, Sun, Cloud, CloudRain, CloudSnow, Zap, Sunrise, Sunset, ArrowLeft, Leaf, Navigation, AlertCircle } from 'lucide-react'

interface WeatherData {
  location: {
    name: string
    latitude: number
    longitude: number
    isCurrentLocation: boolean
  }
  current: {
    temperature: number
    feels_like: number
    humidity: number
    wind_speed: number
    wind_direction: number
    pressure: number
    weather_code: number
    is_day: number
    precipitation: number
  }
  daily: {
    max_temp: number
    min_temp: number
    sunrise: Date
    sunset: Date
    uv_index: number
  }
}

interface LocationData {
  name: string
  lat: number
  lon: number
  isCurrentLocation: boolean
}

export default function AgriWeatherApp() {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentTime, setCurrentTime] = useState(new Date())
  const [locationData, setLocationData] = useState<LocationData | null>(null)
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const [locationStatus, setLocationStatus] = useState<'pending' | 'granted' | 'denied'>('pending')

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000)
    return () => clearInterval(timer)
  }, [])

  // Get user's location on mount with better error handling
  useEffect(() => {
    getCurrentLocationWeather()
  }, [])

  const getCurrentLocationWeather = () => {
    setLoading(true)
    setError(null)
    setLocationStatus('pending')

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser')
      setLocationStatus('denied')
      setLoading(false)
      return
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 10000, // 10 seconds timeout
      maximumAge: 300000 // 5 minutes cache
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocationStatus('granted')
        fetchWeatherByCoords(
          position.coords.latitude,
          position.coords.longitude,
          null,
          true // indicates this is current location
        )
      },
      (geoError) => {
        setLocationStatus('denied')
        let errorMessage = ''

        switch (geoError.code) {
          case geoError.PERMISSION_DENIED:
            errorMessage = 'Location access denied. Please enable location permissions and try again.'
            break
          case geoError.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable. Please try searching for a city instead.'
            break
          case geoError.TIMEOUT:
            errorMessage = 'Location request timed out. Please try again or search for a city.'
            break
          default:
            errorMessage = 'An unknown error occurred while retrieving location.'
            break
        }

        setError(errorMessage)
        setLoading(false)
      },
      options
    )
  }

  const searchLocation = async (cityName: string) => {
    try {
      const response = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1&language=en&format=json`
      )
      const data = await response.json()

      if (data.results && data.results.length > 0) {
        const location = data.results[0]
        return {
          latitude: location.latitude,
          longitude: location.longitude,
          name: location.name,
          country: location.country
        }
      }
      throw new Error('Location not found')
    } catch (err) {
      throw new Error('Unable to find location')
    }
  }

  const fetchWeatherByCoords = async (lat: number, lon: number, locationName: string | null = null, isCurrentLocation: boolean = false) => {
    try {
      // Fetch current weather and forecast
      const currentResponse = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,surface_pressure,wind_speed_10m,wind_direction_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max&timezone=auto`
      )

      if (!currentResponse.ok) {
        throw new Error('Weather data not available')
      }

      const weatherResponse = await currentResponse.json()

      // Get location name from reverse geocoding if not provided
      let finalLocationName = locationName
      if (!locationName || isCurrentLocation) {
        try {
          const geoResponse = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`
          )
          const geoData = await geoResponse.json()

          if (geoData && geoData.city) {
            finalLocationName = isCurrentLocation
              ? `${geoData.city}, ${geoData.countryName} (Current Location)`
              : `${geoData.city}, ${geoData.countryName}`
          } else {
            finalLocationName = isCurrentLocation
              ? `Current Location (${lat.toFixed(2)}, ${lon.toFixed(2)})`
              : `${lat.toFixed(2)}, ${lon.toFixed(2)}`;
          }
        } catch (e) {
          finalLocationName = isCurrentLocation
            ? `Current Location (${lat.toFixed(2)}, ${lon.toFixed(2)})`
            : `${lat.toFixed(2)}, ${lon.toFixed(2)}`
        }
      }

      const processedData: WeatherData = {
        location: {
          name: finalLocationName || 'Unknown Location',
          latitude: lat,
          longitude: lon,
          isCurrentLocation
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
      }

      setWeatherData(processedData)
      setLocationData({
        name: finalLocationName || 'Unknown Location',
        lat,
        lon,
        isCurrentLocation
      })
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    setLoading(true)
    try {
      const location = await searchLocation(searchQuery)
      await fetchWeatherByCoords(
        location.latitude,
        location.longitude,
        `${location.name}, ${location.country}`,
        false
      )
      setSearchQuery('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed')
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const speakWeather = () => {
    if (!weatherData || !('speechSynthesis' in window)) {
      alert('Speech synthesis not supported in your browser')
      return
    }

    const { location, current, daily } = weatherData
    const condition = getWeatherDescription(current.weather_code)

    const text = `The weather in ${location.name} is ${condition}.
                   The temperature is ${current.temperature} degrees Celsius, feeling like ${current.feels_like} degrees.
                   Humidity is ${current.humidity} percent with winds at ${current.wind_speed} kilometers per hour.
                   Today's high is ${daily.max_temp} and low is ${daily.min_temp} degrees.`

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 0.8
    utterance.pitch = 1
    speechSynthesis.speak(utterance)
  }

  const getWeatherDescription = (code: number): string => {
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
    }
    return weatherCodes[code] || 'Unknown'
  }

  const getWeatherIcon = (code: number, isDay: number) => {
    const iconClass = "w-24 h-24 lg:w-32 lg:h-32 drop-shadow-lg"

    if (code === 0) {
      return isDay ? <Sun className={`${iconClass} text-yellow-400`} /> : <div className={`${iconClass} text-blue-200 flex items-center justify-center text-6xl lg:text-8xl`}>🌙</div>
    } else if ([1, 2, 3].includes(code)) {
      return <Cloud className={`${iconClass} text-gray-400`} />
    } else if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) {
      return <CloudRain className={`${iconClass} text-blue-400`} />
    } else if ([56, 57, 66, 67, 71, 73, 75, 77, 85, 86].includes(code)) {
      return <CloudSnow className={`${iconClass} text-blue-300`} />
    } else if ([95, 96, 99].includes(code)) {
      return <Zap className={`${iconClass} text-yellow-500`} />
    }
    return <Cloud className={`${iconClass} text-gray-400`} />
  }

  const getBackgroundGradient = () => {
    if (!weatherData) return 'from-emerald-600 via-green-600 to-teal-700'

    const code = weatherData.current.weather_code
    const isDay = weatherData.current.is_day

    if (code === 0) {
      return isDay ? 'from-amber-400 via-orange-500 to-red-500' : 'from-slate-900 via-purple-900 to-indigo-900'
    } else if ([1, 2, 3].includes(code)) {
      return isDay ? 'from-slate-400 via-gray-500 to-slate-600' : 'from-slate-800 via-gray-800 to-slate-900'
    } else if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) {
      return 'from-blue-600 via-cyan-600 to-teal-700'
    } else if ([56, 57, 66, 67, 71, 73, 75, 77, 85, 86].includes(code)) {
      return 'from-blue-300 via-slate-400 to-gray-500'
    } else if ([95, 96, 99].includes(code)) {
      return 'from-gray-700 via-slate-800 to-gray-900'
    }
    return 'from-emerald-600 via-green-600 to-teal-700'
  }

  const getWindDirection = (degrees: number): string => {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
    const index = Math.round(degrees / 45) % 8
    return directions[index]
  }

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const getAgriculturalAdvisory = (weather: WeatherData) => {
    const { current, daily } = weather;
    const advisories = [];

    // Temperature-based advisories
    if (current.temperature < 5) {
      advisories.push('Protect sensitive crops from frost. Consider frost covers or irrigation.');
    } else if (current.temperature > 35) {
      advisories.push('High temperatures can stress crops. Ensure adequate irrigation and consider shading.');
    }

    // Precipitation-based advisories
    if (current.precipitation > 2) {
      advisories.push('Heavy rainfall. Monitor for waterlogging and soil erosion. Avoid field work if soil is saturated.');
    } else if (current.precipitation === 0 && current.humidity < 40 && daily.uv_index > 5) {
      advisories.push('Dry conditions and high UV. Irrigation may be necessary. Watch for signs of drought stress.');
    }

    // Wind-based advisories
    if (current.wind_speed > 20) {
      advisories.push('Strong winds. Secure young plants and consider windbreaks for delicate crops.');
    }

    // UV Index advisories
    if (daily.uv_index > 7) {
      advisories.push('Very high UV index. Limit sun exposure during peak hours for workers.');
    }

    // General favorable conditions
    if (advisories.length === 0) {
      advisories.push('Favorable weather conditions for agricultural activities. Continue routine farm management.');
    }

    return advisories;
  };


  return (
    <div className={`min-h-screen bg-gradient-to-br ${getBackgroundGradient()} transition-all duration-1000 relative overflow-hidden`}>
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-white/5 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-24 h-24 bg-white/10 rounded-full blur-lg animate-pulse delay-1000"></div>
        <div className="absolute bottom-32 left-1/4 w-40 h-40 bg-white/3 rounded-full blur-2xl animate-pulse delay-2000"></div>
        <div className="absolute bottom-20 right-10 w-28 h-28 bg-white/8 rounded-full blur-xl animate-pulse delay-500"></div>
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto p-4 lg:p-8">
        {/* Header */}
        <header className="mb-8 pt-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="p-3 bg-white/15 backdrop-blur-lg rounded-2xl border border-white/20">
                <Leaf className="h-8 w-8 lg:h-12 lg:w-12 text-emerald-300" />
              </div>
              <h1 className="text-4xl lg:text-6xl font-bold text-white drop-shadow-lg">AgriWeather</h1>
            </div>
            <p className="text-white/80 text-lg lg:text-xl font-medium">{currentTime.toLocaleString()}</p>
            <p className="text-white/60 text-sm lg:text-base mt-1">Smart Weather for Smart Farming</p>
          </div>
        </header>

        {/* Enhanced Search Bar */}
        <div className="mb-8 max-w-2xl mx-auto">
          <div className="relative group">
            <div className={`absolute inset-0 bg-gradient-to-r from-white/20 to-white/10 rounded-3xl blur-sm transition-all duration-300 ${isSearchFocused ? 'scale-105 opacity-100' : 'opacity-70'}`}></div>
            <div className="relative bg-white/15 backdrop-blur-xl rounded-3xl border border-white/30 overflow-hidden">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                placeholder="Search for any city worldwide..."
                className="w-full px-6 py-4 lg:py-5 pl-14 pr-20 bg-transparent text-white placeholder-white/70 focus:outline-none text-lg lg:text-xl"
              />
              <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 text-white/70 w-5 h-5 lg:w-6 lg:h-6" />
              <button
                onClick={handleSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 rounded-2xl px-4 py-2 lg:px-6 lg:py-3 text-white text-sm lg:text-base font-medium transition-all duration-200 hover:scale-105"
              >
                Search
              </button>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center text-white mb-8">
            <div className="relative inline-block">
              <div className="w-16 h-16 lg:w-20 lg:h-20 border-4 border-white/30 border-t-white rounded-full animate-spin mb-4"></div>
              <div className="absolute inset-0 w-16 h-16 lg:w-20 lg:h-20 border-2 border-white/20 rounded-full animate-ping"></div>
            </div>
            <p className="text-xl lg:text-2xl font-medium">Fetching weather data...</p>
            <p className="text-white/70 text-base lg:text-lg mt-1">Please wait a moment</p>
          </div>
        )}

        {/* Enhanced Error State */}
        {error && (
          <div className="max-w-2xl mx-auto bg-red-500/20 backdrop-blur-xl rounded-3xl p-6 lg:p-8 mb-8 border border-red-400/40">
            <div className="flex items-center justify-center mb-4">
              <div className="p-3 bg-red-500/20 rounded-full">
                <AlertCircle className="w-6 h-6 lg:w-8 lg:h-8 text-red-300" />
              </div>
            </div>
            <p className="text-white text-center text-lg lg:text-xl font-medium mb-4">{error}</p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={getCurrentLocationWeather}
                className="bg-white/15 hover:bg-white/25 backdrop-blur-lg rounded-2xl py-3 px-6 text-white font-medium transition-all duration-300 hover:scale-105 border border-white/30"
              >
                Try Current Location
              </button>
              {locationStatus === 'denied' && (
                <button
                  onClick={() => setError(null)}
                  className="bg-blue-500/20 hover:bg-blue-500/30 backdrop-blur-lg rounded-2xl py-3 px-6 text-white font-medium transition-all duration-300 hover:scale-105 border border-blue-400/40"
                >
                  Search Instead
                </button>
              )}
            </div>
          </div>
        )}

        {/* Weather Display - Full Screen Layout */}
        {weatherData && !loading && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
            {/* Main Weather Card - Takes full width on mobile, spans 2 columns on XL */}
            <div className="xl:col-span-2 relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-white/25 to-white/10 rounded-3xl blur-sm group-hover:scale-105 transition-all duration-500"></div>
              <div className="relative bg-white/20 backdrop-blur-xl rounded-3xl p-6 lg:p-10 border border-white/30 shadow-2xl">
                {/* Location Header */}
                <div className="flex items-center justify-between mb-8">
                  <div className="flex-1">
                    <div className="flex items-center text-white mb-2">
                      <div className="p-2 lg:p-3 bg-white/15 rounded-xl mr-3">
                        <MapPin className="w-5 h-5 lg:w-6 lg:h-6" />
                      </div>
                      <div>
                        <h2 className="text-xl lg:text-3xl font-bold">{weatherData.location.name}</h2>
                        <p className="text-white/70 text-sm lg:text-base">
                          {weatherData.location.latitude.toFixed(2)}, {weatherData.location.longitude.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={getCurrentLocationWeather}
                    className="bg-white/15 hover:bg-white/25 rounded-2xl p-3 lg:p-4 text-white transition-all duration-300 hover:scale-110 border border-white/30"
                    title="Get current location weather"
                  >
                    <Navigation className="w-5 h-5 lg:w-6 lg:h-6" />
                  </button>
                </div>

                {/* Weather Icon and Temperature */}
                <div className="text-center mb-8 lg:mb-12">
                  <div className="flex justify-center mb-8 animate-bounce">
                    {getWeatherIcon(weatherData.current.weather_code, weatherData.current.is_day)}
                  </div>
                  <h3 className="text-7xl lg:text-9xl font-bold text-white mb-4 drop-shadow-lg">
                    {weatherData.current.temperature}°
                  </h3>
                  <p className="text-white/90 text-2xl lg:text-3xl font-medium mb-3">
                    {getWeatherDescription(weatherData.current.weather_code)}
                  </p>
                  <p className="text-white/70 text-lg lg:text-2xl">Feels like {weatherData.current.feels_like}°</p>
                  <div className="flex justify-center items-center mt-6 text-white/60">
                    <span className="bg-white/15 px-4 py-2 lg:px-6 lg:py-3 rounded-full text-base lg:text-lg">
                      H: {weatherData.daily.max_temp}°
                    </span>
                    <span className="mx-4 text-white/40 text-xl">•</span>
                    <span className="bg-white/15 px-4 py-2 lg:px-6 lg:py-3 rounded-full text-base lg:text-lg">
                      L: {weatherData.daily.min_temp}°
                    </span>
                  </div>
                </div>

                {/* Enhanced Speak Button */}
                <button
                  onClick={speakWeather}
                  className="w-full bg-gradient-to-r from-emerald-500/30 to-green-500/30 hover:from-emerald-500/40 hover:to-green-500/40 backdrop-blur-lg rounded-2xl py-4 lg:py-6 text-white font-semibold flex items-center justify-center space-x-4 transition-all duration-300 hover:scale-105 border border-emerald-400/40 shadow-lg"
                >
                  <div className="p-2 bg-white/20 rounded-full">
                    <Volume2 className="w-5 h-5 lg:w-6 lg:h-6" />
                  </div>
                  <span className="text-lg lg:text-xl">Listen to Weather Report</span>
                </button>
              </div>
            </div>

            {/* Right Column - Weather Details */}
            <div className="space-y-6">
              {/* Weather Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: Droplets, label: 'Humidity', value: `${weatherData.current.humidity}%`, color: 'text-blue-300' },
                  { icon: Wind, label: 'Wind', value: `${weatherData.current.wind_speed} km/h`, extra: getWindDirection(weatherData.current.wind_direction), color: 'text-cyan-300' },
                  { icon: Gauge, label: 'Pressure', value: `${weatherData.current.pressure} hPa`, color: 'text-purple-300' },
                  { icon: Sun, label: 'UV Index', value: weatherData.daily.uv_index.toString(), extra: weatherData.daily.uv_index <= 2 ? 'Low' : weatherData.daily.uv_index <= 5 ? 'Moderate' : weatherData.daily.uv_index <= 7 ? 'High' : weatherData.daily.uv_index <= 10 ? 'Very High' : 'Extreme', color: 'text-orange-300' }
                ].map((item: { icon: any, label: string, value: string, color: string, extra?: string }, index: number) => (
                  <div key={index} className="group relative">
                    <div className="absolute inset-0 bg-white/10 rounded-2xl blur-sm group-hover:scale-105 transition-all duration-300"></div>
                    <div className="relative bg-white/15 backdrop-blur-xl rounded-2xl p-4 lg:p-6 border border-white/30 hover:border-white/50 transition-all duration-300">
                      <div className="flex items-center text-white/80 mb-3">
                        <div className="p-2 bg-white/20 rounded-xl mr-3">
                          <item.icon className="w-4 h-4 lg:w-5 lg:h-5" />
                        </div>
                        <span className="text-sm lg:text-base font-medium">{item.label}</span>
                      </div>
                      <p className={`text-xl lg:text-3xl font-bold ${item.color} mb-1`}>{item.value}</p>
                      {item.extra && <p className="text-white/60 text-xs lg:text-sm">{item.extra}</p>}
                    </div>
                  </div>
                ))}
              </div>
              {/* Sun Times Card */}
              <div className="relative group">
                <div className="absolute inset-0 bg-white/10 rounded-2xl blur-sm group-hover:scale-105 transition-all duration-300"></div>
                <div className="relative bg-white/15 backdrop-blur-xl rounded-2xl p-6 lg:p-8 border border-white/30">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-white/80">
                        <div className="p-2 bg-orange-400/20 rounded-xl mr-3">
                          <Sunrise className="w-5 h-5 lg:w-6 lg:h-6 text-orange-300" />
                        </div>
                        <span className="text-sm lg:text-base font-medium">Sunrise</span>
                      </div>
                      <p className="text-white font-bold text-base lg:text-xl">{formatTime(weatherData.daily.sunrise)}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-white/80">
                        <div className="p-2 bg-orange-500/20 rounded-xl mr-3">
                          <Sunset className="w-5 h-5 lg:w-6 lg:h-6 text-orange-400" />
                        </div>
                        <span className="text-sm lg:text-base font-medium">Sunset</span>
                      </div>
                      <p className="text-white font-bold text-base lg:text-xl">{formatTime(weatherData.daily.sunset)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Precipitation Card (if any) */}
              {weatherData.current.precipitation > 0 && (
                <div className="relative group">
                  <div className="absolute inset-0 bg-blue-500/20 rounded-2xl blur-sm group-hover:scale-105 transition-all duration-300"></div>
                  <div className="relative bg-blue-500/15 backdrop-blur-xl rounded-2xl p-6 lg:p-8 border border-blue-400/40">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-white/80">
                        <div className="p-3 bg-blue-400/20 rounded-xl mr-4">
                          <CloudRain className="w-6 h-6 lg:w-8 lg:h-8 text-blue-300" />
                        </div>
                        <span className="text-base lg:text-xl font-medium">Current Precipitation</span>
                      </div>
                      <p className="text-2xl lg:text-4xl font-bold text-blue-200">{weatherData.current.precipitation} mm</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Agricultural Advisory Card - New Addition */}
              <div className="relative group">
                <div className="absolute inset-0 bg-green-500/20 rounded-2xl blur-sm group-hover:scale-105 transition-all duration-300"></div>
                <div className="relative bg-green-500/15 backdrop-blur-xl rounded-2xl p-6 lg:p-8 border border-green-400/40">
                  <div className="flex items-center text-white mb-4">
                    <div className="p-3 bg-green-400/20 rounded-xl mr-4">
                      <Leaf className="w-6 h-6 lg:w-8 lg:h-8 text-green-300" />
                    </div>
                    <h3 className="text-lg lg:text-2xl font-bold">Agricultural Advisory</h3>
                  </div>
                  <ul className="list-disc list-inside text-white/80 space-y-2 text-sm lg:text-base">
                    {getAgriculturalAdvisory(weatherData).map((advisory, idx) => (
                      <li key={idx}>{advisory}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}