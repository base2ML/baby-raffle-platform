import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { tenantConfig } from './config/tenant-config';

// Import components
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import BettingPage from './pages/BettingPage';
import LeaderboardPage from './pages/LeaderboardPage';
import AdminPage from './pages/AdminPage';
import { TenantProvider } from './context/TenantContext';

// Apply theme to document root
const applyTheme = () => {
  const root = document.documentElement;
  root.style.setProperty('--primary-color', tenantConfig.siteSettings.theme.primaryColor);
  root.style.setProperty('--secondary-color', tenantConfig.siteSettings.theme.secondaryColor);
  root.style.setProperty('--font-family', tenantConfig.siteSettings.theme.fontFamily);
};

function App() {
  React.useEffect(() => {
    // Set document title
    document.title = tenantConfig.siteSettings.title;
    
    // Set meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', tenantConfig.siteSettings.description);
    } else {
      const meta = document.createElement('meta');
      meta.name = 'description';
      meta.content = tenantConfig.siteSettings.description;
      document.head.appendChild(meta);
    }

    // Apply theme
    applyTheme();
  }, []);

  return (
    <TenantProvider config={tenantConfig}>
      <Router>
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-pink-50">
          <Header />
          
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/bet" element={<BettingPage />} />
              {tenantConfig.siteSettings.features.showLeaderboard && (
                <Route path="/leaderboard" element={<LeaderboardPage />} />
              )}
              <Route path="/admin" element={<AdminPage />} />
            </Routes>
          </main>
          
          <Footer />
          <Toaster position="top-right" richColors />
        </div>
      </Router>
    </TenantProvider>
  );
}

export default App;