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
    subdomain: '',
    contactEmail: '',
    socialMedia: {
      instagram: '',
      facebook: ''
    }
  });

  const [bettingCards, setBettingCards] = useState([
    { id: 1, category: 'Birth Date', options: ['January 1-15', 'January 16-31', 'February 1-15', 'February 16-28'], price: 5, active: true },
    { id: 2, category: 'Birth Weight', options: ['Under 6 lbs', '6-7 lbs', '7-8 lbs', 'Over 8 lbs'], price: 5, active: true },
    { id: 3, category: 'Birth Time', options: ['Midnight-6AM', '6AM-Noon', 'Noon-6PM', '6PM-Midnight'], price: 5, active: true }
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

  const sanitizeSubdomain = (value: string): string => {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '') // Only allow letters, numbers, and hyphens
      .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
      .replace(/-{2,}/g, '-') // Replace multiple hyphens with single
      .slice(0, 63); // Max subdomain length
  };

  const validateSubdomain = (subdomain: string): string | null => {
    if (!subdomain) return 'Subdomain is required';
    if (subdomain.length < 3) return 'Subdomain must be at least 3 characters';
    if (subdomain.startsWith('-') || subdomain.endsWith('-')) return 'Subdomain cannot start or end with a hyphen';
    if (!/^[a-z0-9-]+$/.test(subdomain)) return 'Subdomain can only contain letters, numbers, and hyphens';
    return null;
  };

  const addBettingCard = () => {
    const newCard = {
      id: Date.now(),
      category: 'New Category',
      options: ['Option 1', 'Option 2', 'Option 3', 'Option 4'],
      price: 5,
      active: true
    };
    setBettingCards([...bettingCards, newCard]);
  };

  const updateBettingCard = (id: number, field: string, value: any) => {
    setBettingCards(cards => cards.map(card => 
      card.id === id ? { ...card, [field]: value } : card
    ));
  };

  const handleFileUpload = (type: 'logo' | 'heroImage' | 'galleryImages', file: File | File[]) => {
    if (type === 'galleryImages' && Array.isArray(file)) {
      setImages(prev => ({ ...prev, galleryImages: [...prev.galleryImages, ...file] }));
    } else if (type !== 'galleryImages' && !Array.isArray(file)) {
      setImages(prev => ({ ...prev, [type]: file }));
    }
  };

  const handleCreateSite = async () => {
    // Validate all required fields
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
      alert('Please select a hosting package');
      return;
    }

    if (!builderData.siteTitle.trim()) {
      alert('Please enter a site title');
      return;
    }

    setLoading(true);
    try {
      // Step 1: Create initial builder session
      console.log('Creating builder session...');
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
            contact_email: builderData.contactEmail,
            instagram: builderData.socialMedia.instagram
          }
        }),
      });

      if (!createResponse.ok) {
        throw new Error(`Failed to create builder session: ${createResponse.status}`);
      }

      const builderSession = await createResponse.json();
      console.log('Builder session created:', builderSession.id);

      // Step 2: Save complete configuration and create account
      console.log('Creating site and account...');
      const saveResponse = await fetch(`${API_BASE}/api/builder/save-and-create-account`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          builder_id: builderSession.id,
          subdomain: builderData.subdomain,
          selected_package: selectedPackage,
          owner_name: 'Demo User',
          oauth_provider: 'google',
          oauth_code: 'demo_code',
          site_config: {
            theme: selectedTheme,
            content: builderData,
            betting_cards: bettingCards,
            payment_info: paymentInfo,
            images: {
              logo: images.logo?.name || null,
              hero: images.heroImage?.name || null,
              gallery_count: images.galleryImages.length
            }
          }
        }),
      });

      if (!saveResponse.ok) {
        const errorText = await saveResponse.text();
        throw new Error(`Failed to create site: ${saveResponse.status} - ${errorText}`);
      }

      const result = await saveResponse.json();
      
      // Show detailed success information
      const successMessage = `🎉 Site Created Successfully!

📍 Your Site Details:
• Site URL: ${result.preview_url}
• Admin Panel: ${result.admin_url}
• Subdomain: ${builderData.subdomain}.base2ml.com

📋 Configuration:
• Theme: ${selectedTheme.name}
• Package: ${selectedPackage}
• Betting Categories: ${bettingCards.length}

🔑 Access Info:
• Tenant ID: ${result.tenant_id}
• Access Token: ${result.access_token}

Note: This is a demonstration. In production, you would receive login credentials and deployment confirmation.`;

      alert(successMessage);
      
      // Reset form for next user
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
        { id: 1, category: 'Birth Date', options: ['January 1-15', 'January 16-31', 'February 1-15', 'February 16-28'], price: 5, active: true },
        { id: 2, category: 'Birth Weight', options: ['Under 6 lbs', '6-7 lbs', '7-8 lbs', 'Over 8 lbs'], price: 5, active: true },
        { id: 3, category: 'Birth Time', options: ['Midnight-6AM', '6AM-Noon', 'Noon-6PM', '6PM-Midnight'], price: 5, active: true }
      ]);
      setImages({ logo: null, heroImage: null, galleryImages: [] });
      setPaymentInfo({ venmo: '', paypal: '', cashapp: '', instructions: 'Please send payment with your name and betting selections.' });

    } catch (error) {
      console.error('Site creation failed:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      alert(`❌ Site Creation Failed\n\nError: ${errorMessage}\n\nPlease check the console for more details and try again.`);
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
            <p className="step-description">Select from our sophisticated color combinations designed by professionals</p>
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
            <p className="step-description">Set up your site's basic information and contact details</p>
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
            <div className="form-row">
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
              <div className="form-group">
                <label>Instagram Handle (optional):</label>
                <input
                  type="text"
                  value={builderData.socialMedia.instagram}
                  onChange={(e) => setBuilderData({
                    ...builderData, 
                    socialMedia: {...builderData.socialMedia, instagram: e.target.value}
                  })}
                  placeholder="@yourhandle"
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="step-content">
            <h2>Upload Images</h2>
            <p className="step-description">Add your logo, hero image, and gallery photos to personalize your site</p>
            <div className="image-upload-section">
              <div className="upload-group">
                <label>Logo (optional):</label>
                <div className="file-upload">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => e.target.files && handleFileUpload('logo', e.target.files[0])}
                  />
                  {images.logo && <span className="file-name">{images.logo.name}</span>}
                </div>
              </div>
              <div className="upload-group">
                <label>Hero Image (main banner):</label>
                <div className="file-upload">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => e.target.files && handleFileUpload('heroImage', e.target.files[0])}
                  />
                  {images.heroImage && <span className="file-name">{images.heroImage.name}</span>}
                </div>
              </div>
              <div className="upload-group">
                <label>Gallery Images (optional):</label>
                <div className="file-upload">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => e.target.files && handleFileUpload('galleryImages', Array.from(e.target.files))}
                  />
                  {images.galleryImages.length > 0 && (
                    <span className="file-count">{images.galleryImages.length} images selected</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="step-content">
            <h2>Configure Betting Cards</h2>
            <p className="step-description">Set up the betting categories and options for your raffle</p>
            <div className="betting-cards-section">
              {bettingCards.map((card) => (
                <div key={card.id} className="betting-card-editor">
                  <div className="card-header">
                    <input
                      type="text"
                      value={card.category}
                      onChange={(e) => updateBettingCard(card.id, 'category', e.target.value)}
                      className="category-input"
                    />
                    <div className="price-input">
                      <span>$</span>
                      <input
                        type="number"
                        value={card.price}
                        onChange={(e) => updateBettingCard(card.id, 'price', parseInt(e.target.value))}
                        min="1"
                      />
                    </div>
                  </div>
                  <div className="options-editor">
                    {card.options.map((option, index) => (
                      <input
                        key={index}
                        type="text"
                        value={option}
                        onChange={(e) => {
                          const newOptions = [...card.options];
                          newOptions[index] = e.target.value;
                          updateBettingCard(card.id, 'options', newOptions);
                        }}
                        className="option-input"
                      />
                    ))}
                  </div>
                </div>
              ))}
              <button onClick={addBettingCard} className="btn btn-secondary add-card-btn">
                + Add Another Category
              </button>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="step-content">
            <h2>Payment Information</h2>
            <p className="step-description">Set up how participants will send payments</p>
            <div className="payment-section">
              <div className="form-row">
                <div className="form-group">
                  <label>Venmo Username:</label>
                  <input
                    type="text"
                    value={paymentInfo.venmo}
                    onChange={(e) => setPaymentInfo({...paymentInfo, venmo: e.target.value})}
                    placeholder="@yourusername"
                  />
                </div>
                <div className="form-group">
                  <label>PayPal Email:</label>
                  <input
                    type="email"
                    value={paymentInfo.paypal}
                    onChange={(e) => setPaymentInfo({...paymentInfo, paypal: e.target.value})}
                    placeholder="your@paypal.com"
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>CashApp Username:</label>
                  <input
                    type="text"
                    value={paymentInfo.cashapp}
                    onChange={(e) => setPaymentInfo({...paymentInfo, cashapp: e.target.value})}
                    placeholder="$yourusername"
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Payment Instructions:</label>
                <textarea
                  value={paymentInfo.instructions}
                  onChange={(e) => setPaymentInfo({...paymentInfo, instructions: e.target.value})}
                  rows={4}
                  placeholder="Please include your name and betting selections when sending payment..."
                />
              </div>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="step-content">
            <h2>Select Your Package</h2>
            <p className="step-description">Choose the hosting plan that best fits your needs</p>
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
          <div className={`step ${step >= 3 ? 'active' : ''}`}>3. Images</div>
          <div className={`step ${step >= 4 ? 'active' : ''}`}>4. Betting</div>
          <div className={`step ${step >= 5 ? 'active' : ''}`}>5. Payment</div>
          <div className={`step ${step >= 6 ? 'active' : ''}`}>6. Package</div>
        </div>
      </header>

      <main className="main-content">
        {renderStepContent()}
        
        <div className="navigation-buttons">
          {step > 1 && (
            <button onClick={() => setStep(step - 1)} className="btn btn-secondary">
              ← Previous
            </button>
          )}
          
          {step < 6 && selectedTheme && (
            <button 
              onClick={() => setStep(step + 1)} 
              className="btn btn-primary"
              disabled={step === 2 && !builderData.subdomain}
            >
              Next →
            </button>
          )}
          
          {step === 6 && selectedPackage && (
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