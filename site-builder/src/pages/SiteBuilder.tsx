import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { useSiteBuilder } from '../hooks/useSiteBuilder';
import { useAuth } from '../hooks/useAuth';

import StepProgress from '../components/StepProgress';
import SubdomainStep from '../components/steps/SubdomainStep';
import ImagesStep from '../components/steps/ImagesStep';
import ParentInfoStep from '../components/steps/ParentInfoStep';
import VenmoStep from '../components/steps/VenmoStep';
import SettingsStep from '../components/steps/SettingsStep';
import PreviewStep from '../components/steps/PreviewStep';
import PaymentStep from '../components/steps/PaymentStep';
import DeploymentStep from '../components/steps/DeploymentStep';

const TOTAL_STEPS = 8;

const stepTitles = [
  'Choose Subdomain',
  'Upload Images', 
  'Parent Information',
  'Payment Setup',
  'Site Settings',
  'Preview Site',
  'Payment',
  'Deploy & Launch'
];

const SiteBuilder: React.FC = () => {
  const { currentStep, setCurrentStep } = useSiteBuilder();
  const { user, logout } = useAuth();

  const handleNextStep = () => {
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <SubdomainStep onNext={handleNextStep} />;
      case 2:
        return <ImagesStep onNext={handleNextStep} onBack={handlePreviousStep} />;
      case 3:
        return <ParentInfoStep onNext={handleNextStep} onBack={handlePreviousStep} />;
      case 4:
        return <VenmoStep onNext={handleNextStep} onBack={handlePreviousStep} />;
      case 5:
        return <SettingsStep onNext={handleNextStep} onBack={handlePreviousStep} />;
      case 6:
        return <PreviewStep onNext={handleNextStep} onBack={handlePreviousStep} />;
      case 7:
        return <PaymentStep onNext={handleNextStep} onBack={handlePreviousStep} />;
      case 8:
        return <DeploymentStep onBack={handlePreviousStep} />;
      default:
        return <SubdomainStep onNext={handleNextStep} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <img 
                src="/logo.svg" 
                alt="Baby Raffle" 
                className="h-8 w-auto"
              />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Site Builder</h1>
                <p className="text-sm text-gray-600">Create your baby raffle site</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                Welcome, {user?.full_name}
              </div>
              <button
                onClick={logout}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <StepProgress 
            currentStep={currentStep}
            totalSteps={TOTAL_STEPS}
            stepTitles={stepTitles}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-xl shadow-lg p-8"
        >
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Step {currentStep}: {stepTitles[currentStep - 1]}
            </h2>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-pink-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / TOTAL_STEPS) * 100}%` }}
              />
            </div>
          </div>

          {renderStep()}
        </motion.div>
      </div>

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

export default SiteBuilder;