'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  UserPlus, 
  Palette, 
  Share2, 
  Trophy, 
  ArrowRight,
  Clock,
  CheckCircle,
  Sparkles
} from 'lucide-react'

const steps = [
  {
    step: 1,
    icon: UserPlus,
    title: "Sign Up & Choose Your Plan",
    description: "Create your account with Google or GitHub OAuth. Select the perfect plan for your celebration size and needs.",
    time: "2 minutes",
    color: "from-blue-500 to-cyan-500",
    details: [
      "Secure OAuth authentication",
      "Choose your subdomain name",
      "Select plan features",
      "Instant account creation"
    ]
  },
  {
    step: 2,
    icon: Palette,
    title: "Customize Your Site",
    description: "Pick a beautiful theme, add your photos, set up betting categories, and personalize every detail to match your style.",
    time: "10-15 minutes",
    color: "from-purple-500 to-pink-500",
    details: [
      "Choose from 10+ themes",
      "Upload your photos",
      "Set betting categories & prices",
      "Customize colors & fonts"
    ]
  },
  {
    step: 3,
    icon: Share2,
    title: "Share with Family & Friends",
    description: "Send the link to your loved ones. They can easily place bets, make predictions, and join the excitement.",
    time: "Ongoing",
    color: "from-green-500 to-emerald-500",
    details: [
      "Easy social sharing tools",
      "Direct link sharing",
      "Email invitations",
      "Mobile-friendly for all guests"
    ]
  },
  {
    step: 4,
    icon: Trophy,
    title: "Celebrate & Declare Winners",
    description: "After your baby arrives, easily declare winners and celebrate the best predictors with your built-in tools.",
    time: "After birth",
    color: "from-yellow-500 to-orange-500",
    details: [
      "Easy winner selection",
      "Automatic prize calculations",
      "Winner notifications",
      "Celebration tools"
    ]
  }
]

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-20 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            From Idea to Celebration
            <span className="block bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
              in Just Minutes
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Our simple 4-step process gets you from signup to sharing in under 20 minutes. 
            No technical skills required – just your excitement to celebrate!
          </p>
        </div>

        {/* Steps Timeline */}
        <div className="relative">
          {/* Timeline Line - Hidden on mobile */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-300 via-purple-300 via-green-300 to-yellow-300 transform -translate-y-1/2 z-0"></div>
          
          <div className="grid lg:grid-cols-4 gap-8 relative z-10">
            {steps.map((step, index) => {
              const IconComponent = step.icon
              
              return (
                <div key={index} className="text-center">
                  {/* Step Number & Icon */}
                  <div className="relative mb-6">
                    <div className={`inline-flex w-20 h-20 items-center justify-center rounded-full bg-gradient-to-r ${step.color} text-white mb-4 shadow-lg`}>
                      <IconComponent className="h-10 w-10" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center text-sm font-bold text-gray-900 border-2 border-gray-200">
                      {step.step}
                    </div>
                  </div>

                  {/* Card Content */}
                  <Card className="h-full hover:shadow-xl transition-all duration-300 border-0 shadow-md">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-center space-x-2 mb-3">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-500 font-medium">{step.time}</span>
                      </div>
                      
                      <h3 className="text-xl font-bold text-gray-900 mb-3">
                        {step.title}
                      </h3>
                      
                      <p className="text-gray-600 mb-4 leading-relaxed">
                        {step.description}
                      </p>
                      
                      <ul className="space-y-2 text-sm text-gray-600">
                        {step.details.map((detail, detailIndex) => (
                          <li key={detailIndex} className="flex items-center space-x-2">
                            <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                            <span>{detail}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>

                  {/* Arrow - Show on larger screens between steps */}
                  {index < steps.length - 1 && (
                    <div className="hidden lg:block absolute top-10 -right-4 z-20">
                      <ArrowRight className="h-6 w-6 text-gray-400" />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Bottom CTA Section */}
        <div className="mt-20 text-center">
          <div className="bg-white rounded-2xl p-8 md:p-12 shadow-xl border border-gray-200 max-w-4xl mx-auto">
            <div className="flex justify-center mb-6">
              <Sparkles className="h-12 w-12 text-gradient-to-r from-pink-500 to-purple-600" />
            </div>
            
            <h3 className="text-3xl font-bold text-gray-900 mb-4">
              Ready to Start Your Journey?
            </h3>
            
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Join hundreds of families who have created beautiful, memorable celebrations. 
              Your story is unique – your site should be too.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                size="lg"
                onClick={() => document.getElementById('get-started')?.scrollIntoView({ behavior: 'smooth' })}
                className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white px-8 py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                Start Building Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              
              <Button
                variant="outline"
                size="lg"
                onClick={() => document.getElementById('gallery')?.scrollIntoView({ behavior: 'smooth' })}
                className="px-8 py-3 text-lg font-semibold border-2 border-gray-300 hover:border-gray-400"
              >
                See More Examples
              </Button>
            </div>
            
            <div className="mt-6 flex items-center justify-center space-x-4 text-sm text-gray-500">
              <div className="flex items-center space-x-1">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>30-day money back guarantee</span>
              </div>
              <div className="flex items-center space-x-1">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Setup in under 20 minutes</span>
              </div>
              <div className="flex items-center space-x-1">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Cancel anytime</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}