'use client';

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, CheckCircle, AlertTriangle, Lightbulb, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

export interface GuideStep {
  id: string;
  title: string;
  description: string;
  screenshot?: {
    src: string;
    alt: string;
    annotations?: ScreenshotAnnotation[];
  };
  code?: {
    language: string;
    content: string;
    filename?: string;
  };
  tips?: string[];
  warnings?: string[];
  bestPractices?: string[];
}

export interface ScreenshotAnnotation {
  id: string;
  x: number; // Percentage from left
  y: number; // Percentage from top
  content: string;
  type: 'callout' | 'highlight' | 'arrow';
}

export interface StepGuideProps {
  steps: GuideStep[];
  title: string;
  description?: string;
  prerequisites?: string[];
  onStepComplete?: (stepId: string) => void;
  completedSteps?: string[];
  className?: string;
}

export function StepGuide({
  steps,
  title,
  description,
  prerequisites,
  onStepComplete,
  completedSteps = [],
  className
}: StepGuideProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleNextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStepClick = (index: number) => {
    setCurrentStep(index);
  };

  const handleStepComplete = () => {
    const step = steps[currentStep];
    onStepComplete?.(step.id);
  };

  const copyCode = async (code: string, stepId: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(stepId);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (error) {
      console.error('Failed to copy code:', error);
    }
  };

  const currentStepData = steps[currentStep];
  const isStepCompleted = completedSteps.includes(currentStepData?.id);

  return (
    <div className={cn('max-w-4xl mx-auto space-y-6', className)}>
      {/* Header */}
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          {description && (
            <p className="text-lg text-muted-foreground mt-2">{description}</p>
          )}
        </div>

        {/* Prerequisites */}
        {prerequisites && prerequisites.length > 0 && (
          <Alert>
            <Lightbulb className="h-4 w-4" />
            <AlertDescription>
              <strong>Prerequisites:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1">
                {prerequisites.map((prerequisite, index) => (
                  <li key={index}>{prerequisite}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Progress */}
        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">
            Step {currentStep + 1} of {steps.length}
          </span>
          <div className="flex-1 bg-muted rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Step Navigation Sidebar */}
        <div className="lg:col-span-1">
          {/* Mobile Step Navigation - Horizontal scroll */}
          <div className="lg:hidden mb-6">
            <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide">
              {steps.map((step, index) => (
                <button
                  key={step.id}
                  onClick={() => handleStepClick(index)}
                  className={cn(
                    'flex-shrink-0 flex items-center gap-2 px-4 py-3 rounded-full text-sm font-medium transition-colors min-h-[48px] min-w-[120px]', // Larger touch targets
                    'hover:bg-muted/50',
                    currentStep === index && 'bg-primary text-primary-foreground',
                    completedSteps.includes(step.id) && currentStep !== index && 'bg-green-50 text-green-700'
                  )}
                >
                  {completedSteps.includes(step.id) ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <div className={cn(
                      'w-5 h-5 rounded-full border-2 flex items-center justify-center text-xs',
                      currentStep === index 
                        ? 'border-primary-foreground bg-primary-foreground text-primary' 
                        : 'border-current'
                    )}>
                      {index + 1}
                    </div>
                  )}
                  <span className="whitespace-nowrap truncate max-w-[80px]">
                    {step.title}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Desktop Step Navigation */}
          <Card className="hidden lg:block">
            <CardHeader>
              <CardTitle className="text-lg">Steps</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {steps.map((step, index) => (
                <button
                  key={step.id}
                  onClick={() => handleStepClick(index)}
                  className={cn(
                    'w-full text-left p-3 rounded-lg border transition-colors',
                    'hover:bg-muted/50',
                    currentStep === index && 'bg-primary/10 border-primary',
                    completedSteps.includes(step.id) && 'bg-green-50 border-green-200'
                  )}
                >
                  <div className="flex items-center space-x-2">
                    {completedSteps.includes(step.id) ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <div className={cn(
                        'w-4 h-4 rounded-full border-2',
                        currentStep === index ? 'border-primary bg-primary' : 'border-muted-foreground'
                      )} />
                    )}
                    <span className={cn(
                      'text-sm font-medium',
                      currentStep === index && 'text-primary'
                    )}>
                      {step.title}
                    </span>
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {currentStepData && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <Badge variant="outline">Step {currentStep + 1}</Badge>
                      <span>{currentStepData.title}</span>
                    </CardTitle>
                    <p className="text-muted-foreground mt-2">
                      {currentStepData.description}
                    </p>
                  </div>
                  {onStepComplete && (
                    <Button
                      variant={isStepCompleted ? "secondary" : "default"}
                      size="sm"
                      onClick={handleStepComplete}
                      disabled={isStepCompleted}
                    >
                      {isStepCompleted ? (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Completed
                        </>
                      ) : (
                        'Mark Complete'
                      )}
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Screenshot with Annotations */}
                {currentStepData.screenshot && (
                  <ScreenshotWithAnnotations
                    src={currentStepData.screenshot.src}
                    alt={currentStepData.screenshot.alt}
                    annotations={currentStepData.screenshot.annotations}
                  />
                )}

                {/* Code Example */}
                {currentStepData.code && (
                  <CodeExample
                    language={currentStepData.code.language}
                    content={currentStepData.code.content}
                    filename={currentStepData.code.filename}
                    onCopy={() => copyCode(currentStepData.code!.content, currentStepData.id)}
                    copied={copiedCode === currentStepData.id}
                  />
                )}

                {/* Tips */}
                {currentStepData.tips && currentStepData.tips.length > 0 && (
                  <TipsSection tips={currentStepData.tips} />
                )}

                {/* Warnings */}
                {currentStepData.warnings && currentStepData.warnings.length > 0 && (
                  <WarningsSection warnings={currentStepData.warnings} />
                )}

                {/* Best Practices */}
                {currentStepData.bestPractices && currentStepData.bestPractices.length > 0 && (
                  <BestPracticesSection practices={currentStepData.bestPractices} />
                )}
              </CardContent>
            </Card>
          )}

          {/* Navigation */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={handlePreviousStep}
              disabled={currentStep === 0}
              className="min-h-[44px] px-6" // Larger touch target
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
            <Button
              onClick={handleNextStep}
              disabled={currentStep === steps.length - 1}
              className="min-h-[44px] px-6" // Larger touch target
            >
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>

          {/* Mobile Progress Indicator */}
          <div className="lg:hidden mt-6">
            <div className="flex items-center justify-center gap-2">
              <span className="text-sm text-muted-foreground">
                Step {currentStep + 1} of {steps.length}
              </span>
            </div>
            <div className="mt-2 w-full bg-muted rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Screenshot with Annotations Component
interface ScreenshotWithAnnotationsProps {
  src: string;
  alt: string;
  annotations?: ScreenshotAnnotation[];
}

function ScreenshotWithAnnotations({ src, alt, annotations }: ScreenshotWithAnnotationsProps) {
  return (
    <div className="relative">
      <img
        src={src}
        alt={alt}
        className="w-full rounded-lg border shadow-sm"
      />
      {annotations?.map((annotation) => (
        <div
          key={annotation.id}
          className="absolute"
          style={{
            left: `${annotation.x}%`,
            top: `${annotation.y}%`,
            transform: 'translate(-50%, -50%)'
          }}
        >
          {annotation.type === 'callout' && (
            <div className="bg-primary text-primary-foreground px-2 py-1 rounded text-sm font-medium shadow-lg">
              {annotation.content}
            </div>
          )}
          {annotation.type === 'highlight' && (
            <div className="w-4 h-4 bg-yellow-400 rounded-full animate-pulse" />
          )}
          {annotation.type === 'arrow' && (
            <div className="text-primary">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// Code Example Component
interface CodeExampleProps {
  language: string;
  content: string;
  filename?: string;
  onCopy: () => void;
  copied: boolean;
}

function CodeExample({ language, content, filename, onCopy, copied }: CodeExampleProps) {
  return (
    <div className="space-y-2">
      {filename && (
        <div className="flex items-center justify-between bg-muted px-4 py-2 rounded-t-lg">
          <span className="text-sm font-medium">{filename}</span>
          <Badge variant="secondary">{language}</Badge>
        </div>
      )}
      <div className="relative">
        <pre className={cn(
          'bg-muted p-4 rounded-lg overflow-x-auto text-sm',
          !filename && 'rounded-t-lg'
        )}>
          <code className={`language-${language}`}>{content}</code>
        </pre>
        <Button
          size="sm"
          variant="ghost"
          className="absolute top-2 right-2"
          onClick={onCopy}
        >
          {copied ? (
            <Check className="h-4 w-4" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}

// Tips Section Component
interface TipsSectionProps {
  tips: string[];
}

function TipsSection({ tips }: TipsSectionProps) {
  return (
    <Alert>
      <Lightbulb className="h-4 w-4" />
      <AlertDescription>
        <strong>Tips:</strong>
        <ul className="list-disc list-inside mt-2 space-y-1">
          {tips.map((tip, index) => (
            <li key={index}>{tip}</li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  );
}

// Warnings Section Component
interface WarningsSectionProps {
  warnings: string[];
}

function WarningsSection({ warnings }: WarningsSectionProps) {
  return (
    <Alert variant="destructive">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription>
        <strong>Important:</strong>
        <ul className="list-disc list-inside mt-2 space-y-1">
          {warnings.map((warning, index) => (
            <li key={index}>{warning}</li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  );
}

// Best Practices Section Component
interface BestPracticesSectionProps {
  practices: string[];
}

function BestPracticesSection({ practices }: BestPracticesSectionProps) {
  return (
    <Alert className="border-green-200 bg-green-50">
      <CheckCircle className="h-4 w-4 text-green-600" />
      <AlertDescription>
        <strong>Best Practices:</strong>
        <ul className="list-disc list-inside mt-2 space-y-1">
          {practices.map((practice, index) => (
            <li key={index}>{practice}</li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  );
}