'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, CheckCircle, AlertCircle, ExternalLink, Baby } from 'lucide-react'

function AuthCallbackContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [tenantInfo, setTenantInfo] = useState<any>(null)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get('code')
        const state = searchParams.get('state')
        const provider = searchParams.get('provider') || 'google'

        if (!code) {
          setError('Authorization code not received')
          setStatus('error')
          return
        }

        // Get stored signup data
        const signupData = sessionStorage.getItem('signupData')
        let babyName = '', email = '', subdomain = '', selectedPlan = 'Premium'
        
        if (signupData) {
          const data = JSON.parse(signupData)
          babyName = data.babyName
          email = data.email
          subdomain = data.subdomain
          selectedPlan = data.selectedPlan
          sessionStorage.removeItem('signupData')
        }

        // Call the OAuth callback endpoint
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/callback`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            provider,
            code,
            state,
            baby_name: babyName,
            email,
            subdomain,
            plan: selectedPlan
          }),
        })

        const data = await response.json()

        if (response.ok && data.access_token) {
          setTenantInfo(data.user_info)
          setStatus('success')
          
          // Store the access token
          localStorage.setItem('access_token', data.access_token)
          
          // Redirect to the user's site after a delay
          setTimeout(() => {
            if (data.user_info?.tenant?.subdomain) {
              window.location.href = `https://${data.user_info.tenant.subdomain}.mybabyraffle.base2ml.com`
            }
          }, 3000)
        } else {
          setError(data.message || 'Authentication failed')
          setStatus('error')
        }
      } catch (err) {
        console.error('Callback error:', err)
        setError('An unexpected error occurred')
        setStatus('error')
      }
    }

    handleCallback()
  }, [searchParams])

  const handleReturnHome = () => {
    router.push('/')
  }

  const handleGoToSite = () => {
    if (tenantInfo?.tenant?.subdomain) {
      window.location.href = `https://${tenantInfo.tenant.subdomain}.mybabyraffle.base2ml.com`
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl border-0">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-4">
            <div className="bg-gradient-to-r from-pink-500 to-purple-600 rounded-full p-3">
              <Baby className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            {status === 'loading' && 'Setting Up Your Site...'}
            {status === 'success' && 'Welcome to Baby Raffle!'}
            {status === 'error' && 'Something Went Wrong'}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {status === 'loading' && (
            <div className="text-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-purple-600 mx-auto" />
              <div className="space-y-2">
                <p className="text-gray-600 font-medium">Creating your account...</p>
                <p className="text-sm text-gray-500">This will only take a moment</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
                <p>✨ Generating your unique site</p>
                <p>🎨 Setting up your beautiful theme</p>
                <p>🔐 Configuring secure payments</p>
              </div>
            </div>
          )}

          {status === 'success' && tenantInfo && (
            <div className="text-center space-y-4">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
              <div className="space-y-2">
                <p className="text-gray-600 font-medium">
                  Your Baby Raffle site is ready!
                </p>
                {tenantInfo.tenant?.subdomain && (
                  <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-2">Your site URL:</p>
                    <p className="font-mono text-lg font-semibold text-purple-700">
                      {tenantInfo.tenant.subdomain}.mybabyraffle.com
                    </p>
                  </div>
                )}
              </div>
              
              <div className="space-y-3">
                <Button
                  onClick={handleGoToSite}
                  className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white"
                  size="lg"
                >
                  Go to Your Site
                  <ExternalLink className="h-4 w-4 ml-2" />
                </Button>
                
                <p className="text-xs text-gray-500">
                  Redirecting automatically in a few seconds...
                </p>
              </div>

              <div className="bg-green-50 rounded-lg p-4 text-sm">
                <p className="font-medium text-green-800 mb-2">Next Steps:</p>
                <ul className="text-green-700 space-y-1 text-left">
                  <li>• Upload photos and customize your theme</li>
                  <li>• Set up betting categories and prices</li>
                  <li>• Share your site with family and friends</li>
                  <li>• Watch the predictions roll in!</li>
                </ul>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center space-y-4">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
              <div className="space-y-2">
                <p className="text-gray-600 font-medium">
                  We couldn't complete your signup
                </p>
                <p className="text-sm text-red-600">{error}</p>
              </div>
              
              <div className="space-y-3">
                <Button
                  onClick={handleReturnHome}
                  className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white"
                  size="lg"
                >
                  Try Again
                </Button>
                
                <p className="text-xs text-gray-500">
                  Need help? Contact support at support@mybabyraffle.com
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function AuthCallback() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-2xl border-0">
          <CardHeader className="text-center pb-4">
            <div className="flex justify-center mb-4">
              <div className="bg-gradient-to-r from-pink-500 to-purple-600 rounded-full p-3">
                <Baby className="h-8 w-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Loading...
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-purple-600 mx-auto" />
          </CardContent>
        </Card>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  )
}