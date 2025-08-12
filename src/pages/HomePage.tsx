import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Calculator, Users, QrCode, Smartphone, AlertCircle, LogIn, UserPlus, User } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { sessionService, participantService, getServiceStatus } from '@/services'
import { useAuth } from '@/contexts/AuthContext'
import AuthModal from '@/components/auth/AuthModal'
import Footer from '@/components/Footer'
import { toast } from 'sonner'

const HomePage = () => {
  const [sessionName, setSessionName] = useState('')
  const [organizerName, setOrganizerName] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login')
  const navigate = useNavigate()
  const { user, loading } = useAuth()
  const serviceStatus = getServiceStatus()

  // Close auth modal when user logs in
  useEffect(() => {
    if (user && showAuthModal) {
      setShowAuthModal(false)
    }
  }, [user, showAuthModal])

  const handleCreateSession = async () => {
    if (!sessionName.trim()) {
      toast.error('Please enter a bill name')
      return
    }

    // Require user to be logged in
    if (!user) {
      toast.error('Please sign in to create a session')
      setShowAuthModal(true)
      return
    }

    setIsCreating(true)
    try {
      const session = await sessionService.create({
        name: sessionName.trim(),
        organizerName: user.user_metadata?.full_name || user.email || 'Organizer',
        userId: user.id
      })

      // Auto-add the organizer as a participant
      if (user || organizerName.trim()) {
        const participantName = user?.user_metadata?.full_name || organizerName.trim()
        await participantService.add(session.id, {
          name: participantName,
          userId: user?.id || undefined
        })
      }

      toast.success('Session created successfully!')
      navigate(`/session/${session.id}`)
    } catch (error) {
      console.error('Error creating session:', error)
      toast.error('Failed to create session. Please try again.')
    } finally {
      setIsCreating(false)
    }
  }

  const handleAuthAction = (mode: 'login' | 'signup') => {
    setAuthMode(mode)
    setShowAuthModal(true)
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header with Auth */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">polarsou</h1>
          <p className="text-xl text-gray-600 mb-8">Split bills easily with friends and family 🇲🇾</p>
        </div>
        
        <div className="flex items-center gap-3">
          {loading ? (
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          ) : user ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">
                Welcome, {user.user_metadata?.full_name || user.email}!
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/profile')}
              >
                <User className="h-4 w-4 mr-2" />
                Profile
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAuthAction('login')}
              >
                <LogIn className="h-4 w-4 mr-2" />
                Sign In
              </Button>
              <Button
                size="sm"
                onClick={() => handleAuthAction('signup')}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Sign Up
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Service Status Alert */}
      {!serviceStatus.isOnline && (
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Running in offline mode with local storage. Data will be saved locally in your browser.
          </AlertDescription>
        </Alert>
      )}

      {/* User Benefits */}
      {user && (
        <Alert className="mb-6 border-green-200 bg-green-50">
          <User className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <strong>Signed in benefits:</strong> Session history, saved participants, and payment preferences are automatically saved to your account.
          </AlertDescription>
        </Alert>
      )}

      {/* Feature highlights */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="flex flex-col items-center p-4">
          <Calculator className="h-8 w-8 text-blue-600 mb-2" />
          <span className="text-sm font-medium">Smart Calculations</span>
        </div>
        <div className="flex flex-col items-center p-4">
          <Users className="h-8 w-8 text-green-600 mb-2" />
          <span className="text-sm font-medium">Easy Collaboration</span>
        </div>
        <div className="flex flex-col items-center p-4">
          <QrCode className="h-8 w-8 text-purple-600 mb-2" />
          <span className="text-sm font-medium">QR Code Payments</span>
        </div>
        <div className="flex flex-col items-center p-4">
          <Smartphone className="h-8 w-8 text-orange-600 mb-2" />
          <span className="text-sm font-medium">Mobile Optimized</span>
        </div>
      </div>

      {/* Create Session Form */}
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Create New Bill Session</CardTitle>
          <CardDescription>
            Start splitting a bill with your friends
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sessionName">Bill Name *</Label>
            <Input
              id="sessionName"
              placeholder="e.g., Dinner at Restaurant ABC"
              value={sessionName}
              onChange={(e) => setSessionName(e.target.value)}
              disabled={isCreating}
            />
          </div>
          
          {!user && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Sign in required:</strong> You need to sign in to create and manage bill splitting sessions.
              </p>
            </div>
          )}

          <Button 
            onClick={handleCreateSession}
            className="w-full"
            disabled={!sessionName.trim() || isCreating}
          >
            {isCreating ? 'Creating...' : user ? 'Create Session' : 'Sign In to Create Session'}
          </Button>

          {!user && (
            <p className="text-xs text-center text-gray-500">
              <Button
                variant="link"
                size="sm"
                onClick={() => handleAuthAction('signup')}
                className="px-0 h-auto text-xs"
              >
                Create an account
              </Button>
              {' '}to save your sessions and preferences
            </p>
          )}
        </CardContent>
      </Card>

      {/* Features Section */}
      <div className="mt-16 grid md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Malaysian Tax Support
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Automatically handles SST (6%) and service charges (10%) with proper allocation to participants.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              Easy Payments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Support for TouchNGo, GrabPay, DuitNow QR, and bank transfers for seamless payments.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode={authMode}
      />
      
      <Footer />
    </div>
  )
}

export default HomePage

