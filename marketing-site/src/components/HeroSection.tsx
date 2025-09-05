'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { ArrowRight, Heart, Users, Trophy, Sparkles } from 'lucide-react'
import Image from 'next/image'

export default function HeroSection() {
  const scrollToGetStarted = () => {
    const element = document.getElementById('get-started')
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <section className="pt-20 pb-16 lg:pt-28 lg:pb-20 bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          {/* Badge */}
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-pink-100 to-purple-100 rounded-full px-4 py-2 mb-8">
            <Sparkles className="h-4 w-4 text-pink-500" />
            <span className="text-sm font-medium text-gray-700">
              Create Beautiful Baby Betting Sites in Minutes
            </span>
            <Sparkles className="h-4 w-4 text-purple-500" />
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
            Share the Joy of
            <span className="block bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
              Welcoming Life
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-4xl mx-auto leading-relaxed">
            Create custom baby raffle websites where friends and family can make predictions 
            about your little one's arrival. Beautiful, secure, and designed for celebration.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <Button
              onClick={scrollToGetStarted}
              size="lg"
              className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white px-8 py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
            >
              Create Your Site Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => document.getElementById('gallery')?.scrollIntoView({ behavior: 'smooth' })}
              className="px-8 py-3 text-lg font-semibold border-2 border-gray-300 hover:border-gray-400"
            >
              View Examples
            </Button>
          </div>

          {/* Social Proof */}
          <div className="flex flex-wrap justify-center items-center gap-8 text-gray-500 mb-16">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-pink-500" />
              <span className="text-sm font-medium">500+ Happy Families</span>
            </div>
            <div className="flex items-center space-x-2">
              <Heart className="h-5 w-5 text-red-500" />
              <span className="text-sm font-medium">10,000+ Predictions Made</span>
            </div>
            <div className="flex items-center space-x-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              <span className="text-sm font-medium">Celebrating Since 2024</span>
            </div>
          </div>
        </div>

        {/* Hero Visual */}
        <div className="relative max-w-5xl mx-auto">
          <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200">
            {/* Browser Chrome */}
            <div className="bg-gray-100 px-4 py-3 flex items-center space-x-2 border-b border-gray-200">
              <div className="flex space-x-2">
                <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
              </div>
              <div className="flex-1 bg-gray-200 rounded-md px-3 py-1 text-sm text-gray-600 text-center">
                sarah-and-mike.mybabyraffle.com
              </div>
            </div>
            
            {/* Screenshot Mockup */}
            <div className="p-8 bg-gradient-to-br from-pink-50 to-purple-50">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  Welcome Baby Emma!
                </h2>
                <p className="text-lg text-gray-600">
                  Make your predictions about our little one's arrival
                </p>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-3">Birth Date</h3>
                  <div className="space-y-2 text-sm text-gray-600">
                    <p>• March 15, 2024 - Sarah M.</p>
                    <p>• March 18, 2024 - Mike's Mom</p>
                    <p>• March 12, 2024 - Alex K.</p>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-3">Birth Weight</h3>
                  <div className="space-y-2 text-sm text-gray-600">
                    <p>• 7 lbs 4 oz - Grandma</p>
                    <p>• 8 lbs 2 oz - Uncle Tom</p>
                    <p>• 6 lbs 15 oz - Jessica</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Floating Elements */}
          <div className="absolute -top-4 -left-4 w-20 h-20 bg-gradient-to-r from-pink-400 to-red-400 rounded-full opacity-20 animate-float"></div>
          <div className="absolute -top-2 -right-8 w-16 h-16 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full opacity-20 animate-float" style={{ animationDelay: '1s' }}></div>
          <div className="absolute -bottom-6 -left-8 w-24 h-24 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full opacity-20 animate-float" style={{ animationDelay: '2s' }}></div>
          <div className="absolute -bottom-4 -right-4 w-12 h-12 bg-gradient-to-r from-green-400 to-teal-400 rounded-full opacity-20 animate-float" style={{ animationDelay: '0.5s' }}></div>
        </div>
      </div>
    </section>
  )
}