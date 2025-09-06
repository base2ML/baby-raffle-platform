'use client'

import React from 'react'
import Link from 'next/link'
import { Baby, Heart, Mail, MessageCircle, Shield, FileText } from 'lucide-react'

export default function Footer() {
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center space-x-2 mb-4">
              <div className="bg-gradient-to-r from-pink-500 to-purple-600 rounded-full p-2">
                <Baby className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold">Baby Raffle</span>
            </div>
            <p className="text-gray-400 mb-6 leading-relaxed">
              Creating beautiful, memorable baby celebration websites for families worldwide. 
              Share the joy of welcoming new life with the people who matter most.
            </p>
            <div className="flex items-center space-x-2 text-sm text-gray-400">
              <Heart className="h-4 w-4 text-pink-500" />
              <span>Made with love for growing families</span>
            </div>
          </div>

          {/* Product */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Product</h3>
            <ul className="space-y-3">
              <li>
                <button
                  onClick={() => scrollToSection('features')}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Features
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollToSection('pricing')}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Pricing
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollToSection('gallery')}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Examples
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollToSection('how-it-works')}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  How It Works
                </button>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Support</h3>
            <ul className="space-y-3">
              <li>
                <a 
                  href="mailto:support@base2ml.com" 
                  className="text-gray-400 hover:text-white transition-colors flex items-center space-x-2"
                >
                  <Mail className="h-4 w-4" />
                  <span>Email Support</span>
                </a>
              </li>
              <li>
                <a 
                  href="#" 
                  className="text-gray-400 hover:text-white transition-colors flex items-center space-x-2"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>Live Chat</span>
                </a>
              </li>
              <li>
                <a 
                  href="#" 
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Help Center
                </a>
              </li>
              <li>
                <a 
                  href="#" 
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Setup Guide
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Legal</h3>
            <ul className="space-y-3">
              <li>
                <a 
                  href="#" 
                  className="text-gray-400 hover:text-white transition-colors flex items-center space-x-2"
                >
                  <FileText className="h-4 w-4" />
                  <span>Terms of Service</span>
                </a>
              </li>
              <li>
                <a 
                  href="#" 
                  className="text-gray-400 hover:text-white transition-colors flex items-center space-x-2"
                >
                  <Shield className="h-4 w-4" />
                  <span>Privacy Policy</span>
                </a>
              </li>
              <li>
                <a 
                  href="#" 
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Cookie Policy
                </a>
              </li>
              <li>
                <a 
                  href="#" 
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Refund Policy
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-800 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-gray-400 text-sm">
              © 2024 Baby Raffle. All rights reserved. Built with ❤️ for families everywhere.
            </div>
            
            <div className="flex items-center space-x-6 text-sm text-gray-400">
              <div className="flex items-center space-x-2">
                <Shield className="h-4 w-4 text-green-500" />
                <span>Secure & Safe</span>
              </div>
              <div className="flex items-center space-x-2">
                <Heart className="h-4 w-4 text-pink-500" />
                <span>500+ Happy Families</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Gradient Bottom Border */}
      <div className="h-1 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500"></div>
    </footer>
  )
}