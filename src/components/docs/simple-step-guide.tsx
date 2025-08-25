import React from 'react';
import { AlertTriangle, Lightbulb, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SyntaxHighlighter } from './syntax-highlighter';
import { cn } from '@/lib/utils';

export interface SimpleStep {
  title: string;
  description: string;
  screenshot?: string;
  code?: {
    language: string;
    content: string;
    filename?: string;
  };
  tips?: string[];
  warnings?: string[];
  notes?: string[];
}

export interface SimpleStepGuideProps {
  title: string;
  description?: string;
  steps: SimpleStep[];
  className?: string;
}

export function SimpleStepGuide({
  title,
  description,
  steps,
  className
}: SimpleStepGuideProps) {
  return (
    <div className={cn('space-y-8', className)}>
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
        {description && (
          <p className="text-muted-foreground">{description}</p>
        )}
      </div>

      {/* Steps */}
      <div className="space-y-6">
        {steps.map((step, index) => (
          <Card key={index} className="relative">
            <CardHeader>
              <CardTitle className="flex items-center space-x-3">
                <Badge variant="outline" className="shrink-0">
                  {index + 1}
                </Badge>
                <span>{step.title}</span>
              </CardTitle>
              <p className="text-muted-foreground">{step.description}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Screenshot */}
              {step.screenshot && (
                <div className="rounded-lg border overflow-hidden">
                  <img
                    src={step.screenshot}
                    alt={`Step ${index + 1}: ${step.title}`}
                    className="w-full h-auto"
                  />
                </div>
              )}

              {/* Code Example */}
              {step.code && (
                <SyntaxHighlighter
                  code={step.code.content}
                  language={step.code.language}
                  filename={step.code.filename}
                />
              )}

              {/* Tips */}
              {step.tips && step.tips.length > 0 && (
                <Alert>
                  <Lightbulb className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Tips:</strong>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      {step.tips.map((tip, tipIndex) => (
                        <li key={tipIndex}>{tip}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {/* Warnings */}
              {step.warnings && step.warnings.length > 0 && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Important:</strong>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      {step.warnings.map((warning, warningIndex) => (
                        <li key={warningIndex}>{warning}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {/* Notes */}
              {step.notes && step.notes.length > 0 && (
                <Alert className="border-blue-200 bg-blue-50">
                  <Info className="h-4 w-4 text-blue-600" />
                  <AlertDescription>
                    <strong>Note:</strong>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      {step.notes.map((note, noteIndex) => (
                        <li key={noteIndex}>{note}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// Utility component for inline step references
export interface StepReferenceProps {
  stepNumber: number;
  title: string;
  className?: string;
}

export function StepReference({ stepNumber, title, className }: StepReferenceProps) {
  return (
    <span className={cn('inline-flex items-center space-x-1', className)}>
      <Badge variant="outline" className="text-xs">
        {stepNumber}
      </Badge>
      <span className="text-sm font-medium">{title}</span>
    </span>
  );
}

// Component for step navigation links
export interface StepNavigationProps {
  steps: { title: string; id: string }[];
  currentStep?: string;
  onStepClick?: (stepId: string) => void;
  className?: string;
}

export function StepNavigation({
  steps,
  currentStep,
  onStepClick,
  className
}: StepNavigationProps) {
  return (
    <nav className={cn('space-y-2', className)}>
      <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
        Steps
      </h3>
      <ul className="space-y-1">
        {steps.map((step, index) => (
          <li key={step.id}>
            <button
              onClick={() => onStepClick?.(step.id)}
              className={cn(
                'w-full text-left p-2 rounded-md text-sm transition-colors',
                'hover:bg-muted/50',
                currentStep === step.id && 'bg-primary/10 text-primary font-medium'
              )}
            >
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="text-xs shrink-0">
                  {index + 1}
                </Badge>
                <span className="truncate">{step.title}</span>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}