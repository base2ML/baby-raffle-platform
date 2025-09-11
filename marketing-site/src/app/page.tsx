'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { CheckCircle, X } from 'lucide-react'
import Navigation from '@/components/Navigation'
import HeroSection from '@/components/HeroSection'
import FeaturesSection from '@/components/FeaturesSection'
import GallerySection from '@/components/GallerySection'
import PricingSection from '@/components/PricingSection'
import HowItWorksSection from '@/components/HowItWorksSection'
import GetStartedSection from '@/components/GetStartedSection'
import Footer from '@/components/Footer'

function SuccessBanner() {
  const searchParams = useSearchParams()
  const [showSuccessBanner, setShowSuccessBanner] = useState(false)
  const [demoSubdomain, setDemoSubdomain] = useState('')
  const [isRealOAuth, setIsRealOAuth] = useState(false)
  const [currentStep, setCurrentStep] = useState('')

  useEffect(() => {
    const success = searchParams.get('success')
    const demo = searchParams.get('demo')
    const subdomain = searchParams.get('subdomain')
    const oauth = searchParams.get('oauth')
    const step = searchParams.get('step')
    
    if (success === 'true' && (demo || subdomain)) {
      setShowSuccessBanner(true)
      setDemoSubdomain(demo || subdomain || '')
      setIsRealOAuth(oauth === 'true')
      setCurrentStep(step || 'success')
      
      // Auto-hide after 20 seconds for OAuth builder step (more time to read)
      setTimeout(() => {
        setShowSuccessBanner(false)
      }, step === 'builder' ? 20000 : oauth === 'true' ? 15000 : 10000)
    }
  }, [searchParams])

  if (!showSuccessBanner) return null

  return (
    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-200 p-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <CheckCircle className="h-6 w-6 text-green-600" />
          <div>
            <p className="text-green-800 font-semibold">
              {currentStep === 'builder' ? (
                <>🎨 Ready to customize your baby raffle site!</>
              ) : (
                <>🎉 {isRealOAuth ? 'Google sign-in successful!' : 'Congratulations!'} Your baby raffle site would be created at:</>
              )}
            </p>
            <p className="text-green-700 font-mono">
              https://{demoSubdomain}.base2ml.com
            </p>
            <p className="text-sm text-green-600 mt-1">
              {currentStep === 'builder' ? (
                <>✅ OAuth complete! Next: Site Builder → Payment Portal → Live Site. Full platform launching soon! <a href="#get-started" className="underline ml-1">Join our waitlist</a></>
              ) : isRealOAuth ? (
                <>✅ Real Google OAuth completed! This shows the full platform is coming soon. <a href="#get-started" className="underline ml-1">Join our waitlist</a></>
              ) : (
                <>This is a demo - the full platform is coming soon! <a href="#get-started" className="underline ml-1">Join our waitlist</a></>
              )}
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowSuccessBanner(false)}
          className="text-green-600 hover:text-green-800 p-1"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}

export default function Home() {
  return (
    <main className="min-h-screen">
      <Suspense fallback={null}>
        <SuccessBanner />
      </Suspense>
      
      <Navigation />
      <HeroSection />
      <FeaturesSection />
      <GallerySection />
      <PricingSection />
      <HowItWorksSection />
      <GetStartedSection />
      <Footer />
    </main>
  )
}