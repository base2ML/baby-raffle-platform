import { Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/sonner'
import LandingPage from './pages/LandingPage'
import BettingPage from './pages/BettingPage'
import AdminPage from './pages/AdminPage'
import ConfirmationPage from './pages/ConfirmationPage'

function App() {
  return (
    <div className="min-h-screen bg-background font-sans antialiased">
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/betting" element={<BettingPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/confirmation" element={<ConfirmationPage />} />
      </Routes>
      <Toaster />
    </div>
  )
}

export default App
