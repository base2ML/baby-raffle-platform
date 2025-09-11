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

// Common reserved/taken subdomains that should not be available
const RESERVED_SUBDOMAINS = [
  'www', 'api', 'admin', 'app', 'mail', 'ftp', 'blog', 'shop', 'store',
  'support', 'help', 'docs', 'cdn', 'static', 'img', 'images', 'assets',
  'staging', 'dev', 'test', 'demo', 'beta', 'alpha', 'preview', 'temp'
]

export async function checkSubdomainAvailability(subdomain: string): Promise<boolean> {
  // Basic validation - too short or contains invalid characters
  if (!subdomain || subdomain.length < 3) {
    return false
  }
  
  // Check against reserved subdomains
  if (RESERVED_SUBDOMAINS.includes(subdomain.toLowerCase())) {
    return false
  }
  
  // Simulate some realistic "taken" scenarios for testing
  const commonNames = ['test', 'baby', 'family', 'smith', 'johnson', 'williams', 'brown', 'jones']
  if (commonNames.includes(subdomain.toLowerCase())) {
    return false
  }
  
  try {
    // Try to reach the actual API if available
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.base2ml.com'
    const response = await fetch(`${apiUrl}/api/tenant/validate-subdomain/${subdomain}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // Add timeout to prevent long waits
      signal: AbortSignal.timeout(3000)
    })
    
    if (response.ok) {
      const data = await response.json()
      console.log('Subdomain check response:', data)
      return data.available === true || data.available === 'true'
    }
  } catch (error) {
    console.log('API unavailable, using fallback validation:', error instanceof Error ? error.message : error)
  }
  
  // Fallback: Most subdomains should be available
  // Only block obvious conflicts and reserved words
  return true
}

export function getOAuthUrl(provider: 'google' | 'github' = 'google'): string {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.base2ml.com'
  return `${apiUrl}/api/auth/login`
}