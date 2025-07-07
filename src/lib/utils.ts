import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format numbers with commas
export function formatNumber(num: number): string {
  return new Intl.NumberFormat().format(Math.round(num))
}

// Format currency
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount)
}

// Format percentage
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${(value * 100).toFixed(decimals)}%`
}

// Validate email
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Truncate text
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

// Generate random ID
export function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

// Debounce function
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

// Deep clone object
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj
  if (obj instanceof Date) return new Date(obj.getTime()) as any
  if (obj instanceof Array) return obj.map(item => deepClone(item)) as any
  if (typeof obj === 'object') {
    const clonedObj: any = {}
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key])
      }
    }
    return clonedObj
  }
  return obj
}

// Calculate confidence color
export function getConfidenceColor(confidence: number): string {
  if (confidence >= 0.8) return 'text-green-600'
  if (confidence >= 0.6) return 'text-yellow-600'
  return 'text-red-600'
}

// Calculate score color
export function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-600'
  if (score >= 60) return 'text-yellow-600'
  if (score >= 40) return 'text-orange-600'
  return 'text-red-600'
}

// Get rating color classes
export function getRatingColor(rating: string): string {
  switch (rating.toLowerCase()) {
    case 'excellent': return 'bg-green-100 text-green-800'
    case 'good': return 'bg-blue-100 text-blue-800'
    case 'fair': return 'bg-yellow-100 text-yellow-800'
    case 'poor': return 'bg-red-100 text-red-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

// Date formatting
export function formatDate(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

// Relative time formatting
export function formatRelativeTime(date: Date | string): string {
  const now = new Date()
  const d = new Date(date)
  const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000)

  if (diffInSeconds < 60) return 'just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`

  return formatDate(d)
}

// Validation helpers
export const validationRules = {
  nitrogen: (value: number) => value >= 0 && value <= 200,
  phosphorus: (value: number) => value >= 0 && value <= 200,
  potassium: (value: number) => value >= 0 && value <= 200,
  temperature: (value: number) => value >= -10 && value <= 60,
  humidity: (value: number) => value >= 0 && value <= 100,
  ph: (value: number) => value >= 0 && value <= 14,
  rainfall: (value: number) => value >= 0 && value <= 3000,
  yieldValue: (value: number) => value >= 0 && value <= 50000,
  area: (value: number) => value > 0 && value <= 10000,
  waterUsage: (value: number) => value > 0 && value <= 10000,
  fertilizerAmount: (value: number) => value >= 0 && value <= 1000,
  pesticideUsage: (value: number) => value >= 0 && value <= 100,
  energyConsumption: (value: number) => value >= 0 && value <= 10000,
}

// Error messages
export const errorMessages = {
  nitrogen: 'Nitrogen should be between 0-200 kg/ha',
  phosphorus: 'Phosphorus should be between 0-200 kg/ha',
  potassium: 'Potassium should be between 0-200 kg/ha',
  temperature: 'Temperature should be between -10°C to 60°C',
  humidity: 'Humidity should be between 0-100%',
  ph: 'pH should be between 0-14',
  rainfall: 'Rainfall should be between 0-3000 mm',
  yieldValue: 'Yield should be between 0-50000 kg/ha',
  area: 'Area should be between 0-10000 hectares',
  waterUsage: 'Water usage should be between 0-10000 L/ha/day',
  fertilizerAmount: 'Fertilizer amount should be between 0-1000 kg/ha',
  pesticideUsage: 'Pesticide usage should be between 0-100 kg/ha',
  energyConsumption: 'Energy consumption should be between 0-10000 kWh/ha',
  required: 'This field is required',
  positive: 'Value must be positive',
  invalidSelection: 'Please make a valid selection',
}
