import React from 'react';
import { Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { CustomizationStep, StepProgressItem } from '../../types/siteBuilder';

interface ProgressBarProps {
  steps: StepProgressItem[];
  currentStep: CustomizationStep;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ steps, currentStep }) => {
  const currentStepIndex = steps.findIndex(step => step.id === currentStep);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        {steps.map((step, index) => {
          const isCompleted = step.completed;
          const isCurrent = step.id === currentStep;
          const isPast = index < currentStepIndex;

          return (
            <React.Fragment key={step.id}>
              <div className="flex flex-col items-center">
                {/* Step Circle */}
                <div className="relative">
                  <motion.div
                    initial={{ scale: 0.8 }}
                    animate={{ 
                      scale: isCurrent ? 1.1 : 1,
                      backgroundColor: isCompleted 
                        ? '#10B981' 
                        : isCurrent 
                        ? '#8B5CF6' 
                        : '#E5E7EB'
                    }}
                    transition={{ duration: 0.3 }}
                    className={`
                      w-10 h-10 rounded-full flex items-center justify-center
                      ${isCompleted 
                        ? 'bg-green-500 text-white' 
                        : isCurrent 
                        ? 'bg-purple-600 text-white' 
                        : 'bg-gray-200 text-gray-500'
                      }
                    `}
                  >
                    {isCompleted ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <span className="text-sm font-semibold">{index + 1}</span>
                    )}
                  </motion.div>

                  {/* Current Step Pulse */}
                  {isCurrent && (
                    <motion.div
                      animate={{ 
                        scale: [1, 1.3, 1],
                        opacity: [0.7, 0, 0.7]
                      }}
                      transition={{ 
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                      className="absolute inset-0 rounded-full bg-purple-600"
                    />
                  )}
                </div>

                {/* Step Title */}
                <div className="mt-3 text-center">
                  <div className={`
                    text-sm font-medium
                    ${isCurrent 
                      ? 'text-purple-600' 
                      : isCompleted 
                      ? 'text-green-600' 
                      : 'text-gray-500'
                    }
                  `}>
                    {step.title}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    Step {index + 1}
                  </div>
                </div>
              </div>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="flex-1 mx-4 mt-5">
                  <div className="relative">
                    <div className="h-0.5 bg-gray-200 w-full" />
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ 
                        width: isPast || isCompleted ? '100%' : '0%'
                      }}
                      transition={{ duration: 0.5 }}
                      className={`
                        absolute top-0 h-0.5
                        ${isCompleted ? 'bg-green-500' : 'bg-purple-600'}
                      `}
                    />
                  </div>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Progress Percentage */}
      <div className="flex justify-between text-xs text-gray-500 mb-2">
        <span>Progress</span>
        <span>
          {Math.round(((currentStepIndex + 1) / steps.length) * 100)}% Complete
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }}
          transition={{ duration: 0.5 }}
          className="bg-gradient-to-r from-purple-600 to-pink-600 h-2 rounded-full"
        />
      </div>
    </div>
  );
};

export default ProgressBar;