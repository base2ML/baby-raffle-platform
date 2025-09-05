import React from 'react';
import { Check, ChevronRight } from 'lucide-react';
import classNames from 'classnames';
import { useCurrentStep } from '../../contexts/SiteBuilderContext';
import ProgressBar from '../common/ProgressBar';
import Button from '../common/Button';

interface StepWizardProps {
  children: React.ReactNode;
}

export default function StepWizard({ children }: StepWizardProps) {
  const { 
    currentStep, 
    currentStepData, 
    totalSteps, 
    progress, 
    canGoNext,
    canGoPrevious,
    nextStep,
    previousStep,
    setCurrentStep
  } = useCurrentStep();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                <h1 className="text-xl font-semibold text-gray-900">
                  Baby Raffle Site Builder
                </h1>
              </div>
              <div className="hidden md:block">
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <span>Step {currentStep} of {totalSteps}</span>
                  <ChevronRight className="w-4 h-4" />
                  <span className="font-medium text-gray-900">
                    {currentStepData?.title}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="hidden sm:block w-32">
                <ProgressBar 
                  progress={progress} 
                  showPercentage 
                  size="sm"
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Progress Steps - Mobile */}
      <div className="md:hidden bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Step {currentStep} of {totalSteps}</span>
          <span className="font-medium text-gray-900">{currentStepData?.title}</span>
        </div>
        <div className="mt-2">
          <ProgressBar progress={progress} size="sm" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Step Navigation Sidebar */}
          <div className="lg:col-span-1">
            <StepNavigation 
              currentStep={currentStep}
              onStepClick={setCurrentStep}
            />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              {/* Step Header */}
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-2xl font-semibold text-gray-900">
                  {currentStepData?.title}
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                  {currentStepData?.description}
                </p>
              </div>

              {/* Step Content */}
              <div className="px-6 py-8">
                {children}
              </div>

              {/* Step Footer */}
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
                <div className="flex items-center justify-between">
                  <div>
                    {canGoPrevious && (
                      <Button
                        variant="outline"
                        onClick={previousStep}
                      >
                        Previous
                      </Button>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    {currentStep < totalSteps && (
                      <Button
                        variant="primary"
                        onClick={nextStep}
                        disabled={!canGoNext}
                      >
                        Continue
                      </Button>
                    )}
                    
                    {currentStep === totalSteps && (
                      <Button
                        variant="primary"
                        onClick={() => {
                          // Handle completion
                          console.log('Site builder completed!');
                        }}
                      >
                        Complete Setup
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Step Navigation Component
function StepNavigation({ 
  currentStep, 
  onStepClick 
}: { 
  currentStep: number;
  onStepClick: (step: number) => void;
}) {
  const { steps } = useCurrentStep();

  return (
    <nav className="space-y-1">
      {steps.map((step, index) => {
        const stepNumber = index + 1;
        const isActive = currentStep === stepNumber;
        const isCompleted = step.isComplete;
        const isClickable = isCompleted || stepNumber <= currentStep;

        return (
          <button
            key={step.id}
            onClick={() => isClickable && onStepClick(stepNumber)}
            disabled={!isClickable}
            className={classNames(
              'w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg text-left transition-colors',
              {
                'bg-primary-50 border border-primary-200 text-primary-700': isActive,
                'text-gray-900 hover:bg-gray-100': !isActive && isClickable,
                'text-gray-400 cursor-not-allowed': !isClickable,
              }
            )}
          >
            {/* Step number or checkmark */}
            <div className={classNames(
              'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium mr-3',
              {
                'bg-primary-600 text-white': isActive,
                'bg-green-500 text-white': isCompleted && !isActive,
                'bg-gray-200 text-gray-600': !isCompleted && !isActive && isClickable,
                'bg-gray-100 text-gray-400': !isClickable,
              }
            )}>
              {isCompleted && !isActive ? (
                <Check className="w-4 h-4" />
              ) : (
                stepNumber
              )}
            </div>

            {/* Step title */}
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">
                {step.title}
              </div>
              <div className="text-xs text-gray-500 truncate">
                {step.description}
              </div>
            </div>
          </button>
        );
      })}
    </nav>
  );
}