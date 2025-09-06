import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Eye, Save, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

// Components
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import ProgressBar from '../components/builder/ProgressBar';
import ThemeSelector from '../components/builder/ThemeSelector';
import ContentEditor from '../components/builder/ContentEditor';
import ImageUploader from '../components/builder/ImageUploader';
import BettingCardsEditor from '../components/builder/BettingCardsEditor';
import PaymentSetup from '../components/builder/PaymentSetup';
import ReviewStep from '../components/builder/ReviewStep';
import PackageSelection from '../components/builder/PackageSelection';
import PreviewModal from '../components/builder/PreviewModal';

// Hooks and services
import { useSiteBuilder } from '../hooks/useSiteBuilder';
import { useAuth } from '../hooks/useAuth';
import { builderAPI } from '../services/builderAPI';

// Types
import { CustomizationStep, SiteBuilderConfig, ThemeConfig } from '../types/siteBuilder';

const STEPS: CustomizationStep[] = [
  'theme',
  'content',
  'images',
  'betting_cards',
  'payment_info',
  'review'
];

const STEP_TITLES = {
  theme: 'Choose Your Theme',
  content: 'Site Content',
  images: 'Add Images',
  betting_cards: 'Configure Betting',
  payment_info: 'Payment Setup',
  review: 'Review & Launch'
};

