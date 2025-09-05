import React from 'react';
import { Check } from 'lucide-react';
import classNames from 'classnames';

interface StepProgressProps {
  steps: Array<{
    title: string;
    description: string;
  }>;
  currentStep: number;
}

const StepProgress: React.FC<StepProgressProps> = ({ steps, currentStep }) => {
  return (
    <div className="w-full py-4">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <React.Fragment key={index}>
            <div className="flex flex-col items-center">
              <div
                className={classNames(
                  'flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all',
                  {
                    'bg-green-500 border-green-500 text-white': index < currentStep,
                    'bg-blue-500 border-blue-500 text-white': index === currentStep,
                    'bg-gray-100 border-gray-300 text-gray-400': index > currentStep,
                  }
                )}
              >
                {index < currentStep ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <span className="text-sm font-medium">{index + 1}</span>
                )}
              </div>
              <div className="mt-2 text-center">
                <p
                  className={classNames('text-sm font-medium', {
                    'text-green-600': index < currentStep,
                    'text-blue-600': index === currentStep,
                    'text-gray-400': index > currentStep,
                  })}
                >
                  {step.title}
                </p>
                <p className="text-xs text-gray-500 mt-1">{step.description}</p>
              </div>
            </div>
            {index < steps.length - 1 && (
              <div
                className={classNames('flex-1 h-0.5 mx-4', {
                  'bg-green-500': index < currentStep,
                  'bg-gray-300': index >= currentStep,
                })}
              />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default StepProgress;