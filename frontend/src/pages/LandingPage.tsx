"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ChevronLeft, ChevronRight, Baby, Gift, Users, Calendar, Heart, Trophy } from "lucide-react"
import { Link } from "react-router-dom"
import SocialShare from "@/components/social-share"
import { useEventConfig, useSocialConfig } from "@/hooks/use-config"
import { useDynamicSlideshow } from "@/hooks/use-dynamic-slideshow"
import { useLiveStats } from "@/hooks/use-live-stats"

// Incentives will be created dynamically in the component using live stats

const rules = [
  {
    icon: <Gift className="h-6 w-6 text-primary" />,
    title: "Bring Diapers, Get Tickets",
    description: "For every pack of diapers you bring, you get one raffle ticket for amazing prizes!",
  },
  {
    icon: <Baby className="h-6 w-6 text-primary" />,
    title: "Make Your Predictions",
    description: "Guess the birth date, weight, length, and more details about our little one.",
  },
  {
    icon: <Users className="h-6 w-6 text-primary" />,
    title: "Join the Fun",
    description: "Register with your details and compete with family and friends.",
  },
  {
    icon: <Calendar className="h-6 w-6 text-primary" />,
    title: "Winners Announced",
    description: "Closest predictions win special prizes after baby arrives!",
  },
]

export default function LandingPage() {
  const [currentSlide, setCurrentSlide] = useState(0)
  
  // Load configuration
  const eventConfig = useEventConfig()
  const socialConfig = useSocialConfig()
  
  // Load dynamic slideshow from folder
  const { slideImages, loading: slideshowLoading, error: slideshowError } = useDynamicSlideshow()
  
  // Load live stats for dynamic prize display
  const { formatMaxPrize, loading: statsLoading, topPrizeCategory } = useLiveStats()

  // Create incentives array with live data
  const incentives = [
    {
      icon: <Trophy className="h-8 w-8 text-primary" />,
      title: "Amazing Prizes",
      description: topPrizeCategory 
        ? `The ${topPrizeCategory.displayName} category currently leads with the biggest prize pool!`
        : "Each category has a prize pool of up to half of the total pot!",
      highlight: statsLoading ? "Loading..." : formatMaxPrize(),
    },
    {
      icon: <Heart className="h-8 w-8 text-secondary" />,
      title: "Easy to Play",
      description: "Just make your predictions add your info and Venmo it to us - it's that simple!",
      highlight: "Takes less than 5 minutes",
    },
    {
      icon: <Users className="h-8 w-8 text-accent" />,
      title: "Sharing is Caring",
      description: "Invite friends to join and help us spread the joy and grow the winnings!",
      highlight: "More friends = better chances",
    },
  ]

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slideImages.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [slideImages.length])

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slideImages.length)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slideImages.length) % slideImages.length)
  }

  // Show loading state while slideshow loads
  if (slideshowLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your baby journey...</p>
        </div>
      </div>
    )
  }

  // Show error state if slideshow fails to load
  if (slideshowError) {
    console.warn('Slideshow error:', slideshowError)
    // Continue with available images or fallback
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Slideshow Section */}
      <section className="relative h-screen overflow-hidden">
        <div className="relative h-full">
          {slideImages && slideImages.length > 0 ? slideImages.map((slide, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-opacity duration-1000 ${
                index === currentSlide ? "opacity-100" : "opacity-0"
              }`}
            >
              <img src={slide.src || "/placeholder.svg"} alt={slide.caption} className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/50" />
            </div>
          )) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20">
              <div className="text-center text-white">
                <Baby className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-xl font-semibold">No slideshow images found</p>
                <p className="text-sm opacity-75">Add images to the slideshow folder to share your journey</p>
              </div>
            </div>
          )}

          {/* Slideshow Controls */}
          {slideImages && slideImages.length > 1 && (
            <>
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/20 p-2 text-white backdrop-blur-sm hover:bg-white/30 transition-colors"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/20 p-2 text-white backdrop-blur-sm hover:bg-white/30 transition-colors"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
            </>
          )}

          {/* Slide Indicators */}
          {slideImages && slideImages.length > 1 && (
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
              {slideImages.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`h-3 w-3 rounded-full transition-colors ${
                    index === currentSlide ? "bg-white" : "bg-white/50"
                  }`}
                />
              ))}
            </div>
          )}

          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-white px-4 max-w-5xl">
              <h1 className="font-sans text-5xl md:text-7xl font-bold mb-4">{eventConfig.eventTitle}</h1>
              <p className="text-2xl md:text-3xl mb-2 leading-relaxed font-medium">
                {slideImages[currentSlide].caption}
              </p>
              <p className="text-lg md:text-xl mb-8 opacity-90 font-light">{slideImages[currentSlide].subtitle}</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link to="/betting">
                  <Button size="lg" className="text-lg px-8 py-6 bg-primary hover:bg-primary/90 shadow-lg">
                    Make Your Predictions Now
                  </Button>
                </Link>
                <div className="inline-block">
                  <SocialShare
                    variant="compact"
                    text={socialConfig.shareText}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-4 bg-card">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-sans text-4xl md:text-5xl font-bold text-foreground mb-6">Why Join Our Raffle?</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              This isn't just any raffle - it's a celebration! Here's what makes it special:
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {incentives.map((incentive, index) => (
              <Card
                key={index}
                className="text-center p-8 hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/20"
              >
                <CardContent className="pt-6">
                  <div className="flex justify-center mb-6">
                    <div className="rounded-full bg-gradient-to-br from-primary/10 to-accent/10 p-6">
                      {incentive.icon}
                    </div>
                  </div>
                  <h3 className="font-sans text-2xl font-bold mb-3 text-foreground">{incentive.title}</h3>
                  <p className="text-muted-foreground leading-relaxed mb-4">{incentive.description}</p>
                  <div className="inline-block bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-semibold">
                    {incentive.highlight}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link to="/betting">
              <Button size="lg" className="text-xl px-12 py-8 shadow-lg">
                Start Playing - It's Free!
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Rules Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-sans text-4xl md:text-5xl font-bold text-foreground mb-6">How It Works</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Join our celebration and help us welcome our little bundle of joy with this fun raffle and prediction
              game!
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {rules.map((rule, index) => (
              <Card key={index} className="text-center p-6 hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex justify-center mb-4">
                    <div className="rounded-full bg-accent/10 p-4">{rule.icon}</div>
                  </div>
                  <h3 className="font-sans text-xl font-semibold mb-3 text-foreground">{rule.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{rule.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 bg-gradient-to-br from-card to-muted">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex justify-center mb-8">
            <div className="rounded-full bg-primary/10 p-8">
              <Heart className="h-16 w-16 text-primary" />
            </div>
          </div>
          <h2 className="font-sans text-4xl md:text-5xl font-bold text-foreground mb-6">Spread the Joy!</h2>
          <p className="text-xl text-muted-foreground leading-relaxed mb-8">
            The more friends who join, the more fun we'll have! Share this raffle with your loved ones and let's make
            this celebration unforgettable.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link to="/betting">
              <Button size="lg" className="text-lg px-8 py-6">
                Join the Celebration
              </Button>
            </Link>
          </div>
          <SocialShare
            variant="expanded"
            text={socialConfig.shareTextExpanded}
            className="max-w-2xl mx-auto"
          />
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-muted py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="font-sans text-2xl font-semibold mb-4 text-foreground">{eventConfig.footerMessage}</h3>
          <p className="text-muted-foreground leading-relaxed">
            {eventConfig.welcomeMessage}
          </p>
        </div>
      </footer>
    </div>
  )
}