const NewSiteBuilder: React.FC = () => {
  const { user, login } = useAuth();
  const [builderId, setBuilderId] = useState<string | null>(null);
  const [builderConfig, setBuilderConfig] = useState<SiteBuilderConfig | null>(null);
  const [currentStep, setCurrentStep] = useState<CustomizationStep>('theme');
  const [availableThemes, setAvailableThemes] = useState<ThemeConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Initialize builder session
  useEffect(() => {
    initializeBuilder();
    loadAvailableThemes();
  }, []);

  const initializeBuilder = async () => {
    try {
      setIsLoading(true);
      
      // Check if we have an existing session or create new one
      const existingBuilderId = localStorage.getItem('site_builder_id');
      
      if (existingBuilderId) {
        // Load existing session
        const config = await builderAPI.getBuilder(existingBuilderId);
        setBuilderId(existingBuilderId);
        setBuilderConfig(config.config);
        setCurrentStep(config.current_step);
      } else {
        // Create new anonymous session
        const result = await builderAPI.createAnonymousBuilder({
          theme: {
            base_theme: 'classic',
            colors: null,
            typography: null,
            custom_css: null
          },
          content: {
            site_title: 'My Baby Raffle',
            welcome_message: 'Join our baby raffle and win amazing prizes!',
            description: 'Guess the baby details and win exciting prizes',
            contact_email: '',
            phone_number: '',
            address: ''
          }
        });
        
        setBuilderId(result.id);
        setBuilderConfig(result.config);
        localStorage.setItem('site_builder_id', result.id);
      }
    } catch (error) {
      console.error('Failed to initialize builder:', error);
      toast.error('Failed to load site builder');
    } finally {
      setIsLoading(false);
    }
  };

  const loadAvailableThemes = async () => {
    try {
      const themes = await builderAPI.getAvailableThemes();
      setAvailableThemes(themes);
    } catch (error) {
      console.error('Failed to load themes:', error);
      toast.error('Failed to load themes');
    }
  };

  const saveProgress = async (updates: Partial<SiteBuilderConfig>) => {
    if (!builderId) return;

    try {
      setIsSaving(true);
      await builderAPI.updateBuilder(builderId, updates);
      
      // Update local state
      setBuilderConfig(prev => prev ? { ...prev, ...updates } : null);
      toast.success('Progress saved!');
    } catch (error) {
      console.error('Failed to save progress:', error);
      toast.error('Failed to save progress');
    } finally {
      setIsSaving(false);
    }
  };

  const generatePreview = async () => {
    if (!builderId) return;

    try {
      const result = await builderAPI.generatePreview(builderId);
      setPreviewUrl(result.preview_url);
      setShowPreview(true);
    } catch (error) {
      console.error('Failed to generate preview:', error);
      toast.error('Failed to generate preview');
    }
  };

  const handleStepComplete = (stepData: any) => {
    const updates = {
      current_step: getNextStep(),
      [currentStep]: stepData
    };
    
    saveProgress(updates);
    
    // Move to next step
    const nextStep = getNextStep();
    if (nextStep) {
      setCurrentStep(nextStep);
    }
  };

  const handleStepBack = () => {
    const prevStep = getPreviousStep();
    if (prevStep) {
      setCurrentStep(prevStep);
    }
  };

  const getNextStep = (): CustomizationStep | null => {
    const currentIndex = STEPS.indexOf(currentStep);
    return currentIndex < STEPS.length - 1 ? STEPS[currentIndex + 1] : null;
  };

  const getPreviousStep = (): CustomizationStep | null => {
    const currentIndex = STEPS.indexOf(currentStep);
    return currentIndex > 0 ? STEPS[currentIndex - 1] : null;
  };

  const getCurrentStepIndex = () => STEPS.indexOf(currentStep);

  const isStepComplete = (step: CustomizationStep) => {
    if (!builderConfig) return false;
    
    switch (step) {
      case 'theme':
        return !!builderConfig.theme;
      case 'content':
        return !!builderConfig.content?.site_title;
      case 'images':
        return true; // Images are optional
      case 'betting_cards':
        return builderConfig.betting_cards?.length > 0;
      case 'payment_info':
        return !!builderConfig.payment_info;
      case 'review':
        return false; // Review is always the final step
      default:
        return false;
    }
  };

  const canProceedToReview = () => {
    return STEPS.slice(0, -1).every(step => isStepComplete(step));
  };

  const handleSaveAndCreateAccount = async (accountData: any) => {
    if (!builderId || !builderConfig) return;

    try {
      setIsSaving(true);
      
      const saveRequest = {
        site_config: builderConfig,
        subdomain: accountData.subdomain,
        owner_name: accountData.ownerName,
        oauth_provider: accountData.provider,
        oauth_code: accountData.code,
        selected_package: accountData.package,
        billing_cycle: accountData.billingCycle
      };

      const result = await builderAPI.saveAndCreateAccount(saveRequest);
      
      // Clear local storage
      localStorage.removeItem('site_builder_id');
      
      // Show success and redirect
      toast.success('Account created successfully!');
      window.location.href = result.admin_url;
      
    } catch (error) {
      console.error('Failed to save and create account:', error);
      toast.error('Failed to create account');
    } finally {
      setIsSaving(false);
    }
  };

  const renderStepContent = () => {
    if (!builderConfig) return null;

    switch (currentStep) {
      case 'theme':
        return (
          <ThemeSelector
            themes={availableThemes}
            selectedTheme={builderConfig.theme}
            onThemeSelect={(theme) => handleStepComplete({ theme })}
          />
        );

      case 'content':
        return (
          <ContentEditor
            content={builderConfig.content}
            onSave={(content) => handleStepComplete({ content })}
            onBack={handleStepBack}
          />
        );

      case 'images':
        return (
          <ImageUploader
            images={builderConfig.images}
            onSave={(images) => handleStepComplete({ images })}
            onBack={handleStepBack}
          />
        );

      case 'betting_cards':
        return (
          <BettingCardsEditor
            bettingCards={builderConfig.betting_cards || []}
            bettingStyle={builderConfig.betting_style}
            onSave={(bettingCards, bettingStyle) => 
              handleStepComplete({ betting_cards: bettingCards, betting_style: bettingStyle })
            }
            onBack={handleStepBack}
          />
        );

      case 'payment_info':
        return (
          <PaymentSetup
            paymentInfo={builderConfig.payment_info}
            onSave={(paymentInfo) => handleStepComplete({ payment_info: paymentInfo })}
            onBack={handleStepBack}
          />
        );

      case 'review':
        return (
          <ReviewStep
            config={builderConfig}
            onSaveAndCreateAccount={handleSaveAndCreateAccount}
            onBack={handleStepBack}
            isAuthenticated={!!user}
            onLogin={login}
          />
        );

      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading site builder...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-r from-pink-500 to-purple-600 rounded-lg p-2">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Baby Raffle Builder</h1>
                <p className="text-sm text-gray-600">Create your personalized raffle site</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={generatePreview}
                className="flex items-center space-x-2"
              >
                <Eye className="h-4 w-4" />
                <span>Preview</span>
              </Button>
              
              {user && (
                <div className="text-sm text-gray-600">
                  Welcome, {user.full_name}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <ProgressBar
            steps={STEPS.map(step => ({
              id: step,
              title: STEP_TITLES[step],
              completed: isStepComplete(step)
            }))}
            currentStep={currentStep}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="p-8">
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  {STEP_TITLES[currentStep]}
                </h2>
                <p className="text-gray-600">
                  Step {getCurrentStepIndex() + 1} of {STEPS.length}
                </p>
              </div>

              {renderStepContent()}

              {/* Auto-save indicator */}
              {isSaving && (
                <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg px-4 py-2 flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                  <span className="text-sm text-gray-600">Saving...</span>
                </div>
              )}
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Preview Modal */}
      {showPreview && previewUrl && (
        <PreviewModal
          previewUrl={previewUrl}
          onClose={() => setShowPreview(false)}
        />
      )}

      {/* Footer */}
      <div className="bg-white border-t mt-16">
        <div className="max-w-4xl mx-auto px-4 py-6 text-center text-sm text-gray-600">
          <p>
            Need help? Contact support at{' '}
            <a href="mailto:support@base2ml.com" className="text-purple-600 hover:underline">
              support@base2ml.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default NewSiteBuilder;