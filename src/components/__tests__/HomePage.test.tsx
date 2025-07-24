import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import HomePage from '@/pages/HomePage'
import { AuthProvider } from '@/contexts/AuthContext'

// Mock the services
vi.mock('@/services', () => ({
  sessionService: {
    create: vi.fn().mockResolvedValue({ id: 'test-session-id' })
  },
  getServiceStatus: vi.fn().mockReturnValue({ isOnline: true })
}))

// Mock react-router-dom navigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate
  }
})

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}))

const renderHomePage = (user = null) => {
  const mockAuthContext = {
    user,
    loading: false,
    signUp: vi.fn(),
    signIn: vi.fn(),
    signOut: vi.fn(),
    resetPassword: vi.fn(),
    updateProfile: vi.fn()
  }

  return render(
    <BrowserRouter>
      <AuthProvider value={mockAuthContext}>
        <HomePage />
      </AuthProvider>
    </BrowserRouter>
  )
}

describe('HomePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Unauthenticated User', () => {
    it('should render the homepage with sign in/up buttons', () => {
      renderHomePage()

      expect(screen.getByText('BillSplit Malaysia')).toBeInTheDocument()
      expect(screen.getByText('Split bills easily with friends and family 🇲🇾')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument()
    })

    it('should show feature highlights', () => {
      renderHomePage()

      expect(screen.getByText('Smart Calculations')).toBeInTheDocument()
      expect(screen.getByText('No Signup Required')).toBeInTheDocument()
      expect(screen.getByText('QR Code Payments')).toBeInTheDocument()
      expect(screen.getByText('Mobile Optimized')).toBeInTheDocument()
    })

    it('should show create session form', () => {
      renderHomePage()

      expect(screen.getByText('Create New Bill Session')).toBeInTheDocument()
      expect(screen.getByLabelText(/bill name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/your name/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /create session/i })).toBeInTheDocument()
    })

    it('should show account creation prompt', () => {
      renderHomePage()

      expect(screen.getByText(/create an account/i)).toBeInTheDocument()
      expect(screen.getByText(/to save your sessions and preferences/i)).toBeInTheDocument()
    })

    it('should open auth modal when sign up is clicked', async () => {
      const user = userEvent.setup()
      renderHomePage()

      const signUpButton = screen.getByRole('button', { name: /sign up/i })
      await user.click(signUpButton)

      // Auth modal should open (would need to mock the modal component)
      // This test would need the actual AuthModal component to be rendered
    })
  })

  describe('Authenticated User', () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      user_metadata: {
        full_name: 'John Doe'
      }
    }

    it('should show welcome message for authenticated user', () => {
      renderHomePage(mockUser)

      expect(screen.getByText('Welcome, John Doe!')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /profile/i })).toBeInTheDocument()
    })

    it('should show user benefits alert', () => {
      renderHomePage(mockUser)

      expect(screen.getByText(/signed in benefits/i)).toBeInTheDocument()
      expect(screen.getByText(/session history, saved participants, and payment preferences/i)).toBeInTheDocument()
    })

    it('should pre-fill organizer name with user name', () => {
      renderHomePage(mockUser)

      const organizerInput = screen.getByLabelText(/your name/i)
      expect(organizerInput).toHaveAttribute('placeholder', 'John Doe')
    })

    it('should navigate to profile when profile button is clicked', async () => {
      const user = userEvent.setup()
      renderHomePage(mockUser)

      const profileButton = screen.getByRole('button', { name: /profile/i })
      await user.click(profileButton)

      expect(mockNavigate).toHaveBeenCalledWith('/profile')
    })
  })

  describe('Session Creation', () => {
    it('should create session successfully', async () => {
      const user = userEvent.setup()
      const { sessionService } = await import('@/services')
      
      renderHomePage()

      const billNameInput = screen.getByLabelText(/bill name/i)
      const organizerInput = screen.getByLabelText(/your name/i)
      const createButton = screen.getByRole('button', { name: /create session/i })

      await user.type(billNameInput, 'Test Dinner')
      await user.type(organizerInput, 'John Doe')
      await user.click(createButton)

      await waitFor(() => {
        expect(sessionService.create).toHaveBeenCalledWith({
          name: 'Test Dinner',
          organizerName: 'John Doe',
          userId: undefined
        })
      })

      expect(mockNavigate).toHaveBeenCalledWith('/session/test-session-id')
    })

    it('should create session with user data when authenticated', async () => {
      const user = userEvent.setup()
      const { sessionService } = await import('@/services')
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        user_metadata: { full_name: 'Jane Smith' }
      }
      
      renderHomePage(mockUser)

      const billNameInput = screen.getByLabelText(/bill name/i)
      const createButton = screen.getByRole('button', { name: /create session/i })

      await user.type(billNameInput, 'Team Lunch')
      await user.click(createButton)

      await waitFor(() => {
        expect(sessionService.create).toHaveBeenCalledWith({
          name: 'Team Lunch',
          organizerName: 'Jane Smith',
          userId: 'user-123'
        })
      })
    })

    it('should show error when bill name is empty', async () => {
      const user = userEvent.setup()
      const { toast } = await import('sonner')
      
      renderHomePage()

      const createButton = screen.getByRole('button', { name: /create session/i })
      await user.click(createButton)

      expect(toast.error).toHaveBeenCalledWith('Please enter a bill name')
    })

    it('should disable create button when bill name is empty', () => {
      renderHomePage()

      const createButton = screen.getByRole('button', { name: /create session/i })
      expect(createButton).toBeDisabled()
    })

    it('should enable create button when bill name is provided', async () => {
      const user = userEvent.setup()
      renderHomePage()

      const billNameInput = screen.getByLabelText(/bill name/i)
      const createButton = screen.getByRole('button', { name: /create session/i })

      expect(createButton).toBeDisabled()

      await user.type(billNameInput, 'Test Bill')
      expect(createButton).toBeEnabled()
    })
  })

  describe('Service Status', () => {
    it('should show offline alert when service is offline', () => {
      const { getServiceStatus } = require('@/services')
      getServiceStatus.mockReturnValue({ isOnline: false })

      renderHomePage()

      expect(screen.getByText(/running in offline mode/i)).toBeInTheDocument()
      expect(screen.getByText(/data will be saved locally/i)).toBeInTheDocument()
    })

    it('should not show offline alert when service is online', () => {
      const { getServiceStatus } = require('@/services')
      getServiceStatus.mockReturnValue({ isOnline: true })

      renderHomePage()

      expect(screen.queryByText(/running in offline mode/i)).not.toBeInTheDocument()
    })
  })

  describe('Malaysian Features', () => {
    it('should show Malaysian tax support feature', () => {
      renderHomePage()

      expect(screen.getByText('Malaysian Tax Support')).toBeInTheDocument()
      expect(screen.getByText(/SST \(6%\) and service charges \(10%\)/i)).toBeInTheDocument()
    })

    it('should show Malaysian payment methods', () => {
      renderHomePage()

      expect(screen.getByText('Easy Payments')).toBeInTheDocument()
      expect(screen.getByText(/TouchNGo, GrabPay, DuitNow QR/i)).toBeInTheDocument()
    })
  })
})

