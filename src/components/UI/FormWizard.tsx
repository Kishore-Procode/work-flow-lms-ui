import React, { useState, ReactNode } from 'react';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';

interface Step {
  id: string;
  title: string;
  description?: string;
  content: ReactNode;
  isValid?: boolean;
}

interface FormWizardProps {
  steps: Step[];
  onComplete: () => void;
  onCancel?: () => void;
  className?: string;
  showStepNumbers?: boolean;
  allowSkip?: boolean;
}

const FormWizard: React.FC<FormWizardProps> = ({
  steps,
  onComplete,
  onCancel,
  className = '',
  showStepNumbers = true,
  allowSkip = false
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;
  const currentStepData = steps[currentStep];

  const handleNext = () => {
    if (currentStepData.isValid !== false) {
      setCompletedSteps(prev => new Set([...prev, currentStep]));
      
      if (isLastStep) {
        onComplete();
      } else {
        setCurrentStep(prev => prev + 1);
      }
    }
  };

  const handlePrevious = () => {
    if (!isFirstStep) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleStepClick = (stepIndex: number) => {
    // Allow clicking on completed steps or the next step
    if (completedSteps.has(stepIndex) || stepIndex === currentStep + 1) {
      setCurrentStep(stepIndex);
    }
  };

  const getStepStatus = (stepIndex: number) => {
    if (completedSteps.has(stepIndex)) return 'completed';
    if (stepIndex === currentStep) return 'current';
    if (stepIndex < currentStep) return 'completed';
    return 'upcoming';
  };

  const getStepIcon = (stepIndex: number, step: Step) => {
    const status = getStepStatus(stepIndex);
    
    if (status === 'completed') {
      return <Check className="w-4 h-4" />;
    }
    
    if (showStepNumbers) {
      return <span className="text-sm font-medium">{stepIndex + 1}</span>;
    }
    
    return null;
  };

  return (
    <div className={`max-w-4xl mx-auto ${className}`}>
      {/* Step Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const status = getStepStatus(index);
            const isClickable = completedSteps.has(index) || index === currentStep + 1;
            
            return (
              <div key={step.id} className="flex items-center flex-1">
                {/* Step Circle */}
                <button
                  onClick={() => isClickable && handleStepClick(index)}
                  disabled={!isClickable}
                  className={`
                    relative flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-200
                    ${status === 'completed' 
                      ? 'bg-blue-600 border-blue-600 text-white' 
                      : status === 'current'
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'bg-white border-gray-300 text-gray-500'
                    }
                    ${isClickable ? 'cursor-pointer hover:scale-105' : 'cursor-not-allowed'}
                  `}
                >
                  {getStepIcon(index, step)}
                </button>

                {/* Step Label */}
                <div className="ml-3 flex-1">
                  <div className={`text-sm font-medium ${
                    status === 'current' ? 'text-blue-600' : 
                    status === 'completed' ? 'text-blue-600' : 'text-gray-500'
                  }`}>
                    {step.title}
                  </div>
                  {step.description && (
                    <div className="text-xs text-gray-500 mt-1">
                      {step.description}
                    </div>
                  )}
                </div>

                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-4 ${
                    completedSteps.has(index) ? 'bg-blue-600' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {currentStepData.title}
          </h2>
          {currentStepData.description && (
            <p className="text-gray-600 dark:text-gray-400">
              {currentStepData.description}
            </p>
          )}
        </div>

        <div className="min-h-[400px]">
          {currentStepData.content}
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between">
        <div className="flex space-x-3">
          <button
            onClick={handlePrevious}
            disabled={isFirstStep}
            className={`
              flex items-center px-4 py-2 text-sm font-medium rounded-lg border transition-colors
              ${isFirstStep
                ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700'
              }
            `}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Previous
          </button>

          {onCancel && (
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>

        <div className="flex space-x-3">
          {allowSkip && !isLastStep && (
            <button
              onClick={() => setCurrentStep(prev => prev + 1)}
              className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              Skip
            </button>
          )}

          <button
            onClick={handleNext}
            disabled={currentStepData.isValid === false}
            className={`
              flex items-center px-6 py-2 text-sm font-medium rounded-lg transition-colors
              ${currentStepData.isValid === false
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : isLastStep
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-blue-600 text-white hover:bg-blue-700'
              }
            `}
          >
            {isLastStep ? 'Complete' : 'Next'}
            {!isLastStep && <ChevronRight className="w-4 h-4 ml-1" />}
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-6">
        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
          <span>Step {currentStep + 1} of {steps.length}</span>
          <span>{Math.round(((currentStep + 1) / steps.length) * 100)}% Complete</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default FormWizard;
