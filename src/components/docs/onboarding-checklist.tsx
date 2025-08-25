'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowRight, 
  Trophy, 
  Clock, 
  Users, 
  DollarSign, 
  Settings, 
  MessageSquare,
  Calendar,
  FileText,
  Shield
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  category: 'essential' | 'recommended' | 'advanced';
  estimatedTime: string;
  completed?: boolean;
}

const checklistItems: ChecklistItem[] = [
  // Essential Setup
  {
    id: 'complete-profile',
    title: 'Complete Your Admin Profile',
    description: 'Add your photo, contact information, and notification preferences',
    href: '/docs/getting-started/first-login#step-2-complete-your-profile',
    icon: <Users className="h-4 w-4" />,
    category: 'essential',
    estimatedTime: '3 min',
  },
  {
    id: 'chapter-info',
    title: 'Set Up Chapter Information',
    description: 'Add chapter name, logo, colors, and basic information',
    href: '/docs/getting-started/chapter-setup#chapter-information',
    icon: <Settings className="h-4 w-4" />,
    category: 'essential',
    estimatedTime: '5 min',
  },
  {
    id: 'invite-members',
    title: 'Invite Your First Members',
    description: 'Send invitations to existing chapter members and set up roles',
    href: '/docs/admin-guide/members/invites',
    icon: <Users className="h-4 w-4" />,
    category: 'essential',
    estimatedTime: '10 min',
  },
  {
    id: 'privacy-settings',
    title: 'Configure Privacy Settings',
    description: 'Set up member directory privacy and public page visibility',
    href: '/docs/getting-started/chapter-setup#privacy-and-security',
    icon: <Shield className="h-4 w-4" />,
    category: 'essential',
    estimatedTime: '5 min',
  },

  // Recommended Setup
  {
    id: 'financial-setup',
    title: 'Set Up Financial Management',
    description: 'Connect Stripe and create your first dues plan',
    href: '/docs/admin-guide/finance/dues',
    icon: <DollarSign className="h-4 w-4" />,
    category: 'recommended',
    estimatedTime: '15 min',
  },
  {
    id: 'communication-setup',
    title: 'Configure Communication Tools',
    description: 'Set up email templates and SMS notifications',
    href: '/docs/admin-guide/communications',
    icon: <MessageSquare className="h-4 w-4" />,
    category: 'recommended',
    estimatedTime: '8 min',
  },
  {
    id: 'first-event',
    title: 'Create Your First Event',
    description: 'Test the event system with a sample chapter event',
    href: '/docs/admin-guide/events',
    icon: <Calendar className="h-4 w-4" />,
    category: 'recommended',
    estimatedTime: '10 min',
  },
  {
    id: 'file-organization',
    title: 'Organize Chapter Documents',
    description: 'Upload important documents and set up folder structure',
    href: '/docs/admin-guide/files',
    icon: <FileText className="h-4 w-4" />,
    category: 'recommended',
    estimatedTime: '12 min',
  },

  // Advanced Setup
  {
    id: 'branding-customization',
    title: 'Customize Chapter Branding',
    description: 'Set up custom colors, logo, and public page design',
    href: '/docs/admin-guide/settings/branding',
    icon: <Settings className="h-4 w-4" />,
    category: 'advanced',
    estimatedTime: '20 min',
  },
  {
    id: 'advanced-permissions',
    title: 'Configure Advanced Permissions',
    description: 'Set up detailed role permissions and access controls',
    href: '/docs/admin-guide/members/roles',
    icon: <Shield className="h-4 w-4" />,
    category: 'advanced',
    estimatedTime: '15 min',
  },
];

interface OnboardingChecklistProps {
  showProgress?: boolean;
  compact?: boolean;
}

