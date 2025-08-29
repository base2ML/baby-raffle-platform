"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Share2, Copy, CheckCircle, MessageCircle, Facebook, Twitter, Mail, Link } from "lucide-react"
import { useSocialConfig } from "@/hooks/use-config"

interface SocialShareProps {
  title?: string
  text?: string
  url?: string
  variant?: "default" | "compact" | "expanded"
  className?: string
}

export default function SocialShare({
  title,
  text,
  url,
  variant = "default",
  className = "",
}: SocialShareProps) {
  const [copied, setCopied] = useState(false)
  const socialConfig = useSocialConfig()
  
  const shareUrl = url || (typeof window !== "undefined" ? window.location.origin : "")
  const shareTitle = title || socialConfig.shareTitle
  const shareText = text || socialConfig.shareText

  const shareData = {
    title: shareTitle,
    text: shareText,
    url: shareUrl,
  }

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share(shareData)
      } catch (err) {
        console.log("Error sharing:", err)
      }
    } else {
      // Fallback to copy link
      handleCopyLink()
    }
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy link: ", err)
    }
  }

  const handleFacebookShare = () => {
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`
    window.open(facebookUrl, "_blank", "width=600,height=400")
  }

  const handleTwitterShare = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`
    window.open(twitterUrl, "_blank", "width=600,height=400")
  }

  const handleWhatsAppShare = () => {
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`
    window.open(whatsappUrl, "_blank")
  }

  const handleEmailShare = () => {
    const emailUrl = `mailto:?subject=${encodeURIComponent(shareTitle)}&body=${encodeURIComponent(`${shareText}\n\n${shareUrl}`)}`
    window.open(emailUrl)
  }

  if (variant === "compact") {
    return (
      <div className={`flex gap-2 ${className}`}>
        <Button onClick={handleNativeShare} size="sm" className="flex items-center gap-2">
          <Share2 className="h-4 w-4" />
          Share
        </Button>
        <Button onClick={handleCopyLink} variant="outline" size="sm">
          {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </Button>
      </div>
    )
  }

  if (variant === "expanded") {
    return (
      <Card className={`shadow-lg ${className}`}>
        <CardContent className="p-6">
          <div className="text-center mb-6">
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-primary/10 p-4">
                <Share2 className="h-8 w-8 text-primary" />
              </div>
            </div>
            <h3 className="font-sans text-2xl font-bold text-foreground mb-2">Spread the Joy!</h3>
            <p className="text-muted-foreground">
              Share this raffle with friends and family. The more people who join, the more fun we'll have!
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <Button onClick={handleFacebookShare} variant="outline" className="flex items-center gap-2 bg-transparent">
              <Facebook className="h-4 w-4" />
              Facebook
            </Button>
            <Button onClick={handleTwitterShare} variant="outline" className="flex items-center gap-2 bg-transparent">
              <Twitter className="h-4 w-4" />
              Twitter
            </Button>
            <Button onClick={handleWhatsAppShare} variant="outline" className="flex items-center gap-2 bg-transparent">
              <MessageCircle className="h-4 w-4" />
              WhatsApp
            </Button>
            <Button onClick={handleEmailShare} variant="outline" className="flex items-center gap-2 bg-transparent">
              <Mail className="h-4 w-4" />
              Email
            </Button>
          </div>

          <div className="space-y-3">
            <Button onClick={handleNativeShare} size="lg" className="w-full">
              <Share2 className="h-5 w-5 mr-2" />
              Share with Friends
            </Button>
            <Button onClick={handleCopyLink} variant="outline" size="lg" className="w-full bg-transparent">
              {copied ? (
                <>
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Link Copied!
                </>
              ) : (
                <>
                  <Link className="h-5 w-5 mr-2" />
                  Copy Link
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Default variant
  return (
    <div className={`flex flex-col sm:flex-row gap-3 ${className}`}>
      <Button onClick={handleNativeShare} size="lg" className="flex items-center gap-2">
        <Share2 className="h-5 w-5" />
        Share with Friends
      </Button>
      <Button onClick={handleCopyLink} variant="outline" size="lg" className="flex items-center gap-2 bg-transparent">
        {copied ? (
          <>
            <CheckCircle className="h-5 w-5" />
            Link Copied!
          </>
        ) : (
          <>
            <Copy className="h-5 w-5" />
            Copy Link
          </>
        )}
      </Button>
    </div>
  )
}
