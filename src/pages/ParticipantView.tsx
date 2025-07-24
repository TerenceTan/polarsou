import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { 
  Users, 
  Receipt, 
  Calculator, 
  Share2,
  ExternalLink,
  CreditCard
} from 'lucide-react'
import { sessionService } from '@/services'
import { formatCurrency } from '@/utils'
import type { Session } from '@/types'

const ParticipantView = () => {
  const { sessionId } = useParams<{ sessionId: string }>()
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Update page title and meta tags for sharing
    document.title = session 
      ? `${session.name} - polarsou Bill Split`
      : 'Bill Summary - polarsou'
    
    // Update meta description for social sharing
    const metaDescription = document.querySelector('meta[name="description"]')
    if (metaDescription && session) {
      metaDescription.setAttribute('content', 
        `View bill split for "${session.name}" on polarsou. ${session.participants.length} participants, ${session.items.length} items.`
      )
    }

    // Update Open Graph tags
    const ogTitle = document.querySelector('meta[property="og:title"]')
    const ogDescription = document.querySelector('meta[property="og:description"]')
    
    if (ogTitle && session) {
      ogTitle.setAttribute('content', `${session.name} - polarsou Bill Split`)
    }
    
    if (ogDescription && session) {
      ogDescription.setAttribute('content', 
        `View bill split for "${session.name}" on polarsou. ${session.participants.length} participants, ${session.items.length} items.`
      )
    }
  }, [session])

  useEffect(() => {
    if (!sessionId) {
      setError('Session ID is required')
      setLoading(false)
      return
    }

    const loadSession = async () => {
      try {
        const sessionData = await sessionService.getById(sessionId)
        setSession(sessionData)
      } catch (err) {
        console.error('Error loading session:', err)
        setError('Failed to load session')
      } finally {
        setLoading(false)
      }
    }

    loadSession()
  }, [sessionId])

  const calculateTotal = () => {
    if (!session?.items.length) return 0
    return session.items.reduce((sum, item) => {
      const itemTotal = item.hasSst ? item.amount * 1.06 : item.amount
      return sum + itemTotal
    }, 0)
  }

  const handleJoinSession = () => {
    window.location.href = `/session/${sessionId}`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading bill summary...</p>
        </div>
      </div>
    )
  }

  if (error || !session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-red-600 mb-4">{error || 'Session not found'}</p>
            <Button onClick={() => window.location.href = '/'}>
              Go to polarsou Home
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {session.name}
          </h1>
          <p className="text-gray-600 mb-4">
            Shared from <span className="font-semibold text-blue-600">polarsou</span> 🇲🇾
          </p>
          <Badge variant="outline" className="mb-4">
            {session.participants.length} participants • {session.items.length} items
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bill Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Bill Items
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {session.items.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  No items added yet
                </p>
              ) : (
                session.items.map((item) => (
                  <div key={item.id} className="flex justify-between items-center p-3 border rounded">
                    <div>
                      <span className="font-medium">{item.name}</span>
                      {item.hasSst && (
                        <Badge variant="secondary" className="ml-2 text-xs">
                          +SST
                        </Badge>
                      )}
                    </div>
                    <span className="font-semibold">
                      {formatCurrency(item.hasSst ? item.amount * 1.06 : item.amount)}
                    </span>
                  </div>
                ))
              )}
              
              {session.items.length > 0 && (
                <>
                  <Separator />
                  <div className="flex justify-between items-center font-bold text-lg">
                    <span>Total</span>
                    <span>{formatCurrency(calculateTotal())}</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Participants */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Participants
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {session.participants.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  No participants added yet
                </p>
              ) : (
                session.participants.map((participant) => (
                  <div key={participant.id} className="flex items-center justify-between p-3 border rounded">
                    <span className="font-medium">{participant.name}</span>
                    <Badge variant="outline">Participant</Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 text-center space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button onClick={handleJoinSession} size="lg">
              <ExternalLink className="h-4 w-4 mr-2" />
              Join This Session
            </Button>
            <Button variant="outline" size="lg" onClick={() => window.location.href = '/'}>
              <Calculator className="h-4 w-4 mr-2" />
              Create New Bill
            </Button>
          </div>
          
          <p className="text-sm text-gray-500">
            Powered by <span className="font-semibold text-blue-600">polarsou</span> - 
            Malaysia's easiest bill splitting app
          </p>
        </div>

        {/* Features Highlight */}
        <Card className="mt-8">
          <CardContent className="pt-6">
            <div className="text-center mb-4">
              <h3 className="text-lg font-semibold mb-2">
                Why choose polarsou? 🇲🇾
              </h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="space-y-2">
                <Calculator className="h-6 w-6 text-blue-600 mx-auto" />
                <p className="text-sm font-medium">Smart SST Calculations</p>
              </div>
              <div className="space-y-2">
                <CreditCard className="h-6 w-6 text-green-600 mx-auto" />
                <p className="text-sm font-medium">TouchNGo & GrabPay</p>
              </div>
              <div className="space-y-2">
                <Receipt className="h-6 w-6 text-purple-600 mx-auto" />
                <p className="text-sm font-medium">Receipt OCR Scanning</p>
              </div>
              <div className="space-y-2">
                <Share2 className="h-6 w-6 text-orange-600 mx-auto" />
                <p className="text-sm font-medium">Easy Sharing</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default ParticipantView

