import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from 'sonner'
import './App.css'

// Import contexts
import AuthProvider from './contexts/AuthContext'

// Import pages
import HomePage from './pages/HomePage'
import SessionPage from './pages/SessionPage'
import ParticipantView from './pages/ParticipantView'
import ProfilePage from './pages/ProfilePage'

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/session/:sessionId" element={<SessionPage />} />
            <Route path="/view/:sessionId" element={<ParticipantView />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Routes>
          <Toaster position="top-center" />
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App

