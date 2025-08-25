import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, BookOpen, CheckCircle, Clock, Users, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { OnboardingChecklist } from '@/components/docs/onboarding-checklist';
import { QuickReferenceCards } from '@/components/docs/quick-reference-cards';

export const metadata: Metadata = {
  title: 'Getting Started | GreekDash Documentation',
  description: 'Complete onboarding guide for new GreekDash administrators with interactive checklist',
};

const gettingStartedGuides = [
  {
    title: 'First Login & Setup',
    description: 'Complete your first login and initial account setup',
    href: '/docs/getting-started/first-login',
    icon: <Zap className="h-5 w-5" />,
    estimatedTime: '10 min',
    difficulty: 'Easy',
  },
  {
    title: 'Chapter Setup Checklist',
    description: 'Essential configuration steps for your chapter',
    href: '/docs/getting-started/chapter-setup',
    icon: <CheckCircle className="h-5 w-5" />,
    estimatedTime: '20 min',
    difficulty: 'Easy',
  },
  {
    title: 'Admin Guide Overview',
    description: 'Comprehensive guide to all admin features',
    href: '/docs/admin-guide',
    icon: <BookOpen className="h-5 w-5" />,
    estimatedTime: '30 min',
    difficulty: 'Medium',
  },
];

const quickStats = [
  {
    label: 'Setup Time',
    value: '< 30 min',
    description: 'Get your chapter running quickly',
  },
  {
    label: 'Success Rate',
    value: '98%',
    description: 'Admins complete setup successfully',
  },
  {
    label: 'Support',
    value: '24/7',
    description: 'Help available when you need it',
  },
];

export default function GettingStartedPage() {
  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <div className="space-y-6">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">Getting Started with GreekDash</h1>
          <p className="text-xl text-muted-foreground max-w-3xl">
            Welcome to GreekDash! This comprehensive guide will help you set up your chapter 
            and get the most out of our platform. Follow our interactive checklist to ensure 
            you don&apos;t miss any important steps.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl">
          {quickStats.map((stat) => (
            <div key={stat.label} className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-primary">{stat.value}</div>
              <div className="font-medium">{stat.label}</div>
              <div className="text-sm text-muted-foreground">{stat.description}</div>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <Button asChild size="lg">
            <Link href="/docs/getting-started/first-login">
              Start Setup Guide
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link href="/docs/admin-guide">
              Browse All Features
            </Link>
          </Button>
        </div>
      </div>

      {/* Interactive Onboarding Checklist */}
      <div className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-3xl font-semibold">Interactive Setup Checklist</h2>
          <p className="text-muted-foreground">
            Track your progress as you complete each setup step. Your progress is saved automatically.
          </p>
        </div>
        
        <OnboardingChecklist />
      </div>

      {/* Getting Started Guides */}
      <div className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-3xl font-semibold">Step-by-Step Guides</h2>
          <p className="text-muted-foreground">
            Detailed guides to walk you through each aspect of setting up your chapter.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {gettingStartedGuides.map((guide) => (
            <Card key={guide.href} className="hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    {guide.icon}
                  </div>
                  <CardTitle className="text-lg">{guide.title}</CardTitle>
                </div>
                <CardDescription>{guide.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {guide.estimatedTime}
                    </div>
                    <div className="text-muted-foreground">
                      {guide.difficulty}
                    </div>
                  </div>
                  
                  <Button variant="outline" asChild className="w-full">
                    <Link href={guide.href} className="flex items-center gap-2">
                      Read Guide
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Quick Reference for Common Tasks */}
      <div className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-3xl font-semibold">Quick Reference</h2>
          <p className="text-muted-foreground">
            Common admin tasks you&apos;ll need to know. Bookmark this section for easy access.
          </p>
        </div>
        
        <QuickReferenceCards limit={6} compact />
        
        <div className="text-center">
          <Button variant="outline" asChild>
            <Link href="/docs/admin-guide">
              View All Quick References
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>

      {/* What's Next Section */}
      <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-xl p-8">
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h3 className="text-2xl font-semibold">What&apos;s Next?</h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Once you&apos;ve completed the basic setup, explore these advanced features 
              to get the most out of GreekDash.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="text-center">
              <CardContent className="p-4">
                <Users className="h-8 w-8 mx-auto mb-2 text-primary" />
                <h4 className="font-medium mb-1">Member Management</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Advanced member features and permissions
                </p>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/docs/admin-guide/members">Learn More</Link>
                </Button>
              </CardContent>
            </Card>
            
            <Card className="text-center">
              <CardContent className="p-4">
                <CheckCircle className="h-8 w-8 mx-auto mb-2 text-primary" />
                <h4 className="font-medium mb-1">Financial Tools</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Dues collection and expense tracking
                </p>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/docs/admin-guide/finance">Learn More</Link>
                </Button>
              </CardContent>
            </Card>
            
            <Card className="text-center">
              <CardContent className="p-4">
                <BookOpen className="h-8 w-8 mx-auto mb-2 text-primary" />
                <h4 className="font-medium mb-1">Event Management</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Create and manage chapter events
                </p>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/docs/admin-guide/events">Learn More</Link>
                </Button>
              </CardContent>
            </Card>
            
            <Card className="text-center">
              <CardContent className="p-4">
                <Zap className="h-8 w-8 mx-auto mb-2 text-primary" />
                <h4 className="font-medium mb-1">Advanced Features</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Automation and integrations
                </p>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/docs/features">Learn More</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Need Help Section */}
      <div className="text-center space-y-4">
        <h3 className="text-xl font-semibold">Need Help Getting Started?</h3>
        <p className="text-muted-foreground">
          Our support team is here to help you every step of the way.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild>
            <Link href="/contact">Contact Support</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/docs/admin-guide">Browse Documentation</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}