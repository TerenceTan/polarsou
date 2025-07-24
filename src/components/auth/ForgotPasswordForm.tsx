import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Mail, 
  ArrowLeft,
  CheckCircle,
  KeyRound
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

interface ForgotPasswordFormProps {
  onBackToLogin: () => void
  onBack?: () => void
  className?: string
}

const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({
  onBackToLogin,
  onBack,
  className = ''
}) => {
  const { resetPassword, loading } = useAuth()
  const [email, setEmail] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSuccess, setIsSuccess] = useState(false)

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!email) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    const { error } = await resetPassword(email)
    
    if (!error) {
      setIsSuccess(true)
    }
  }

  const handleInputChange = (value: string) => {
    setEmail(value)
    // Clear error when user starts typing
    if (errors.email) {
      setErrors(prev => ({ ...prev, email: '' }))
    }
  }

  if (isSuccess) {
    return (
      <Card className={`w-full max-w-md mx-auto ${className}`}>
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-green-600">
            Email Sent!
          </CardTitle>
          <p className="text-gray-600">
            We've sent password reset instructions to <strong>{email}</strong>
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-800 mb-2">Next Steps:</h3>
            <ol className="text-sm text-blue-700 space-y-1">
              <li>1. Check your email inbox</li>
              <li>2. Click the reset password link</li>
              <li>3. Create a new password</li>
              <li>4. Return here to sign in</li>
            </ol>
          </div>

          <Button
            onClick={onBackToLogin}
            className="w-full"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Sign In
          </Button>

          <div className="text-center">
            <p className="text-xs text-gray-500">
              Didn't receive the email? Check your spam folder or try again.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`w-full max-w-md mx-auto ${className}`}>
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl font-bold flex items-center gap-2">
            <KeyRound className="h-6 w-6 text-orange-600" />
            Reset Password
          </CardTitle>
          {onBack && (
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
        </div>
        <p className="text-gray-600">
          Enter your email address and we'll send you a link to reset your password.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="email"
                type="email"
                placeholder="your.email@example.com"
                value={email}
                onChange={(e) => handleInputChange(e.target.value)}
                className={`pl-10 ${errors.email ? 'border-red-500' : ''}`}
                disabled={loading}
              />
            </div>
            {errors.email && (
              <p className="text-sm text-red-600">{errors.email}</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Sending email...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Send Reset Email
              </div>
            )}
          </Button>
        </form>

        <div className="text-center">
          <Button
            variant="link"
            size="sm"
            onClick={onBackToLogin}
            className="text-blue-600 hover:text-blue-800"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Sign In
          </Button>
        </div>

        <div className="text-center">
          <p className="text-xs text-gray-500">
            Remember your password? Sign in instead.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

export default ForgotPasswordForm

