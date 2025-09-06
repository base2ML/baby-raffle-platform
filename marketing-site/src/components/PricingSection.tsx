'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Check, Star, Zap, Crown } from 'lucide-react'
import { formatPrice } from '@/lib/utils'

const plans = [
  {
    name: "Essential",
    price: 20,
    monthlyPrice: 10,
    badge: null,
    description: "Perfect for intimate family celebrations",
    features: [
      "Custom subdomain (yourname.base2ml.com)",
      "Up to 4 betting categories",
      "Up to 50 participants",
      "Basic theme customization",
      "Email notifications",
      "Mobile-responsive design",
      "Payment integration (Venmo/PayPal)",
      "Winner management tools",
      "6 months hosting included"
    ],
    color: "border-gray-200",
    buttonClass: "bg-gray-900 hover:bg-gray-800",
    popular: false
  },
  {
    name: "Premium", 
    price: 20,
    monthlyPrice: 10,
    badge: "Most Popular",
    description: "Everything you need for larger celebrations",
    features: [
      "Everything in Essential",
      "Unlimited betting categories",
      "Unlimited participants",
      "Advanced theme customization",
      "Photo gallery & slideshow",
      "Guest comments & messages",
      "Social media sharing tools",
      "Advanced analytics",
      "Email support",
      "12 months hosting included"
    ],
    color: "border-purple-500 ring-2 ring-purple-500 ring-opacity-50",
    buttonClass: "bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700",
    popular: true
  },
  {
    name: "Deluxe",
    price: 20,
    monthlyPrice: 10,
    badge: "Premium",
    description: "For the ultimate celebration experience",
    features: [
      "Everything in Premium", 
      "Custom domain (yourname.com)",
      "White-label branding options",
      "Video message uploads",
      "Advanced winner algorithms", 
      "Custom email templates",
      "Priority support",
      "Site backup & export",
      "Lifetime hosting included",
      "Professional design consultation"
    ],
    color: "border-yellow-400 ring-2 ring-yellow-400 ring-opacity-50",
    buttonClass: "bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600",
    popular: false
  }
]

export default function PricingSection() {
  const handleSelectPlan = (planName: string) => {
    // Scroll to get started section with plan pre-selected
    const element = document.getElementById('get-started')
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
      // Store selected plan in session storage for the form
      sessionStorage.setItem('selectedPlan', planName)
    }
  }

  return (
    <section id="pricing" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            Simple, Transparent
            <span className="block bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
              Pricing for Everyone
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            One-time setup fee plus affordable monthly hosting. No hidden costs, 
            no surprises. Cancel anytime, keep your memories forever.
          </p>
          
          {/* Pricing Badge */}
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-green-100 to-blue-100 rounded-full px-6 py-3">
            <Star className="h-5 w-5 text-green-600" />
            <span className="text-green-800 font-medium">
              {formatPrice(20)} setup + {formatPrice(10)}/month • Cancel anytime
            </span>
            <Star className="h-5 w-5 text-blue-600" />
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid lg:grid-cols-3 gap-8 mb-16">
          {plans.map((plan, index) => (
            <Card key={index} className={`relative overflow-hidden ${plan.color} ${plan.popular ? 'scale-105' : ''} transition-all duration-300 hover:shadow-xl`}>
              {/* Popular Badge */}
              {plan.badge && (
                <div className="absolute top-0 right-0">
                  <div className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-4 py-1 text-sm font-medium rounded-bl-lg">
                    {plan.badge}
                  </div>
                </div>
              )}
              
              <CardHeader className="text-center pb-4">
                <div className="mb-4">
                  {index === 0 && <Zap className="h-10 w-10 mx-auto text-gray-600" />}
                  {index === 1 && <Star className="h-10 w-10 mx-auto text-purple-600" />}
                  {index === 2 && <Crown className="h-10 w-10 mx-auto text-yellow-600" />}
                </div>
                
                <CardTitle className="text-2xl font-bold text-gray-900 mb-2">
                  {plan.name}
                </CardTitle>
                
                <div className="mb-4">
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <span className="text-3xl font-bold text-gray-900">
                      {formatPrice(plan.price)}
                    </span>
                    <span className="text-gray-600">setup</span>
                  </div>
                  <div className="flex items-center justify-center space-x-2">
                    <span className="text-xl font-semibold text-gray-700">
                      {formatPrice(plan.monthlyPrice)}
                    </span>
                    <span className="text-gray-600">/month</span>
                  </div>
                </div>
                
                <p className="text-gray-600 text-sm">
                  {plan.description}
                </p>
              </CardHeader>
              
              <CardContent>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start space-x-3">
                      <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Button
                  className={`w-full ${plan.buttonClass} text-white font-semibold py-3`}
                  onClick={() => handleSelectPlan(plan.name)}
                >
                  Choose {plan.name}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="bg-gray-50 rounded-2xl p-8 md:p-12">
          <h3 className="text-2xl font-bold text-gray-900 text-center mb-8">
            Frequently Asked Questions
          </h3>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">
                What's included in the setup fee?
              </h4>
              <p className="text-gray-600 text-sm">
                Site creation, theme setup, custom subdomain, initial configuration, 
                and all features for your chosen plan.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">
                Can I cancel anytime?
              </h4>
              <p className="text-gray-600 text-sm">
                Yes! Cancel your subscription anytime. Your site stays live for the 
                remaining billing period, then becomes read-only.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">
                What happens to my data?
              </h4>
              <p className="text-gray-600 text-sm">
                You own all your data. Export everything anytime, and keep access 
                to your site's content even after cancellation.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">
                Do you offer refunds?
              </h4>
              <p className="text-gray-600 text-sm">
                Yes! 30-day money-back guarantee on the setup fee if you're not 
                completely satisfied with your site.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}