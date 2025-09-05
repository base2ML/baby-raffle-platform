'use client'

import Navigation from '@/components/Navigation'
import HeroSection from '@/components/HeroSection'
import FeaturesSection from '@/components/FeaturesSection'
import GallerySection from '@/components/GallerySection'
import PricingSection from '@/components/PricingSection'
import HowItWorksSection from '@/components/HowItWorksSection'
import GetStartedSection from '@/components/GetStartedSection'
import Footer from '@/components/Footer'

export default function Home() {
  return (
    <main className="min-h-screen">
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