export function OnboardingChecklist({ showProgress = true, compact = false }: OnboardingChecklistProps) {
  const [completedItems, setCompletedItems] = useState<Set<string>>(new Set());

  // Load completed items from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('greekdash-onboarding-progress');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setCompletedItems(new Set(parsed));
      } catch (error) {
        console.error('Error loading onboarding progress:', error);
      }
    }
  }, []);

  // Save completed items to localStorage
  useEffect(() => {
    localStorage.setItem('greekdash-onboarding-progress', JSON.stringify([...completedItems]));
  }, [completedItems]);

  const toggleItem = (itemId: string) => {
    const newCompleted = new Set(completedItems);
    if (newCompleted.has(itemId)) {
      newCompleted.delete(itemId);
    } else {
      newCompleted.add(itemId);
    }
    setCompletedItems(newCompleted);
  };

  const essentialItems = checklistItems.filter(item => item.category === 'essential');
  const recommendedItems = checklistItems.filter(item => item.category === 'recommended');
  const advancedItems = checklistItems.filter(item => item.category === 'advanced');

  const essentialCompleted = essentialItems.filter(item => completedItems.has(item.id)).length;
  const recommendedCompleted = recommendedItems.filter(item => completedItems.has(item.id)).length;
  const advancedCompleted = advancedItems.filter(item => completedItems.has(item.id)).length;
  const totalCompleted = completedItems.size;
  const totalItems = checklistItems.length;
  const progressPercentage = (totalCompleted / totalItems) * 100;

  const getCategoryBadgeVariant = (category: string) => {
    switch (category) {
      case 'essential':
        return 'destructive' as const;
      case 'recommended':
        return 'default' as const;
      case 'advanced':
        return 'secondary' as const;
      default:
        return 'outline' as const;
    }
  };

  const getCategoryTitle = (category: string) => {
    switch (category) {
      case 'essential':
        return 'Essential Setup';
      case 'recommended':
        return 'Recommended Setup';
      case 'advanced':
        return 'Advanced Configuration';
      default:
        return category;
    }
  };

  const renderChecklistSection = (items: ChecklistItem[], title: string, completed: number) => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{title}</h3>
        <Badge variant={completed === items.length ? 'default' : 'outline'}>
          {completed}/{items.length} completed
        </Badge>
      </div>
      
      <div className="space-y-3">
        {items.map((item) => {
          const isCompleted = completedItems.has(item.id);
          
          return (
            <Card 
              key={item.id} 
              className={`transition-all duration-200 ${
                isCompleted ? 'bg-muted/50 border-primary/20' : 'hover:shadow-md'
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={isCompleted}
                    onCheckedChange={() => toggleItem(item.id)}
                    className="mt-1"
                  />
                  
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <div className="p-1 bg-primary/10 rounded">
                            {item.icon}
                          </div>
                          <h4 className={`font-medium ${isCompleted ? 'line-through text-muted-foreground' : ''}`}>
                            {item.title}
                          </h4>
                        </div>
                        <p className={`text-sm ${isCompleted ? 'text-muted-foreground' : 'text-muted-foreground'}`}>
                          {item.description}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {item.estimatedTime}
                      </div>
                    </div>
                    
                    {!compact && (
                      <div className="flex items-center justify-between">
                        <Badge variant={getCategoryBadgeVariant(item.category)} className="text-xs">
                          {getCategoryTitle(item.category)}
                        </Badge>
                        
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={item.href} className="flex items-center gap-1 text-xs">
                            View guide
                            <ArrowRight className="h-3 w-3" />
                          </Link>
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );

  if (compact) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Setup Progress</CardTitle>
            <Badge variant={progressPercentage === 100 ? 'default' : 'outline'}>
              {totalCompleted}/{totalItems}
            </Badge>
          </div>
          {showProgress && (
            <div className="space-y-2">
              <Progress value={progressPercentage} className="h-2" />
              <p className="text-sm text-muted-foreground">
                {Math.round(progressPercentage)}% complete
              </p>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {checklistItems.slice(0, 3).map((item) => {
              const isCompleted = completedItems.has(item.id);
              return (
                <div key={item.id} className="flex items-center gap-3">
                  <Checkbox
                    checked={isCompleted}
                    onCheckedChange={() => toggleItem(item.id)}
                  />
                  <div className="flex-1">
                    <p className={`text-sm ${isCompleted ? 'line-through text-muted-foreground' : ''}`}>
                      {item.title}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={item.href}>
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </Button>
                </div>
              );
            })}
            
            {checklistItems.length > 3 && (
              <Button variant="outline" size="sm" asChild className="w-full">
                <Link href="/docs/getting-started">
                  View full checklist
                </Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {/* Progress Overview */}
      {showProgress && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">Onboarding Progress</CardTitle>
                <CardDescription>
                  Complete these steps to get the most out of GreekDash
                </CardDescription>
              </div>
              {progressPercentage === 100 && (
                <div className="flex items-center gap-2 text-primary">
                  <Trophy className="h-5 w-5" />
                  <span className="font-medium">Complete!</span>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Overall Progress</span>
                  <span className="font-medium">{totalCompleted}/{totalItems} tasks</span>
                </div>
                <Progress value={progressPercentage} className="h-3" />
                <p className="text-sm text-muted-foreground">
                  {Math.round(progressPercentage)}% complete
                </p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t">
                <div className="text-center">
                  <div className="text-lg font-semibold text-destructive">
                    {essentialCompleted}/{essentialItems.length}
                  </div>
                  <div className="text-sm text-muted-foreground">Essential</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-primary">
                    {recommendedCompleted}/{recommendedItems.length}
                  </div>
                  <div className="text-sm text-muted-foreground">Recommended</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-muted-foreground">
                    {advancedCompleted}/{advancedItems.length}
                  </div>
                  <div className="text-sm text-muted-foreground">Advanced</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Checklist Sections */}
      {renderChecklistSection(essentialItems, 'Essential Setup', essentialCompleted)}
      {renderChecklistSection(recommendedItems, 'Recommended Setup', recommendedCompleted)}
      {renderChecklistSection(advancedItems, 'Advanced Configuration', advancedCompleted)}

      {/* Completion Message */}
      {progressPercentage === 100 && (
        <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="p-6 text-center">
            <div className="space-y-4">
              <div className="flex justify-center">
                <Trophy className="h-12 w-12 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-semibold">Congratulations!</h3>
                <p className="text-muted-foreground">
                  You&apos;ve completed the onboarding checklist. Your chapter is ready to go!
                </p>
              </div>
              <Button asChild>
                <Link href="/docs/admin-guide">
                  Explore Advanced Features
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}