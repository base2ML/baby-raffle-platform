import React, { useState, useEffect } from 'react';
import './App.css';

interface Theme {
  id: string;
  name: string;
  theme_type: string;
  description: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
    border: string;
  };
  typography: {
    heading_font: string;
    body_font: string;
  };
  preview_image_url: string;
  is_premium: boolean;
}

interface Package {
  id: string;
  tier: string;
  name: string;
  description: string;
  price_monthly: number;
  price_yearly: number;
  features: Array<{
    name: string;
    description: string;
    included: boolean;
  }>;
  popular: boolean;
}

interface User {
  id: string;
  email: string;
  name: string;
  site_id?: string;
}

const API_BASE = process.env.NODE_ENV === 'production' 
  ? 'https://api.base2ml.com'
  : 'http://localhost:8000';

function ProductionApp() {
  const [step, setStep] = useState(1);
  const [themes, setThemes] = useState<Theme[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [selectedTheme, setSelectedTheme] = useState<Theme | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  
  const [builderData, setBuilderData] = useState({
    siteTitle: 'My Baby Raffle',
    welcomeMessage: 'Welcome to our Baby Raffle!',
    description: 'Join our exciting baby raffle and win amazing prizes!',
    subdomain: '',
    contactEmail: '',
    socialMedia: {
      instagram: '',
      facebook: ''
    }
  });

  const [bettingCards, setBettingCards] = useState([
    { category: 'Birth Date', price: 5, option1: 'Before Due Date', option2: 'After Due Date' },
    { category: 'Birth Weight', price: 5, option1: 'Under 7 lbs', option2: 'Over 7 lbs' }
  ]);

  const [images, setImages] = useState({
    logo: null as File | null,
    heroImage: null as File | null,
    galleryImages: [] as File[]
  });

  const [paymentInfo, setPaymentInfo] = useState({
    venmo: '',
    paypal: '',
    cashapp: '',
    instructions: 'Please send payment with your name and betting selections.'
  });

  // Check for OAuth callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const error = urlParams.get('error');

    if (token) {
      setAuthToken(token);
      localStorage.setItem('auth_token', token);
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
      fetchUser(token);
    } else if (error) {
      alert(`Authentication failed: ${urlParams.get('message') || 'Unknown error'}`);
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else {
      // Check for stored token
      const storedToken = localStorage.getItem('auth_token');
      if (storedToken) {
        setAuthToken(storedToken);
        fetchUser(storedToken);
      }
    }
  }, []);

  useEffect(() => {
    fetchThemes();
    fetchPackages();
  }, []);

  const fetchUser = async (token: string) => {
    try {
      const response = await fetch(`${API_BASE}/auth/user`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        // Token invalid, remove it
        localStorage.removeItem('auth_token');
        setAuthToken(null);
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
      localStorage.removeItem('auth_token');
      setAuthToken(null);
    }
  };

  const fetchThemes = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/builder/themes`);
      if (response.ok) {
        const data = await response.json();
        setThemes(data);
      }
    } catch (error) {
      console.error('Failed to fetch themes:', error);
    }
  };

  const fetchPackages = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/packages`);
      if (response.ok) {
        const data = await response.json();
        setPackages(data);
      }
    } catch (error) {
      console.error('Failed to fetch packages:', error);
    }
  };

  const sanitizeSubdomain = (value: string): string => {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '')
      .replace(/^-+|-+$/g, '')
      .replace(/-{2,}/g, '-')
      .slice(0, 63);
  };

  const validateSubdomain = (subdomain: string): string | null => {
    if (subdomain.length < 3) return "Subdomain must be at least 3 characters";
    if (subdomain.length > 63) return "Subdomain must be less than 63 characters";
    if (subdomain.startsWith('-') || subdomain.endsWith('-')) return "Subdomain cannot start or end with hyphen";
    if (subdomain.includes('--')) return "Subdomain cannot contain consecutive hyphens";
    return null;
  };

  const handleThemeSelect = (theme: Theme) => {
    setSelectedTheme(theme);
  };

  const initiateGoogleAuth = async () => {
    try {
      const response = await fetch(`${API_BASE}/auth/google`);
      const data = await response.json();
      
      // Redirect to Google OAuth
      window.location.href = data.auth_url;
    } catch (error) {
      console.error('Failed to initiate auth:', error);
      alert('Failed to start authentication process');
    }
  };

  const handleCreateSite = async () => {
    // Validate inputs
    const subdomainError = validateSubdomain(builderData.subdomain);
    if (subdomainError) {
      alert(`Subdomain error: ${subdomainError}`);
      return;
    }

    if (!selectedTheme) {
      alert('Please select a theme');
      return;
    }

    if (!selectedPackage) {
      alert('Please select a package');
      return;
    }

    // Check if user is authenticated
    if (!user || !authToken) {
      alert('Please sign in with Google to create your site');
      initiateGoogleAuth();
      return;
    }

    setLoading(true);
    try {
      // Create builder session first
      const builderResponse = await fetch(`${API_BASE}/api/builder/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          theme: {
            base_theme: selectedTheme.theme_type,
            colors: selectedTheme.colors,
            typography: selectedTheme.typography
          },
          content: {
            site_title: builderData.siteTitle,
            welcome_message: builderData.welcomeMessage,
            description: builderData.description,
            contact_email: builderData.contactEmail,
            social_media: builderData.socialMedia
          },
          images: images,
          betting_cards: bettingCards,
          payment_info: paymentInfo
        }),
      });

      if (!builderResponse.ok) {
        const error = await builderResponse.text();
        throw new Error(error);
      }

      // For production, we don't need a separate OAuth step since user is already authenticated
      const siteResponse = await fetch(`${API_BASE}/api/builder/save-and-create-account`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          subdomain: builderData.subdomain,
          selected_package: selectedPackage,
          oauth_code: 'authenticated', // Already authenticated
          oauth_provider: 'google'
        }),
      });

      if (siteResponse.ok) {
        const result = await siteResponse.json();
        
        // Success - show results and provide admin access
        alert(`🎉 Site Created Successfully!

Site URL: ${result.preview_url}
Admin Portal: ${result.admin_url}
Subdomain: ${result.subdomain}

You can now manage your site through the admin portal!`);

        // Update user with site info
        setUser({...user, site_id: result.site_id});

        // Reset form for potential next site
        setStep(1);
        setSelectedTheme(null);
        setSelectedPackage('');
        setBuilderData({
          siteTitle: 'My Baby Raffle',
          welcomeMessage: 'Welcome to our Baby Raffle!',
          description: 'Join our exciting baby raffle and win amazing prizes!',
          subdomain: '',
          contactEmail: '',
          socialMedia: { instagram: '', facebook: '' }
        });
        setBettingCards([
          { category: 'Birth Date', price: 5, option1: 'Before Due Date', option2: 'After Due Date' },
          { category: 'Birth Weight', price: 5, option1: 'Under 7 lbs', option2: 'Over 7 lbs' }
        ]);
        setImages({ logo: null, heroImage: null, galleryImages: [] });
        setPaymentInfo({ venmo: '', paypal: '', cashapp: '', instructions: 'Please send payment with your name and betting selections.' });
      } else {
        const error = await siteResponse.json();
        throw new Error(error.detail || 'Failed to create site');
      }

    } catch (error) {
      console.error('Site creation failed:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      alert(`❌ Site Creation Failed\n\nError: ${errorMessage}\n\nPlease check the console for more details and try again.`);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    setAuthToken(null);
    setUser(null);
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="step-content">
            <h2>Choose Your Theme</h2>
            <p className="step-description">Select from our professionally designed complementary color themes</p>
            <div className="themes-grid">
              {themes.map((theme) => (
                <div
                  key={theme.id}
                  className={`theme-card ${selectedTheme?.id === theme.id ? 'selected' : ''}`}
                  onClick={() => handleThemeSelect(theme)}
                >
                  <div 
                    className="theme-preview" 
                    style={{
                      background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.secondary})`,
                      color: theme.colors.text
                    }}
                  >
                    <h3 style={{ fontFamily: theme.typography.heading_font }}>{theme.name}</h3>
                    <p style={{ fontFamily: theme.typography.body_font }}>{theme.description}</p>
                  </div>
                  {theme.is_premium && <span className="premium-badge">Premium</span>}
                </div>
              ))}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="step-content">
            <h2>Customize Your Content</h2>
            <p className="step-description">Personalize your site with custom content and contact information</p>
            <div className="form-row">
              <div className="form-group">
                <label>Site Title:</label>
                <input
                  type="text"
                  value={builderData.siteTitle}
                  onChange={(e) => setBuilderData({...builderData, siteTitle: e.target.value})}
                  placeholder="My Baby Raffle"
                />
              </div>
              <div className="form-group">
                <label>Contact Email:</label>
                <input
                  type="email"
                  value={builderData.contactEmail}
                  onChange={(e) => setBuilderData({...builderData, contactEmail: e.target.value})}
                  placeholder="contact@myraffle.com"
                />
              </div>
            </div>
            <div className="form-group">
              <label>Welcome Message:</label>
              <textarea
                value={builderData.welcomeMessage}
                onChange={(e) => setBuilderData({...builderData, welcomeMessage: e.target.value})}
                placeholder="Welcome to our Baby Raffle!"
                rows={3}
              />
            </div>
            <div className="form-group">
              <label>Description:</label>
              <textarea
                value={builderData.description}
                onChange={(e) => setBuilderData({...builderData, description: e.target.value})}
                placeholder="Join our exciting baby raffle and win amazing prizes!"
                rows={4}
              />
            </div>
            <div className="form-group">
              <label>Subdomain:</label>
              <div className="subdomain-input">
                <input
                  type="text"
                  value={builderData.subdomain}
                  onChange={(e) => setBuilderData({...builderData, subdomain: sanitizeSubdomain(e.target.value)})}
                  placeholder="my-baby-raffle"
                />
                <span>.base2ml.com</span>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Instagram Handle:</label>
                <input
                  type="text"
                  value={builderData.socialMedia.instagram}
                  onChange={(e) => setBuilderData({
                    ...builderData, 
                    socialMedia: {...builderData.socialMedia, instagram: e.target.value}
                  })}
                  placeholder="@yourusername"
                />
              </div>
              <div className="form-group">
                <label>Facebook Page:</label>
                <input
                  type="text"
                  value={builderData.socialMedia.facebook}
                  onChange={(e) => setBuilderData({
                    ...builderData,
                    socialMedia: {...builderData.socialMedia, facebook: e.target.value}
                  })}
                  placeholder="Your Page Name"
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="step-content">
            <h2>Select Your Package</h2>
            <p className="step-description">Choose the hosting plan that fits your needs</p>
            <div className="packages-grid">
              {packages.map((pkg) => (
                <div
                  key={pkg.id}
                  className={`package-card ${selectedPackage === pkg.tier ? 'selected' : ''} ${pkg.popular ? 'popular' : ''}`}
                  onClick={() => setSelectedPackage(pkg.tier)}
                >
                  {pkg.popular && <span className="popular-badge">Most Popular</span>}
                  <h3>{pkg.name}</h3>
                  <div className="price">
                    <span className="amount">${pkg.price_monthly}</span>
                    <span className="period">/month</span>
                  </div>
                  <p className="description">{pkg.description}</p>
                  <ul className="features">
                    {pkg.features.map((feature, index) => (
                      <li key={index}>
                        ✓ {feature.name}: {feature.description}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
          <div>
            <h1>🍼 Baby Raffle Site Builder</h1>
          </div>
          <div>
            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{ color: '#6b7280' }}>Welcome, {user.name}!</span>
                {user.site_id && (
                  <button 
                    onClick={() => window.open(`${API_BASE}/admin/${user.site_id}`, '_blank')}
                    className="btn btn-secondary"
                    style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
                  >
                    Admin Portal
                  </button>
                )}
                <button 
                  onClick={handleLogout}
                  className="btn btn-secondary"
                  style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
                >
                  Logout
                </button>
              </div>
            ) : (
              <button 
                onClick={initiateGoogleAuth}
                className="btn btn-primary"
                style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
              >
                Sign in with Google
              </button>
            )}
          </div>
        </div>
        <div className="progress-bar">
          <div className={`step ${step >= 1 ? 'active' : ''}`}>1. Theme</div>
          <div className={`step ${step >= 2 ? 'active' : ''}`}>2. Content</div>
          <div className={`step ${step >= 3 ? 'active' : ''}`}>3. Package</div>
        </div>
      </header>

      <main className="main-content">
        {renderStepContent()}
        
        <div className="navigation-buttons">
          <div>
            {step > 1 && (
              <button onClick={() => setStep(step - 1)} className="btn btn-secondary">
                ← Previous
              </button>
            )}
          </div>
          
          <div>
            {step < 3 && selectedTheme && (
              <button 
                onClick={() => setStep(step + 1)} 
                className="btn btn-primary"
                disabled={step === 2 && !builderData.subdomain}
              >
                Next →
              </button>
            )}
            
            {step === 3 && selectedPackage && (
              <button 
                onClick={handleCreateSite} 
                className="btn btn-success"
                disabled={loading}
              >
                {loading ? 'Creating Site...' : '🚀 Create My Site!'}
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default ProductionApp;