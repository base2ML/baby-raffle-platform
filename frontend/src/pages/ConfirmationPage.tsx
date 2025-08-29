import { useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, Home } from "lucide-react"
import { Link } from "react-router-dom"

export default function ConfirmationPage() {
  useEffect(() => {
    // Clear any stored form data
    localStorage.removeItem('betData')
  }, [])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full text-center shadow-lg">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-green-100 p-4">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
          </div>
          <CardTitle className="text-2xl text-foreground">Bets Submitted Successfully!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Thank you for participating in our baby raffle! Your bets have been submitted and will be validated once your payment is received.
          </p>
          <p className="text-sm text-muted-foreground">
            You should receive a confirmation email shortly. If you have any questions, please don't hesitate to contact us.
          </p>
          <div className="pt-4">
            <Link to="/">
              <Button size="lg" className="w-full">
                <Home className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
