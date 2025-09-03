import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// API utility for making requests to Lambda backend
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://margojones-production.up.railway.app'

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
  // Transform data format to match Railway backend expectations
  const transformedData = {
    name: userData.userName,
    email: userData.userEmail,
    bets: userData.bets.map(bet => ({
      categoryKey: bet.categoryKey,
      betValue: bet.betValue,
      amount: bet.amount
    }))
  }
  
  return apiRequest('/bets', {
    method: 'POST',
    body: JSON.stringify(transformedData),
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
