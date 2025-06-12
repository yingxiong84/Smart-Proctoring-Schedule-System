import React from 'react';
import { CheckCircle, Circle, ArrowRight } from 'lucide-react';

interface Step {
  id: number;
  title: string;
  description: string;
  icon?: React.ReactNode;
}

interface ProgressStepsProps {
  steps: Step[];
  currentStep: number;
  onStepClick?: (step: number) => void;
  className?: string;
}

export const ProgressSteps: React.FC<ProgressStepsProps> = ({
  steps,
  currentStep,
  onStepClick,
  className = ''
}) => {
  return (
    <div className={`space-y-4 ${className}`}>
      {steps.map((step, index) => {
        const isCompleted = currentStep > step.id;
        const isCurrent = currentStep === step.id;
        const isClickable = onStepClick && (isCompleted || isCurrent);

        return (
          <div key={step.id} className="relative">
            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div className="absolute left-4 top-10 w-0.5 h-8 bg-gray-200 dark:bg-gray-700" />
            )}
            
            <div
              className={`
                flex items-start gap-4 p-4 rounded-xl transition-all duration-200
                ${isClickable ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50' : ''}
                ${isCurrent ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800' : ''}
                ${isCompleted ? 'bg-green-50 dark:bg-green-900/20' : ''}
              `}
              onClick={() => isClickable && onStepClick(step.id)}
            >
              {/* Step Icon */}
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200
                ${isCompleted 
                  ? 'bg-green-500 text-white shadow-lg' 
                  : isCurrent 
                  ? 'bg-blue-500 text-white shadow-lg animate-pulse' 
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                }
              `}>
                {isCompleted ? (
                  <CheckCircle className="w-5 h-5" />
                ) : step.icon ? (
                  step.icon
                ) : (
                  <span className="text-sm font-bold">{step.id}</span>
                )}
              </div>

              {/* Step Content */}
              <div className="flex-1 min-w-0">
                <h3 className={`
                  font-semibold text-sm transition-colors
                  ${isCurrent ? 'text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'}
                `}>
                  {step.title}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {step.description}
                </p>
              </div>

              {/* Arrow for current step */}
              {isCurrent && (
                <ArrowRight className="w-4 h-4 text-blue-500 animate-pulse" />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};