'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  ArrowRight, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  Github, 
  Mail,
  Baby,
  Globe,
  Sparkles
} from 'lucide-react'
import { generateSubdomain, checkSubdomainAvailability } from '@/lib/utils'

export default function GetStartedSection() {
  const [babyName, setBabyName] = useState('')
  const [email, setEmail] = useState('')
  const [subdomain, setSubdomain] = useState('')
  const [isCheckingSubdomain, setIsCheckingSubdomain] = useState(false)
  const [subdomainStatus, setSubdomainStatus] = useState<'available' | 'taken' | 'checking' | null>(null)
  const [selectedPlan, setSelectedPlan] = useState('Premium')

  // Load pre-selected plan from session storage
  useEffect(() => {
    const stored = sessionStorage.getItem('selectedPlan')
    if (stored) {
      setSelectedPlan(stored)
      sessionStorage.removeItem('selectedPlan')
    }
  }, [])

  // Removed auto-generation - let users manually control subdomain

  // Check subdomain availability when it changes
  useEffect(() => {
    if (subdomain && subdomain.length >= 3) {
      setIsCheckingSubdomain(true)
      setSubdomainStatus('checking')
      
      const timeoutId = setTimeout(async () => {
        try {
          const available = await checkSubdomainAvailability(subdomain)
          setSubdomainStatus(available ? 'available' : 'taken')
        } catch (error) {
          setSubdomainStatus('taken')
        }
        setIsCheckingSubdomain(false)
      }, 500)

      return () => clearTimeout(timeoutId)
    }
  }, [subdomain])

  const handleOAuthSignup = (provider: 'google' | 'github') => {
    // Store form data in session storage for use after OAuth
    sessionStorage.setItem('signupData', JSON.stringify({
      babyName,
      email,
      subdomain,
      selectedPlan
    }))
    
    if (provider === 'google') {
      // Real Google OAuth flow - redirect to Google
      const googleClientId = '616947441714-1pvasp7lcp2p8r9c8qnmvbmva2snlnll.apps.googleusercontent.com'
      const redirectUri = encodeURIComponent(`${window.location.origin}/auth/callback`)
      const scope = encodeURIComponent('openid email profile')
      const responseType = 'code'  // Use authorization code flow
      const state = encodeURIComponent(JSON.stringify({ subdomain, babyName, email, selectedPlan }))
      
      const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${googleClientId}&redirect_uri=${redirectUri}&scope=${scope}&response_type=${responseType}&state=${state}&access_type=offline&prompt=consent`
      
      console.log('Redirecting to Google OAuth:', googleAuthUrl)
      window.location.href = googleAuthUrl
    } else {
      // Fallback demo flow for other providers
      const demoSiteUrl = `https://${subdomain}.base2ml.com`
      const demoData = {
        site_url: demoSiteUrl,
        baby_name: babyName,
        email: email,
        plan: selectedPlan,
        provider: provider
      }
      
      const params = new URLSearchParams(demoData)
      window.location.href = `/auth/callback?${params}&demo=true`
    }
  }

  const isFormValid = babyName && email && subdomain && subdomainStatus === 'available'

  return (
    <section id="get-started" className="py-20 bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-pink-100 to-purple-100 rounded-full px-6 py-3 mb-6">
            <Baby className="h-5 w-5 text-pink-500" />
            <span className="text-gray-700 font-medium">Get Started Today</span>
            <Sparkles className="h-5 w-5 text-purple-500" />
          </div>
          
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            Create Your Baby Raffle
            <span className="block bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
              in Under 5 Minutes
            </span>
          </h2>
          
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Fill out the form below to get started. We'll create your beautiful site and 
            you'll be sharing with family and friends in no time!
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            {/* Form */}
            <Card className="shadow-2xl border-0">
              <CardHeader className="text-center pb-6">
                <CardTitle className="text-2xl font-bold text-gray-900">
                  Let's Get Started
                </CardTitle>
                <p className="text-gray-600">
                  Tell us about your celebration and we'll set everything up
                </p>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {/* Baby Name Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Baby Name or Family Name *
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g., Baby Emma or The Johnson Family"
                    value={babyName}
                    onChange={(e) => setBabyName(e.target.value)}
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    This will be used in your site title and URL generation
                  </p>
                </div>

                {/* Email Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Email Address *
                  </label>
                  <Input
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    We'll use this for your account and important updates
                  </p>
                </div>

                {/* Subdomain Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Choose Your Site URL *
                  </label>
                  <div className="flex">
                    <Input
                      type="text"
                      placeholder="your-site-name"
                      value={subdomain}
                      onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                      className="rounded-r-none border-r-0"
                    />
                    <div className="bg-gray-100 border border-l-0 rounded-r-md px-3 py-2 text-sm text-gray-600 flex items-center">
                      .base2ml.com
                    </div>
                  </div>
                  
                  {/* Subdomain Status */}
                  <div className="mt-2 flex items-center space-x-2">
                    {isCheckingSubdomain && (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                        <span className="text-sm text-blue-600">Checking availability...</span>
                      </>
                    )}
                    {subdomainStatus === 'available' && (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm text-green-600 font-medium">
                          {subdomain}.base2ml.com is available!
                        </span>
                      </>
                    )}
                    {subdomainStatus === 'taken' && (
                      <>
                        <AlertCircle className="h-4 w-4 text-red-500" />
                        <span className="text-sm text-red-600">
                          This URL is already taken. Try another one.
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Plan Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Selected Plan
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {['Essential', 'Premium', 'Deluxe'].map((plan) => (
                      <button
                        key={plan}
                        onClick={() => setSelectedPlan(plan)}
                        className={`p-3 text-sm font-medium rounded-lg border-2 transition-all ${
                          selectedPlan === plan
                            ? 'border-purple-500 bg-purple-50 text-purple-700'
                            : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        {plan}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    You can change your plan after signup
                  </p>
                </div>

                {/* OAuth Button */}
                <div className="space-y-3">
                  <Button
                    onClick={() => handleOAuthSignup('google')}
                    disabled={!isFormValid}
                    className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all duration-200"
                    size="lg"
                  >
                    <Mail className="h-5 w-5 mr-3" />
                    Continue with Google
                    <ArrowRight className="h-5 w-5 ml-3" />
                  </Button>
                  
                  <p className="text-xs text-gray-500 text-center">
                    Secure signup with your Google account
                  </p>
                </div>

                <p className="text-xs text-gray-500 text-center">
                  By signing up, you agree to our Terms of Service and Privacy Policy. 
                  30-day money back guarantee.
                </p>
              </CardContent>
            </Card>

            {/* Benefits Sidebar */}
            <div className="space-y-6">
              <Card className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                    <Globe className="h-6 w-6 text-purple-600 mr-2" />
                    What happens next?
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-bold text-purple-600">1</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Instant Setup</p>
                        <p className="text-sm text-gray-600">Your site is created immediately after authentication</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-bold text-purple-600">2</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Customize & Configure</p>
                        <p className="text-sm text-gray-600">Add photos, set betting categories, and personalize your theme</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-bold text-purple-600">3</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Share & Celebrate</p>
                        <p className="text-sm text-gray-600">Send your unique link to family and friends to start the fun</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-gradient-to-r from-pink-50 to-purple-50">
                <CardContent className="p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-3">
                    Why Choose Baby Raffle?
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-gray-700">Setup in under 5 minutes</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-gray-700">Mobile-first, beautiful design</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-gray-700">Secure payment processing</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-gray-700">24/7 customer support</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-gray-700">30-day money back guarantee</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}