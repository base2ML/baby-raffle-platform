'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Smartphone, 
  Shield, 
  Palette, 
  Users, 
  DollarSign, 
  Mail,
  Settings,
  Heart,
  Trophy
} from 'lucide-react'

const features = [
  {
    icon: Smartphone,
    title: "Mobile-First Design",
    description: "Beautiful, responsive sites that work perfectly on all devices. Your guests can participate from anywhere.",
    color: "from-blue-500 to-cyan-500"
  },
  {
    icon: Shield,
    title: "Secure & Reliable",
    description: "Built with enterprise-grade security. Your data and your guests' information are always protected.",
    color: "from-green-500 to-emerald-500"
  },
  {
    icon: Palette,
    title: "Customizable Themes",
    description: "Choose from beautiful pre-designed themes or customize colors, fonts, and layouts to match your style.",
    color: "from-purple-500 to-pink-500"
  },
  {
    icon: Users,
    title: "Easy Guest Management",
    description: "Simple sharing tools and guest management. Track who's participated and manage all bets in one place.",
    color: "from-orange-500 to-red-500"
  },
  {
    icon: DollarSign,
    title: "Payment Integration",
    description: "Seamless Venmo and PayPal integration. Collect payments automatically and track who's paid.",
    color: "from-yellow-500 to-orange-500"
  },
  {
    icon: Mail,
    title: "Automated Notifications",
    description: "Automatic email updates to guests about winners, new bets, and important announcements.",
    color: "from-teal-500 to-green-500"
  },
  {
    icon: Settings,
    title: "Full Admin Control",
    description: "Complete control over categories, pricing, winners, and site settings. Easy admin dashboard included.",
    color: "from-indigo-500 to-purple-500"
  },
  {
    icon: Heart,
    title: "Memory Keepsake",
    description: "Your site becomes a beautiful digital keepsake of this special time, preserving all the predictions and love.",
    color: "from-pink-500 to-rose-500"
  },
  {
    icon: Trophy,
    title: "Winner Management",
    description: "Easy tools to declare winners, calculate prizes, and celebrate the best predictors in your family and friends.",
    color: "from-amber-500 to-yellow-500"
  }
]

export default function FeaturesSection() {
  return (
    <section id="features" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            Everything You Need for the
            <span className="block bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
              Perfect Baby Celebration
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Professional features designed specifically for baby celebrations. 
            Create lasting memories while bringing family and friends together.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const IconComponent = feature.icon
            return (
              <Card 
                key={index} 
                className="group hover:shadow-xl transition-all duration-300 border-0 shadow-md hover:-translate-y-1"
              >
                <CardHeader className="pb-4">
                  <div className={`inline-flex w-12 h-12 items-center justify-center rounded-lg bg-gradient-to-r ${feature.color} mb-4`}>
                    <IconComponent className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-xl font-bold text-gray-900 group-hover:text-gray-700 transition-colors">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-pink-100 to-purple-100 rounded-full px-6 py-3">
            <Heart className="h-5 w-5 text-pink-500" />
            <span className="text-gray-700 font-medium">
              Trusted by families worldwide to create unforgettable celebrations
            </span>
            <Heart className="h-5 w-5 text-purple-500" />
          </div>
        </div>
      </div>
    </section>
  )
}