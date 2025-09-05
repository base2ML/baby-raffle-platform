import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { Toaster } from 'sonner';

import { AuthProvider, useAuth } from './hooks/useAuth';
import { SiteBuilderProvider } from './hooks/useSiteBuilder';
import AuthCallback from './pages/AuthCallback';
import SiteBuilder from './pages/SiteBuilder';
import LandingPage from './pages/LandingPage';

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
      </div>
    );
  }
  
  return user ? <>{children}</> : <Navigate to="/" replace />;
};

function App() {
  return (
    <AuthProvider>
      <Elements stripe={stripePromise}>
        <SiteBuilderProvider>
          <Router>
            <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/auth/callback" element={<AuthCallback />} />
                <Route 
                  path="/builder" 
                  element={
                    <ProtectedRoute>
                      <SiteBuilder />
                    </ProtectedRoute>
                  } 
                />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
              <Toaster 
                position="top-right" 
                richColors 
                closeButton 
                theme="light"
              />
            </div>
          </Router>
        </SiteBuilderProvider>
      </Elements>
    </AuthProvider>
  );
}

export default App;