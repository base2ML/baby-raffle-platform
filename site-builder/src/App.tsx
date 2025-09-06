import React, { useState, useEffect } from 'react';

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

const API_BASE = 'http://localhost:8000';

function App() {
  const [step, setStep] = useState(1);
  const [themes, setThemes] = useState<Theme[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [selectedTheme, setSelectedTheme] = useState<Theme | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [builderData, setBuilderData] = useState({
    siteTitle: 'My Baby Raffle',
    welcomeMessage: 'Welcome to our Baby Raffle!',
    description: 'Join our exciting baby raffle and win amazing prizes!',
    subdomain: ''
  });

  useEffect(() => {
    fetchThemes();
    fetchPackages();
  }, []);

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

  const handleThemeSelect = (theme: Theme) => {
    setSelectedTheme(theme);
  };

  const handleCreateSite = async () => {
    if (!selectedTheme || !selectedPackage || !builderData.subdomain) {
      alert('Please complete all required fields');
      return;
    }

    setLoading(true);
    try {
      // Create initial builder session
      const createResponse = await fetch(`${API_BASE}/api/builder/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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
          }
        }),
      });

      if (createResponse.ok) {
        // Save and create account (mock OAuth for demo)
        const saveResponse = await fetch(`${API_BASE}/api/builder/save-and-create-account`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            subdomain: builderData.subdomain,
            selected_package: selectedPackage,
            owner_name: 'Demo User',
            oauth_provider: 'google',
            oauth_code: 'demo_code'
          }),
        });

        if (saveResponse.ok) {
          const result = await saveResponse.json();
          alert(`🎉 Site created successfully!\n\nPreview: ${result.preview_url}\nAdmin: ${result.admin_url}\nAccess Token: ${result.access_token}`);
          
          // Reset form for next user
          setStep(1);
          setSelectedTheme(null);
          setSelectedPackage('');
          setBuilderData({
            siteTitle: 'My Baby Raffle',
            welcomeMessage: 'Welcome to our Baby Raffle!',
            description: 'Join our exciting baby raffle and win amazing prizes!',
            subdomain: ''
          });
        }
      }
    } catch (error) {
      console.error('Failed to create site:', error);
      alert('Failed to create site. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="step-content">
            <h2>Choose Your Theme</h2>
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
                  onChange={(e) => setBuilderData({...builderData, subdomain: e.target.value.toLowerCase()})}
                  placeholder="myraffle"
                />
                <span>.base2ml.com</span>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="step-content">
            <h2>Select Your Package</h2>
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
        <h1>🍼 Baby Raffle Site Builder</h1>
        <div className="progress-bar">
          <div className={`step ${step >= 1 ? 'active' : ''}`}>1. Theme</div>
          <div className={`step ${step >= 2 ? 'active' : ''}`}>2. Content</div>
          <div className={`step ${step >= 3 ? 'active' : ''}`}>3. Package</div>
        </div>
      </header>

      <main className="main-content">
        {renderStepContent()}
        
        <div className="navigation-buttons">
          {step > 1 && (
            <button onClick={() => setStep(step - 1)} className="btn btn-secondary">
              Previous
            </button>
          )}
          
          {step < 3 && selectedTheme && (
            <button 
              onClick={() => setStep(step + 1)} 
              className="btn btn-primary"
              disabled={step === 2 && !builderData.subdomain}
            >
              Next
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
      </main>
    </div>
  );
}

export default App;