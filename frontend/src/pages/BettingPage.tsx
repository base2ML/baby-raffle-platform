"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, DollarSign, Plus, Trash2, Trophy, Receipt, Copy, ExternalLink } from "lucide-react"
import { Link, useNavigate } from "react-router-dom"
import SocialShare from "@/components/social-share"
import { useBettingConfig, usePaymentConfig, useSocialConfig, useEventConfig } from "@/hooks/use-config"
import { getCategories, createBets } from "@/lib/utils"

interface BetCategory {
  id: number;
  categoryKey: string;
  displayName: string;
  description: string | null;
  betPrice: string;
  totalAmount: string;
  betCount: number;
}

interface UserBet {
  categoryKey: string;
  betValue: string;
  amount: number;
}

interface BetCard extends BetCategory {
  userBets: UserBet[];
  isExpanded?: boolean;
}

export default function BettingPage() {
  const navigate = useNavigate()
  
  // Load configuration
  const bettingConfig = useBettingConfig()
  const paymentConfig = usePaymentConfig()
  const socialConfig = useSocialConfig()
  const eventConfig = useEventConfig()
  
  const [categories, setCategories] = useState<BetCategory[]>([])
  const [betCards, setBetCards] = useState<BetCard[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showReceiptModal, setShowReceiptModal] = useState(false)
  const [userInfo, setUserInfo] = useState({
    name: '',
    email: '',
    phone: ''
  })
  const [venmoUsername, setVenmoUsername] = useState(paymentConfig.venmoUsername)

  // Fetch categories from API
  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const data = await getCategories()
      setCategories(data.categories)
        
        // Initialize bet cards with default categories or from API
        const initialCards: BetCard[] = data.categories.length > 0 ? 
          data.categories.map((cat: BetCategory) => ({
            ...cat,
            userBets: [],
            isExpanded: false
          })) : 
          getDefaultCategories().map((cat, index) => ({
            id: index + 1,
            categoryKey: cat.categoryKey,
            displayName: cat.displayName,
            description: cat.description,
            betPrice: bettingConfig.pricePerBet.toFixed(2),
            totalAmount: '0',
            betCount: 0,
            userBets: [],
            isExpanded: false
          }))
        
        setBetCards(initialCards)
    } catch (error) {
      console.error('Failed to fetch categories:', error)
      // Fallback to default categories
      const defaultCards = getDefaultCategories().map((cat, index) => ({
        id: index + 1,
        categoryKey: cat.categoryKey,
        displayName: cat.displayName,
        description: cat.description,
        betPrice: '5.00',
        totalAmount: '0',
        betCount: 0,
        userBets: [],
        isExpanded: false
      }))
      setBetCards(defaultCards)
    } finally {
      setIsLoading(false)
    }
  }

  const getDefaultCategories = () => bettingConfig.categories.map(cat => ({
    categoryKey: cat.categoryKey,
    displayName: cat.displayName,
    description: cat.description
  }))

  const getPlaceholderForCategory = (categoryKey: string): string => {
    const category = bettingConfig.categories.find(cat => cat.categoryKey === categoryKey)
    return category?.placeholder || 'Enter your guess'
  }

  const addBet = (categoryKey: string) => {
    setBetCards(prev => prev.map(card => 
      card.categoryKey === categoryKey 
        ? { 
            ...card, 
            userBets: [...card.userBets, { 
              categoryKey, 
              betValue: '', 
              amount: parseFloat(card.betPrice) 
            }],
            isExpanded: true  // Expand only this card when adding a bet
          }
        : card  // Don't modify other cards
    ))
  }

  const toggleCardExpansion = (categoryKey: string) => {
    setBetCards(prev => prev.map(card => 
      card.categoryKey === categoryKey 
        ? { ...card, isExpanded: !card.isExpanded }
        : card  // Keep other cards unchanged
    ))
  }

  const removeBet = (categoryKey: string, betIndex: number) => {
    setBetCards(prev => prev.map(card => 
      card.categoryKey === categoryKey 
        ? { 
            ...card, 
            userBets: card.userBets.filter((_, index) => index !== betIndex)
          }
        : card
    ))
  }

  const updateBetValue = (categoryKey: string, betIndex: number, value: string) => {
    setBetCards(prev => prev.map(card => 
      card.categoryKey === categoryKey 
        ? { 
            ...card, 
            userBets: card.userBets.map((bet, index) => 
              index === betIndex ? { ...bet, betValue: value } : bet
            )
          }
        : card
    ))
  }

  const getTotalBets = () => {
    return betCards.reduce((total, card) => total + card.userBets.length, 0)
  }

  const getTotalAmount = () => {
    return betCards.reduce((total, card) => 
      total + card.userBets.reduce((cardTotal, bet) => cardTotal + bet.amount, 0), 0
    )
  }

  const isFormValid = () => {
    const totalBets = getTotalBets()
    if (totalBets === 0) return false
    
    return betCards.every(card => 
      card.userBets.every(bet => bet.betValue.trim() !== '')
    )
  }

  const handleSubmit = async () => {
    if (!isFormValid()) return
    setShowReceiptModal(true)
  }

  const handleFinalSubmit = async () => {
    if (!userInfo.name || !userInfo.email) return

    setIsSubmitting(true)

    try {
      // Collect all bets
      const allBets: UserBet[] = []
      betCards.forEach(card => {
        card.userBets.forEach(bet => {
          allBets.push(bet)
        })
      })

      // Submit to API
      await createBets({
        userName: userInfo.name,
        userEmail: userInfo.email,
        userPhone: userInfo.phone,
        bets: allBets
      })

      // Show success and redirect
      navigate('/confirmation')
    } catch (error) {
      console.error('Failed to submit bets:', error)
      alert('Failed to submit bets. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const copyVenmoLink = () => {
    const amount = getTotalAmount()
    const venmoUrl = `https://venmo.com/${venmoUsername}?txn=pay&amount=${amount}&note=Baby%20Raffle%20Bet%20-%20${userInfo.name}`
    navigator.clipboard.writeText(venmoUrl)
    alert('Venmo payment link copied to clipboard!')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading betting categories...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <Link
              to="/"
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              Back to Home
            </Link>
            <SocialShare
              variant="compact"
              text={socialConfig.shareText}
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="py-12 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Welcome Section */}
          <div className="text-center mb-12">
            <div className="flex justify-center mb-6">
              <div className="rounded-full bg-primary/10 p-6">
                <Trophy className="h-12 w-12 text-primary" />
              </div>
            </div>
            <h1 className="font-sans text-4xl md:text-5xl font-bold text-foreground mb-4">Place Your Bets!</h1>
            <p className="text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto mb-6">
              Each category costs ${bettingConfig.pricePerBet.toFixed(2)} per bet. The closest guess without going over wins {(bettingConfig.winnerPercentage * 100)}% of that category's total pot!
            </p>
            <div className="flex justify-center gap-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-primary" />
                <span>${bettingConfig.pricePerBet.toFixed(2)} per bet</span>
              </div>
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-primary" />
                <span>Winner takes {(bettingConfig.winnerPercentage * 100)}%</span>
              </div>
            </div>
          </div>

          {/* Betting Summary */}
          {getTotalBets() > 0 && (
            <div className="mb-8">
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="pt-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold text-foreground">Your Current Bets</h3>
                      <p className="text-sm text-muted-foreground">
                        {getTotalBets()} bet{getTotalBets() !== 1 ? 's' : ''} across {betCards.filter(c => c.userBets.length > 0).length} categor{betCards.filter(c => c.userBets.length > 0).length !== 1 ? 'ies' : 'y'}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary">${getTotalAmount().toFixed(2)}</div>
                      <p className="text-sm text-muted-foreground">Total Amount</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Betting Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {betCards.map((card) => (
              <Card key={`betting-card-${card.categoryKey}`} className="shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="font-serif text-xl">{card.displayName}</CardTitle>
                      <CardDescription>{card.description}</CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-primary">${card.betPrice}</div>
                      <div className="text-xs text-muted-foreground">per bet</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Current pot info */}
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="flex justify-between text-sm">
                      <span>Current Pot:</span>
                      <span className="font-semibold">${card.totalAmount}</span>
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Total Bets:</span>
                      <span>{card.betCount}</span>
                    </div>
                  </div>

                  {/* User's bets for this category - Only show if card has bets or is expanded */}
                  {(card.userBets.length > 0 || card.isExpanded) && (
                    <div className="space-y-3">
                      {card.userBets.map((bet, index) => (
                        <div key={`${card.categoryKey}-bet-${index}`} className="flex gap-2 items-end">
                          <div className="flex-1">
                            <Label htmlFor={`bet-${card.categoryKey}-${index}`} className="text-sm">
                              Your Guess {card.userBets.length > 1 ? `#${index + 1}` : ''}
                            </Label>
                            <Input
                              id={`bet-${card.categoryKey}-${index}`}
                              placeholder={getPlaceholderForCategory(card.categoryKey)}
                              value={bet.betValue}
                              onChange={(e) => updateBetValue(card.categoryKey, index, e.target.value)}
                              className="h-10"
                            />
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeBet(card.categoryKey, index)}
                            className="h-10 px-3"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add bet button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addBet(card.categoryKey)}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Bet (+${card.betPrice})
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Submit Section */}
          <div className="text-center">
            <Card className="max-w-md mx-auto shadow-lg">
              <CardContent className="pt-6">
                <div className="flex justify-center mb-4">
                  <div className="rounded-full bg-primary/10 p-4">
                    <Trophy className="h-8 w-8 text-primary" />
                  </div>
                </div>
                <h3 className="font-sans text-xl font-semibold mb-2">Ready to Submit?</h3>
                <p className="text-muted-foreground mb-6">
                  {getTotalBets() > 0 
                    ? `${getTotalBets()} bet${getTotalBets() !== 1 ? 's' : ''} totaling $${getTotalAmount().toFixed(2)}`
                    : 'Add some bets to continue'
                  }
                </p>
                <Button
                  onClick={handleSubmit}
                  size="lg"
                  className="w-full h-12 text-lg"
                  disabled={!isFormValid()}
                >
                  Review & Submit - ${getTotalAmount().toFixed(2)}
                </Button>
                {!isFormValid() && getTotalBets() > 0 && (
                  <p className="text-sm text-muted-foreground mt-2">Please fill in all bet values to continue</p>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="mt-16">
            <SocialShare
              variant="expanded"
              text={socialConfig.shareTextExpanded}
              className="max-w-2xl mx-auto"
            />
          </div>
        </div>
      </main>

      {/* Receipt Modal */}
      <Dialog open={showReceiptModal} onOpenChange={setShowReceiptModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Your Betting Receipt
            </DialogTitle>
            <DialogDescription>
              Review your bets and enter your details to complete registration
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Betting Summary */}
            <Card>
              <CardContent className="pt-4">
                <div className="space-y-2">
                  <div className="flex justify-between font-semibold">
                    <span>Total Bets:</span>
                    <span>{getTotalBets()}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total Amount:</span>
                    <span className="text-primary">${getTotalAmount().toFixed(2)}</span>
                  </div>
                </div>
                <hr className="my-3" />
                <div className="space-y-1 text-sm">
                  {betCards.map(card => 
                    card.userBets.map((bet, index) => (
                      <div key={`${card.categoryKey}-${index}`} className="flex justify-between">
                        <span>{card.displayName}: {bet.betValue}</span>
                        <span>${bet.amount}</span>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* User Info Form */}
            <div className="space-y-3">
              <div>
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={userInfo.name}
                  onChange={(e) => setUserInfo(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter your full name"
                />
              </div>
              <div>
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={userInfo.email}
                  onChange={(e) => setUserInfo(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Enter your email"
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={userInfo.phone}
                  onChange={(e) => setUserInfo(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="Enter your phone number"
                />
              </div>
            </div>

            {/* Payment Instructions */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-4">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <ExternalLink className="h-4 w-4" />
                  Payment Instructions
                </h4>
                <p className="text-sm mb-3">
                  {paymentConfig.paymentInstructions} <strong>${getTotalAmount().toFixed(2)}</strong> to:
                </p>
                <div className="flex items-center gap-2 mb-3">
                  <code className="bg-white px-2 py-1 rounded text-sm font-mono border">
                    {venmoUsername}
                  </code>
                  <Button size="sm" variant="outline" onClick={copyVenmoLink}>
                    <Copy className="h-3 w-3 mr-1" />
                    Copy Link
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {paymentConfig.paymentNote}
                </p>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setShowReceiptModal(false)}
                className="flex-1"
              >
                Back to Edit
              </Button>
              <Button
                onClick={handleFinalSubmit}
                disabled={!userInfo.name || !userInfo.email || isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Bets'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

