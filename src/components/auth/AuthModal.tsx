import React, { useState } from 'react'
import LoginForm from './LoginForm'
import SignUpForm from './SignUpForm'
import ForgotPasswordForm from './ForgotPasswordForm'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  initialMode?: 'login' | 'signup'
  className?: string
}

type AuthMode = 'login' | 'signup' | 'forgot-password'

const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login',
  className = ''
}) => {
  const [mode, setMode] = useState<AuthMode>(initialMode)

  if (!isOpen) return null

  const renderForm = () => {
    switch (mode) {
      case 'login':
        return (
          <LoginForm
            onSwitchToSignUp={() => setMode('signup')}
            onForgotPassword={() => setMode('forgot-password')}
            onBack={onClose}
          />
        )
      case 'signup':
        return (
          <SignUpForm
            onSwitchToLogin={() => setMode('login')}
            onBack={onClose}
          />
        )
      case 'forgot-password':
        return (
          <ForgotPasswordForm
            onBackToLogin={() => setMode('login')}
            onBack={onClose}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`w-full max-w-md ${className}`}>
        {renderForm()}
      </div>
    </div>
  )
}

export default AuthModal

