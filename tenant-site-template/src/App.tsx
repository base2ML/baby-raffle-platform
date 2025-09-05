import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';

import HomePage from './pages/HomePage';
import AdminPage from './pages/AdminPage';
import BettingPage from './pages/BettingPage';
import ConfirmationPage from './pages/ConfirmationPage';
import { SiteConfigProvider } from './hooks/useSiteConfig';

// Site configuration will be injected during build process
const SITE_CONFIG = {
  subdomain: '{{SUBDOMAIN}}',
  siteName: '{{SITE_NAME}}',
  parentNames: '{{PARENT_NAMES}}',
  dueDate: '{{DUE_DATE}}',
  venmoAccount: '{{VENMO_ACCOUNT}}',
  primaryColor: '{{PRIMARY_COLOR}}',
  secondaryColor: '{{SECONDARY_COLOR}}',
  description: '{{DESCRIPTION}}',
  apiBaseUrl: '{{API_BASE_URL}}',
  tenantId: '{{TENANT_ID}}',
  slideshowImages: [{{SLIDESHOW_IMAGES}}],
  logoUrl: '{{LOGO_URL}}'
};

// CSS Custom Properties for dynamic theming
const injectCustomStyles = () => {
  const style = document.createElement('style');
  style.textContent = `
    :root {
      --primary-color: ${SITE_CONFIG.primaryColor};
      --secondary-color: ${SITE_CONFIG.secondaryColor};
      --primary-rgb: ${hexToRgb(SITE_CONFIG.primaryColor)};
      --secondary-rgb: ${hexToRgb(SITE_CONFIG.secondaryColor)};
    }
  `;
  document.head.appendChild(style);
};

const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return '0, 0, 0';
  return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
};

function App() {
  const [isConfigured, setIsConfigured] = useState(false);

  useEffect(() => {
    // Inject custom styles for theming
    injectCustomStyles();
    
    // Set up axios defaults
    axios.defaults.baseURL = SITE_CONFIG.apiBaseUrl;
    axios.defaults.headers.common['X-Tenant-ID'] = SITE_CONFIG.tenantId;
    
    setIsConfigured(true);
  }, []);

  if (!isConfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <SiteConfigProvider config={SITE_CONFIG}>
      <Router>
        <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/bet" element={<BettingPage />} />
            <Route path="/confirmation" element={<ConfirmationPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </SiteConfigProvider>
  );
}

export default App;