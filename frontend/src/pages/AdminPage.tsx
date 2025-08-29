"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CheckCircle, DollarSign, Users, Trophy, RefreshCw, Search, Filter } from "lucide-react"
import { toast } from "sonner"
import { useAdminConfig, useBettingConfig } from "@/hooks/use-config"
import { getBets, getCategories, validateBets } from "@/lib/utils"

interface Bet {
  id: number;
  userName: string;
  userEmail: string;
  userPhone: string | null;
  categoryKey: string;
  betValue: string;
  amount: string;
  validated: boolean;
  paymentReference: string | null;
  venmoTransactionId: string | null;
  createdAt: string;
  validatedAt: string | null;
  validatedBy: string | null;
}

interface CategoryTotal {
  categoryKey: string;
  displayName: string;
  totalAmount: string;
  betCount: number;
}

export default function AdminPage() {
  // Load configuration
  const adminConfig = useAdminConfig()
  const bettingConfig = useBettingConfig()
  
  const [bets, setBets] = useState<Bet[]>([])
  const [categoryTotals, setCategoryTotals] = useState<CategoryTotal[]>([])
  const [selectedBets, setSelectedBets] = useState<number[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isValidating, setIsValidating] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [showValidatedOnly, setShowValidatedOnly] = useState(false)

  useEffect(() => {
    fetchBets()
    fetchCategoryTotals()
  }, [])

  const fetchBets = async () => {
    try {
      const data = await getBets()
      setBets(data.bets)
    } catch (error) {
      console.error('Failed to fetch bets:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchCategoryTotals = async () => {
    try {
      const data = await getCategories()
      setCategoryTotals(data.categories.map((cat: CategoryTotal & { displayName: string }) => ({
        categoryKey: cat.categoryKey,
        displayName: cat.displayName,
        totalAmount: cat.totalAmount || '0',
        betCount: cat.betCount || 0
      })))
    } catch (error) {
      console.error('Failed to fetch category totals:', error)
    }
  }

  const handleValidateBets = async () => {
    if (selectedBets.length === 0) return

    setIsValidating(true)
    try {
      await validateBets(selectedBets, 'admin')
      
      // Refresh data
      await fetchBets()
      await fetchCategoryTotals()
      setSelectedBets([])
      toast.success('Bets validated successfully!')
    } catch (error) {
      console.error('Failed to validate bets:', error)
      toast.error('Failed to validate bets')
    } finally {
      setIsValidating(false)
    }
  }

  const toggleBetSelection = (betId: number) => {
    setSelectedBets(prev => 
      prev.includes(betId) 
        ? prev.filter(id => id !== betId)
        : [...prev, betId]
    )
  }

  const selectAllVisible = () => {
    const visibleBets = getFilteredBets().filter(bet => !bet.validated)
    setSelectedBets(visibleBets.map(bet => bet.id))
  }

  const clearSelection = () => {
    setSelectedBets([])
  }

  const getFilteredBets = () => {
    return bets.filter(bet => {
      const matchesSearch = searchTerm === '' || 
        bet.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bet.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bet.categoryKey.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bet.betValue.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesFilter = !showValidatedOnly || bet.validated
      
      return matchesSearch && matchesFilter
    })
  }

  const getTotalStats = () => {
    const totalBets = bets.length
    const validatedBets = bets.filter(bet => bet.validated).length
    const totalAmount = bets.reduce((sum, bet) => sum + parseFloat(bet.amount), 0)
    const validatedAmount = bets.filter(bet => bet.validated).reduce((sum, bet) => sum + parseFloat(bet.amount), 0)
    
    return { totalBets, validatedBets, totalAmount, validatedAmount }
  }

  const stats = getTotalStats()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading admin panel...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-sans text-3xl font-bold text-foreground">{adminConfig.adminTitle}</h1>
              <p className="text-muted-foreground">Manage bets and validate payments</p>
            </div>
            <Button onClick={() => { fetchBets(); fetchCategoryTotals(); }} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Data
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Bets</p>
                  <p className="text-2xl font-bold">{stats.totalBets}</p>
                </div>
                <Users className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Validated Bets</p>
                  <p className="text-2xl font-bold">{stats.validatedBets}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                  <p className="text-2xl font-bold">${stats.totalAmount.toFixed(2)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Validated Revenue</p>
                  <p className="text-2xl font-bold">${stats.validatedAmount.toFixed(2)}</p>
                </div>
                <Trophy className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="bets" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="bets">Bet Management</TabsTrigger>
            <TabsTrigger value="categories">Category Totals</TabsTrigger>
          </TabsList>

          <TabsContent value="bets" className="space-y-6">
            {/* Controls */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                  <div className="flex gap-4 items-center">
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search bets..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 w-64"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="validated-filter"
                        checked={showValidatedOnly}
                        onCheckedChange={(checked) => setShowValidatedOnly(checked as boolean)}
                      />
                      <Label htmlFor="validated-filter" className="text-sm">
                        Show validated only
                      </Label>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    {selectedBets.length > 0 && (
                      <>
                        <span className="text-sm text-muted-foreground py-2">
                          {selectedBets.length} selected
                        </span>
                        <Button variant="outline" size="sm" onClick={clearSelection}>
                          Clear
                        </Button>
                      </>
                    )}
                    <Button variant="outline" size="sm" onClick={selectAllVisible}>
                      Select All Unvalidated
                    </Button>
                    <Button 
                      onClick={handleValidateBets} 
                      disabled={selectedBets.length === 0 || isValidating}
                      size="sm"
                    >
                      {isValidating ? "Validating..." : `Validate ${selectedBets.length} Bets`}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Bets List */}
            <Card>
              <CardHeader>
                <CardTitle>All Bets ({getFilteredBets().length})</CardTitle>
                <CardDescription>
                  Click checkboxes to select bets for validation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {getFilteredBets().map((bet) => (
                    <div
                      key={bet.id}
                      className={`p-4 border rounded-lg ${
                        bet.validated ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        {!bet.validated && (
                          <Checkbox
                            checked={selectedBets.includes(bet.id)}
                            onCheckedChange={() => toggleBetSelection(bet.id)}
                          />
                        )}
                        
                        <div className="flex-1 grid md:grid-cols-6 gap-4">
                          <div>
                            <p className="font-semibold">{bet.userName}</p>
                            <p className="text-sm text-muted-foreground">{bet.userEmail}</p>
                          </div>
                          
                          <div>
                            <p className="text-sm text-muted-foreground">Category</p>
                            <p className="font-medium">{bet.categoryKey.replace('_', ' ')}</p>
                          </div>
                          
                          <div>
                            <p className="text-sm text-muted-foreground">Bet</p>
                            <p className="font-medium">{bet.betValue}</p>
                          </div>
                          
                          <div>
                            <p className="text-sm text-muted-foreground">Amount</p>
                            <p className="font-medium">${bet.amount}</p>
                          </div>
                          
                          <div>
                            <p className="text-sm text-muted-foreground">Status</p>
                            <Badge variant={bet.validated ? "default" : "secondary"}>
                              {bet.validated ? "Validated" : "Pending"}
                            </Badge>
                          </div>
                          
                          <div>
                            <p className="text-sm text-muted-foreground">Date</p>
                            <p className="text-sm">{new Date(bet.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                      </div>
                      
                      {bet.paymentReference && (
                        <div className="mt-2 pt-2 border-t">
                          <p className="text-sm text-muted-foreground">
                            Payment Ref: {bet.paymentReference}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {getFilteredBets().length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No bets found matching your criteria.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="categories" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Category Totals</CardTitle>
                <CardDescription>
                  Prize pools for each betting category (from validated bets only)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {categoryTotals.map((category) => (
                    <Card key={category.categoryKey} className="border-2">
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <h3 className="font-semibold text-lg mb-2">
                            {category.displayName}
                          </h3>
                          <div className="space-y-2">
                            <div>
                              <p className="text-sm text-muted-foreground">Total Pot</p>
                              <p className="text-2xl font-bold text-green-600">
                                ${category.totalAmount}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Winner Prize ({(bettingConfig.winnerPercentage * 100)}%)</p>
                              <p className="text-lg font-semibold text-primary">
                                ${(parseFloat(category.totalAmount) * bettingConfig.winnerPercentage).toFixed(2)}
                              </p>
                            </div>
                            <Separator />
                            <div>
                              <p className="text-sm text-muted-foreground">Total Bets</p>
                              <p className="font-medium">{category.betCount}</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}