import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount)
}

export function generateSubdomain(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 30)
}

export async function checkSubdomainAvailability(subdomain: string): Promise<boolean> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tenant/validate-subdomain/${subdomain}`)
    const data = await response.json()
    return data.available || false
  } catch (error) {
    console.error('Error checking subdomain availability:', error)
    return false
  }
}

export function getOAuthUrl(provider: 'google' | 'github' = 'google'): string {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.base2ml.com'
  return `${apiUrl}/api/auth/login`
}