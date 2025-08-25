import { Suspense } from 'react';
import Link from 'next/link';
import { ArrowRight, BookOpen, CheckCircle, Clock, Zap, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { OnboardingChecklist } from '@/components/docs/onboarding-checklist';
import { QuickReferenceCards } from '@/components/docs/quick-reference-cards';

const essentialSteps = [
  {
    title: 'Complete Your Profile',
    description: 'Set up your admin account with photo and contact information',
    href: '/docs/getting-started/first-login#step-2-complete-your-profile',
    estimatedTime: '3 min',
    priority: 'high',
  },
  {
    title: 'Configure Chapter Info',
    description: 'Add your chapter name, logo, and basic information',
    href: '/docs/getting-started/chapter-setup#chapter-information',
    estimatedTime: '5 min',
    priority: 'high',
  },
  {
    title: 'Invite First Members',
    description: 'Send invitations to your existing chapter members',
    href: '/docs/admin-guide/members/invites',
    estimatedTime: '10 min',
    priority: 'high',
  },
  {
    title: 'Set Privacy Settings',
    description: 'Configure member directory and public page visibility',
    href: '/docs/getting-started/chapter-setup#privacy-and-security',
    estimatedTime: '5 min',
    priority: 'medium',
  },
];

const commonQuestions = [
  {
    question: 'How long does setup take?',
    answer: 'Most chapters complete essential setup in under 30 minutes. You can always add more features later.',
  },
  {
    question: 'Can I import existing member data?',
    answer: 'Yes! You can bulk import members via CSV or invite them individually through the platform.',
  },
  {
    question: 'What if I need help during setup?',
    answer: 'Our support team is available 24/7 via live chat, and we offer personalized setup calls for new chapters.',
  },
  {
    question: 'Can I change settings later?',
    answer: 'Absolutely! All settings can be modified at any time from your admin dashboard.',
  },
];

interface GettingStartedContentProps {
  showChecklist?: boolean;
  showQuickReference?: boolean;
  compact?: boolean;
}

export function GettingStartedContent({ 
  showChecklist = true, 
  showQuickReference = true, 
  compact = false 
}: GettingStartedContentProps) {
  return (
    <div className="space-y-12">
      {/* Welcome Section */}
      <div className="space-y-6">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">
            Welcome to GreekDash
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl">
            You&apos;re just a few steps away from transforming how your chapter operates. 
            This guide will help you set up everything you need to manage members, 
            finances, events, and communications effectively.
          </p>
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>New to GreekDash?</strong> Start with our{' '}
            <Link href="/docs/getting-started/first-login" className="underline">
              First Login Guide
            </Link>{' '}
            to complete your initial account setup.
          </AlertDescription>
        </Alert>
      </div>

      {/* Essential Steps Overview */}
      <div className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold">Essential Setup Steps</h2>
          <p className="text-muted-foreground">
            Complete these four steps to get your chapter up and running.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {essentialSteps.map((step, index) => (
            <Card key={step.href} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-medium">
                      {index + 1}
                    </div>
                    <div>
                      <CardTitle className="text-base">{step.title}</CardTitle>
                      <div className="flex items-center gap-1 mt-1">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{step.estimatedTime}</span>
                      </div>
                    </div>
                  </div>
                  <div className={`px-2 py-1 rounded text-xs font-medium ${
                    step.priority === 'high' 
                      ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                  }`}>
                    {step.priority === 'high' ? 'Required' : 'Recommended'}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <CardDescription className="mb-3">
                  {step.description}
                </CardDescription>
                <Button variant="ghost" size="sm" asChild className="p-0 h-auto">
                  <Link href={step.href} className="flex items-center gap-1">
                    Start step
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Interactive Checklist */}
      {showChecklist && (
        <div className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold">Complete Setup Checklist</h2>
            <p className="text-muted-foreground">
              Track your progress with our interactive checklist. Your progress is saved automatically.
            </p>
          </div>
          
          <Suspense fallback={<div className="h-96 bg-muted animate-pulse rounded-lg" />}>
            <OnboardingChecklist compact={compact} />
          </Suspense>
        </div>
      )}

      {/* Quick Reference */}
      {showQuickReference && (
        <div className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold">Quick Reference</h2>
            <p className="text-muted-foreground">
              Common tasks you&apos;ll need as a chapter administrator.
            </p>
          </div>
          
          <QuickReferenceCards limit={4} compact />
          
          <div className="text-center">
            <Button variant="outline" asChild>
              <Link href="/docs/admin-guide">
                View All Admin Guides
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      )}

      {/* Detailed Guides */}
      <div className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold">Detailed Setup Guides</h2>
          <p className="text-muted-foreground">
            Step-by-step instructions for every aspect of chapter setup.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Zap className="h-5 w-5 text-primary" />
                <CardTitle>First Login & Setup</CardTitle>
              </div>
              <CardDescription>
                Complete your first login and initial account configuration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-sm text-muted-foreground">
                  Covers account setup, profile completion, and initial navigation
                </div>
                <Button variant="outline" asChild className="w-full">
                  <Link href="/docs/getting-started/first-login">
                    Read Guide
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-primary" />
                <CardTitle>Chapter Setup Checklist</CardTitle>
              </div>
              <CardDescription>
                Comprehensive checklist for complete chapter configuration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-sm text-muted-foreground">
                  Essential tasks, configuration options, and best practices
                </div>
                <Button variant="outline" asChild className="w-full">
                  <Link href="/docs/getting-started/chapter-setup">
                    Read Guide
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-3">
                <BookOpen className="h-5 w-5 text-primary" />
                <CardTitle>Admin Guide</CardTitle>
              </div>
              <CardDescription>
                Complete reference for all administrative features
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-sm text-muted-foreground">
                  Member management, finances, events, and advanced features
                </div>
                <Button variant="outline" asChild className="w-full">
                  <Link href="/docs/admin-guide">
                    Browse Features
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold">Frequently Asked Questions</h2>
          <p className="text-muted-foreground">
            Common questions from new chapter administrators.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {commonQuestions.map((faq, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="text-base">{faq.question}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{faq.answer}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="text-center">
          <Button variant="outline" asChild>
            <Link href="/docs/admin-guide/faq">
              View All FAQs
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Next Steps */}
      <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-xl p-8">
        <div className="text-center space-y-6">
          <div className="space-y-2">
            <h3 className="text-2xl font-semibold">Ready to Launch Your Chapter?</h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Once you&apos;ve completed the essential setup, you&apos;re ready to start 
              managing your chapter with GreekDash. Explore advanced features as you grow.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg">
              <Link href="/docs/admin-guide">
                Explore All Features
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/contact">
                Get Personalized Help
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}