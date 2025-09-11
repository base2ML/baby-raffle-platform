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
        // Check if this is a demo flow
        const isDemo = searchParams.get('demo') === 'true'
        
        if (isDemo) {
          // Handle demo flow
          const siteUrl = searchParams.get('site_url')
          const babyName = searchParams.get('baby_name')
          const email = searchParams.get('email')
          const plan = searchParams.get('plan')
          const provider = searchParams.get('provider')
          
          if (!siteUrl || !babyName) {
            setError('Missing required information')
            setStatus('error')
            return
          }
          
          // Extract subdomain from site URL
          const subdomain = siteUrl.replace('https://', '').replace('.base2ml.com', '')
          
          // Create mock tenant info for demo
          setTenantInfo({
            tenant: {
              subdomain: subdomain,
              name: babyName,
              status: 'active'
            },
            user: {
              email: email,
              name: babyName,
              provider: provider
            },
            plan: plan
          })
          
          setStatus('success')
          
          // Redirect to a demo success page after delay
          setTimeout(() => {
            window.location.href = `https://babyraffle.base2ml.com/?demo=${subdomain}&success=true`
          }, 4000)
          
          return
        }
        
        // Real Google OAuth flow (authorization code flow)
        const code = searchParams.get('code')
        const state = searchParams.get('state') 
        const error = searchParams.get('error')

        if (error) {
          setError(`OAuth error: ${error}`)
          setStatus('error')
          return
        }

        if (!code) {
          setError('Authorization code not received from Google')
          setStatus('error')
          return
        }

        console.log('Received OAuth code:', code.substring(0, 20) + '...')

        // Parse state for signup data
        let stateData: any = {}
        if (state) {
          try {
            stateData = JSON.parse(decodeURIComponent(state))
            console.log('Parsed state data:', stateData)
          } catch (e) {
            console.warn('Could not parse state:', e)
          }
        }

        // Get stored signup data as fallback
        const signupData = sessionStorage.getItem('signupData')
        let babyName = stateData.babyName || ''
        let email = stateData.email || ''  
        let subdomain = stateData.subdomain || ''
        let selectedPlan = stateData.selectedPlan || 'Premium'
        
        if (signupData && (!babyName || !email || !subdomain)) {
          const data = JSON.parse(signupData)
          babyName = babyName || data.babyName
          email = email || data.email
          subdomain = subdomain || data.subdomain
          selectedPlan = selectedPlan || data.selectedPlan
          sessionStorage.removeItem('signupData')
        }

        // For now, simulate successful OAuth and redirect to site builder
        // In production, this would exchange the code for tokens via backend
        const mockUserData = {
          email: email || 'user@example.com',
          name: babyName || 'User',
          picture: 'https://via.placeholder.com/150',
          google_id: 'mock_' + Date.now()
        }

        // Create tenant info
        setTenantInfo({
          tenant: {
            subdomain: subdomain,
            name: babyName,
            status: 'active'
          },
          user: mockUserData,
          plan: selectedPlan,
          oauth_data: mockUserData
        })

        // Store user data for site builder
        localStorage.setItem('user_data', JSON.stringify(mockUserData))
        localStorage.setItem('signup_data', JSON.stringify({
          babyName,
          email,
          subdomain,
          selectedPlan,
          oauth_code: code
        }))

        setStatus('success')
        
        // Redirect to site builder after delay
        setTimeout(() => {
          // For now, show success message and redirect back to marketing site
          // In production, this would redirect to the deployed site builder
          const successUrl = `https://babyraffle.base2ml.com/?success=true&oauth=true&subdomain=${subdomain}&name=${encodeURIComponent(babyName)}&step=builder`
          console.log('OAuth successful - redirecting to:', successUrl)
          window.location.href = successUrl
        }, 3000)
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
      // For demo, redirect back to marketing site with success message
      const isDemo = searchParams.get('demo') === 'true'
      if (isDemo) {
        window.location.href = `https://babyraffle.base2ml.com/?demo=${tenantInfo.tenant.subdomain}&success=true`
      } else {
        window.location.href = `https://${tenantInfo.tenant.subdomain}.base2ml.com`
      }
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
                  ✅ Google Authentication Successful!
                </p>
                <p className="text-sm text-gray-500">
                  Taking you to the site builder to customize your site...
                </p>
                {tenantInfo.tenant?.subdomain && (
                  <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-2">Your site will be:</p>
                    <p className="font-mono text-lg font-semibold text-purple-700">
                      {tenantInfo.tenant.subdomain}.base2ml.com
                    </p>
                  </div>
                )}
              </div>
              
              <div className="space-y-3">
                <div className="bg-blue-50 rounded-lg p-4 text-sm">
                  <p className="font-medium text-blue-800 mb-2">What's Next:</p>
                  <ul className="text-blue-700 space-y-1 text-left">
                    <li>🎨 Customize your site design and theme</li>
                    <li>📸 Upload photos and set betting categories</li>
                    <li>💳 Complete payment to publish your site</li>
                    <li>🚀 Share with family and friends!</li>
                  </ul>
                </div>
                
                <p className="text-xs text-gray-500">
                  Redirecting to site builder in 3 seconds...
                </p>
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
                  Need help? Contact support at support@base2ml.com
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