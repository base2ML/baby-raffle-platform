'use client'

import React, { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { ExternalLink, Eye, Heart, Users, Calendar } from 'lucide-react'

const galleryItems = [
  {
    id: 1,
    title: "Sarah & Mike's Baby Emma",
    subdomain: "sarah-and-mike",
    theme: "Sunset Garden",
    participants: 47,
    totalBets: 134,
    image: "/gallery/emma-site.jpg",
    description: "A beautiful garden-themed site with warm sunset colors, perfect for welcoming baby Emma.",
    features: ["Custom photo slideshow", "Venmo payments", "4 betting categories", "Winner tracking"],
    colors: ["from-pink-400", "to-orange-400"]
  },
  {
    id: 2,
    title: "The Johnson Family Baby",
    subdomain: "johnson-family-baby",
    theme: "Ocean Breeze",
    participants: 63,
    totalBets: 189,
    image: "/gallery/johnson-site.jpg",
    description: "Clean, modern design with ocean-inspired colors celebrating the newest Johnson family member.",
    features: ["Multi-language support", "PayPal integration", "6 betting categories", "Email notifications"],
    colors: ["from-blue-400", "to-teal-400"]
  },
  {
    id: 3,
    title: "Baby Rodriguez Arrival",
    subdomain: "baby-rodriguez",
    theme: "Forest Dreams",
    participants: 35,
    totalBets: 98,
    image: "/gallery/rodriguez-site.jpg", 
    description: "Nature-inspired design with forest greens and earth tones for a peaceful, natural feel.",
    features: ["Custom betting options", "Photo gallery", "Social sharing", "Mobile optimized"],
    colors: ["from-green-400", "to-emerald-400"]
  },
  {
    id: 4,
    title: "Welcome Baby Chen",
    subdomain: "welcome-baby-chen",
    theme: "Lavender Fields",
    participants: 52,
    totalBets: 156,
    image: "/gallery/chen-site.jpg",
    description: "Elegant lavender and purple theme with sophisticated typography and clean layouts.",
    features: ["Custom domain", "Advanced analytics", "Guest comments", "Prize management"],
    colors: ["from-purple-400", "to-pink-400"]
  },
  {
    id: 5,
    title: "Little Star Thompson",
    subdomain: "little-star-thompson", 
    theme: "Starry Night",
    participants: 71,
    totalBets: 213,
    image: "/gallery/thompson-site.jpg",
    description: "Magical star-themed design with deep blues and gold accents, perfect for a little star.",
    features: ["Night mode", "Animated backgrounds", "Video messages", "Gift registry"],
    colors: ["from-indigo-400", "to-purple-400"]
  },
  {
    id: 6,
    title: "Baby Miller's Journey",
    subdomain: "baby-millers-journey",
    theme: "Spring Meadow",
    participants: 28,
    totalBets: 82,
    image: "/gallery/miller-site.jpg",
    description: "Fresh spring colors with flower motifs celebrating new life and new beginnings.",
    features: ["Countdown timer", "Guest book", "Photo uploads", "Memory timeline"],
    colors: ["from-yellow-400", "to-green-400"]
  }
]

export default function GallerySection() {
  const [selectedItem, setSelectedItem] = useState<typeof galleryItems[0] | null>(null)

  return (
    <section id="gallery" className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            Beautiful Sites Created by
            <span className="block bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
              Families Like Yours
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            See how real families are using Baby Raffle to create stunning, memorable experiences 
            for their loved ones. Each site is unique and tells a beautiful story.
          </p>
        </div>

        {/* Gallery Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {galleryItems.map((item) => (
            <Card key={item.id} className="group overflow-hidden hover:shadow-2xl transition-all duration-300 border-0 shadow-lg hover:-translate-y-2">
              <div className={`h-48 bg-gradient-to-br ${item.colors[0]} ${item.colors[1]} relative overflow-hidden`}>
                {/* Placeholder for actual site screenshot */}
                <div className="absolute inset-0 bg-white/10 backdrop-blur-sm flex items-center justify-center">
                  <div className="text-center text-white">
                    <div className="text-2xl font-bold mb-2">{item.title}</div>
                    <div className="text-sm opacity-90">{item.subdomain}.mybabyraffle.com</div>
                  </div>
                </div>
                
                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        variant="secondary" 
                        size="sm"
                        onClick={() => setSelectedItem(item)}
                        className="bg-white/90 text-gray-900 hover:bg-white"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <div className="space-y-6">
                        <div className={`h-40 bg-gradient-to-br ${item.colors[0]} ${item.colors[1]} rounded-lg flex items-center justify-center`}>
                          <div className="text-center text-white">
                            <div className="text-xl font-bold mb-1">{item.title}</div>
                            <div className="text-sm opacity-90">{item.subdomain}.mybabyraffle.com</div>
                          </div>
                        </div>
                        
                        <div>
                          <h3 className="text-2xl font-bold text-gray-900 mb-2">{item.title}</h3>
                          <p className="text-gray-600 mb-4">{item.description}</p>
                          
                          <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="flex items-center space-x-2">
                              <Users className="h-5 w-5 text-blue-500" />
                              <span className="text-sm text-gray-600">{item.participants} participants</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Calendar className="h-5 w-5 text-green-500" />
                              <span className="text-sm text-gray-600">{item.totalBets} total bets</span>
                            </div>
                          </div>
                          
                          <div className="mb-6">
                            <h4 className="font-semibold text-gray-900 mb-2">Key Features:</h4>
                            <ul className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                              {item.features.map((feature, idx) => (
                                <li key={idx} className="flex items-center space-x-2">
                                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                                  <span>{feature}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                          
                          <Button 
                            className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
                            onClick={() => document.getElementById('get-started')?.scrollIntoView({ behavior: 'smooth' })}
                          >
                            Create Your Own Site Like This
                            <ExternalLink className="h-4 w-4 ml-2" />
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
              
              <CardContent className="p-6">
                <h3 className="font-bold text-lg text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm mb-4">{item.description}</p>
                
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center space-x-3">
                    <span className="flex items-center space-x-1">
                      <Users className="h-4 w-4" />
                      <span>{item.participants}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Heart className="h-4 w-4" />
                      <span>{item.totalBets}</span>
                    </span>
                  </div>
                  <span className="font-medium text-gray-700">{item.theme}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center">
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200 max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Ready to Create Your Own?
            </h3>
            <p className="text-gray-600 mb-6">
              Join hundreds of families who have created beautiful, memorable baby celebration sites. 
              Your unique story deserves a unique site.
            </p>
            <Button 
              size="lg"
              onClick={() => document.getElementById('get-started')?.scrollIntoView({ behavior: 'smooth' })}
              className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white px-8 py-3"
            >
              Start Building Now
              <ExternalLink className="h-5 w-5 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}