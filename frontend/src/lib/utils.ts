import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// API utility for making requests to Lambda backend
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://9crmm86fmj.execute-api.us-east-1.amazonaws.com/prod'

export async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const url = `${API_BASE_URL}${endpoint}`
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  if (!response.ok) {
    throw new Error(`API request failed: ${response.statusText}`)
  }

  return response.json()
}

export async function getBets(validated?: boolean) {
  const params = validated !== undefined ? `?validated=${validated}` : ''
  return apiRequest(`/bets${params}`)
}

export async function createBets(userData: {
  userName: string
  userEmail: string
  userPhone?: string
  bets: Array<{
    categoryKey: string
    betValue: string
    amount: number
  }>
}) {
  return apiRequest('/bets', {
    method: 'POST',
    body: JSON.stringify(userData),
  })
}

export async function getCategories() {
  return apiRequest('/categories')
}

export async function validateBets(betIds: number[], validatedBy: string) {
  return apiRequest('/admin/validate', {
    method: 'POST',
    body: JSON.stringify({ betIds, validatedBy }),
  })
}

export async function getStats() {
  return apiRequest('/stats')
}
