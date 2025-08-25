import Link from 'next/link';
import { 
  Users, 
  DollarSign, 
  Calendar, 
  MessageSquare, 
  FileText, 
  Settings, 
  Shield, 
  Mail,
  CreditCard,
  UserPlus,
  ArrowRight,
  Clock,
  CheckCircle
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface QuickReferenceItem {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  category: 'members' | 'finance' | 'events' | 'communication' | 'settings';
  steps: string[];
  href: string;
  estimatedTime: string;
  difficulty: 'easy' | 'medium' | 'advanced';
  tips?: string[];
}

const quickReferenceItems: QuickReferenceItem[] = [
  // Member Management
  {
    id: 'invite-members',
    title: 'Invite New Members',
    description: 'Send invitations to prospective chapter members',
    icon: <UserPlus className="h-4 w-4" />,
    category: 'members',
    steps: [
      'Navigate to Members → Invites',
      'Click "Send Invitations"',
      'Enter email addresses (one per line)',
      'Select member role (Member/Admin)',
      'Add personal message (optional)',
      'Click "Send Invitations"'
    ],
    href: '/docs/admin-guide/members/invites',
    estimatedTime: '2 min',
    difficulty: 'easy',
    tips: ['Include a personal welcome message', 'Double-check email addresses']
  },
  {
    id: 'approve-members',
    title: 'Approve Pending Members',
    description: 'Review and approve new member applications',
    icon: <CheckCircle className="h-4 w-4" />,
    category: 'members',
    steps: [
      'Go to Members → Pending',
      'Review member applications',
      'Click "Approve" or "Reject"',
      'Add approval notes if needed',
      'Send welcome message to approved members'
    ],
    href: '/docs/admin-guide/members/pending',
    estimatedTime: '3 min',
    difficulty: 'easy',
    tips: ['Review profiles carefully', 'Send personalized welcome messages']
  },
  {
    id: 'manage-roles',
    title: 'Update Member Roles',
    description: 'Change member permissions and access levels',
    icon: <Shield className="h-4 w-4" />,
    category: 'members',
    steps: [
      'Navigate to Members → Directory',
      'Find the member to update',
      'Click the three dots menu',
      'Select "Change Role"',
      'Choose new role (Member/Admin/Owner)',
      'Confirm the change'
    ],
    href: '/docs/admin-guide/members/roles',
    estimatedTime: '1 min',
    difficulty: 'easy',
    tips: ['Be careful with Owner role assignments', 'Notify members of role changes']
  },

  // Financial Management
  {
    id: 'create-dues-plan',
    title: 'Set Up Dues Collection',
    description: 'Create a dues plan and enable payment processing',
    icon: <CreditCard className="h-4 w-4" />,
    category: 'finance',
    steps: [
      'Go to Finance → Dues Plans',
      'Click "Create Dues Plan"',
      'Enter plan details (amount, frequency)',
      'Set payment deadline',
      'Configure late fees (optional)',
      'Activate the plan'
    ],
    href: '/docs/admin-guide/finance/dues',
    estimatedTime: '10 min',
    difficulty: 'medium',
    tips: ['Test with a small amount first', 'Set clear payment deadlines']
  },
  {
    id: 'track-expenses',
    title: 'Record Chapter Expenses',
    description: 'Log and categorize chapter expenditures',
    icon: <DollarSign className="h-4 w-4" />,
    category: 'finance',
    steps: [
      'Navigate to Finance → Expenses',
      'Click "Add Expense"',
      'Enter expense details',
      'Select category',
      'Upload receipt (optional)',
      'Save the expense'
    ],
    href: '/docs/admin-guide/finance/expenses',
    estimatedTime: '3 min',
    difficulty: 'easy',
    tips: ['Keep receipts for all expenses', 'Use consistent categories']
  },
  {
    id: 'financial-reports',
    title: 'Generate Financial Reports',
    description: 'Create reports for budgets and financial tracking',
    icon: <FileText className="h-4 w-4" />,
    category: 'finance',
    steps: [
      'Go to Finance → Reports',
      'Select report type',
      'Choose date range',
      'Apply filters if needed',
      'Generate report',
      'Download or share as needed'
    ],
    href: '/docs/admin-guide/finance/reports',
    estimatedTime: '5 min',
    difficulty: 'medium',
    tips: ['Run reports monthly', 'Share with chapter leadership']
  },

  // Event Management
  {
    id: 'create-event',
    title: 'Create Chapter Event',
    description: 'Set up events with RSVP and attendance tracking',
    icon: <Calendar className="h-4 w-4" />,
    category: 'events',
    steps: [
      'Navigate to Events',
      'Click "Create Event"',
      'Fill in event details',
      'Set date, time, and location',
      'Configure RSVP settings',
      'Publish the event'
    ],
    href: '/docs/admin-guide/events',
    estimatedTime: '5 min',
    difficulty: 'easy',
    tips: ['Add clear event descriptions', 'Set RSVP deadlines']
  },
  {
    id: 'manage-rsvps',
    title: 'Track Event RSVPs',
    description: 'Monitor attendance and manage event capacity',
    icon: <Users className="h-4 w-4" />,
    category: 'events',
    steps: [
      'Go to Events → [Event Name]',
      'Click "RSVPs" tab',
      'Review attendance list',
      'Send reminders if needed',
      'Mark actual attendance',
      'Export attendance report'
    ],
    href: '/docs/admin-guide/events/rsvps',
    estimatedTime: '3 min',
    difficulty: 'easy',
    tips: ['Send RSVP reminders', 'Track no-shows for planning']
  },

  // Communication
  {
    id: 'send-broadcast',
    title: 'Send Member Broadcast',
    description: 'Communicate with all or selected chapter members',
    icon: <MessageSquare className="h-4 w-4" />,
    category: 'communication',
    steps: [
      'Go to Communications → Broadcasts',
      'Click "New Broadcast"',
      'Choose delivery method (Email/SMS)',
      'Select recipients',
      'Write your message',
      'Schedule or send immediately'
    ],
    href: '/docs/admin-guide/communications/broadcasts',
    estimatedTime: '5 min',
    difficulty: 'easy',
    tips: ['Keep messages concise', 'Use clear subject lines']
  },
  {
    id: 'setup-email-templates',
    title: 'Configure Email Templates',
    description: 'Create reusable email templates for common communications',
    icon: <Mail className="h-4 w-4" />,
    category: 'communication',
    steps: [
      'Navigate to Communications → Templates',
      'Click "Create Template"',
      'Choose template type',
      'Design email layout',
      'Add dynamic content fields',
      'Save and test template'
    ],
    href: '/docs/admin-guide/communications/templates',
    estimatedTime: '15 min',
    difficulty: 'medium',
    tips: ['Test templates before using', 'Include chapter branding']
  },

  // Settings
  {
    id: 'update-chapter-info',
    title: 'Update Chapter Profile',
    description: 'Modify chapter information, logo, and branding',
    icon: <Settings className="h-4 w-4" />,
    category: 'settings',
    steps: [
      'Go to Settings → Chapter Profile',
      'Update chapter information',
      'Upload new logo if needed',
      'Adjust chapter colors',
      'Update contact information',
      'Save changes'
    ],
    href: '/docs/admin-guide/settings/chapter',
    estimatedTime: '8 min',
    difficulty: 'easy',
    tips: ['Use high-quality logos', 'Keep information current']
  },
  {
    id: 'privacy-settings',
    title: 'Configure Privacy Settings',
    description: 'Control member directory and public page visibility',
    icon: <Shield className="h-4 w-4" />,
    category: 'settings',
    steps: [
      'Navigate to Settings → Privacy',
      'Set member directory visibility',
      'Configure public page settings',
      'Adjust contact form settings',
      'Set data retention preferences',
      'Apply changes'
    ],
    href: '/docs/admin-guide/settings/privacy',
    estimatedTime: '10 min',
    difficulty: 'medium',
    tips: ['Review privacy laws', 'Inform members of changes']
  },
];

interface QuickReferenceCardsProps {
  category?: 'members' | 'finance' | 'events' | 'communication' | 'settings';
  limit?: number;
  showCategories?: boolean;
  compact?: boolean;
}

export function QuickReferenceCards({ 
  category, 
  limit, 
  showCategories = true, 
  compact = false 
}: QuickReferenceCardsProps) {
  let filteredItems = category 
    ? quickReferenceItems.filter(item => item.category === category)
    : quickReferenceItems;

  if (limit) {
    filteredItems = filteredItems.slice(0, limit);
  }

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'members':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'finance':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'events':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'communication':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'settings':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'default';
      case 'medium':
        return 'secondary';
      case 'advanced':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  if (compact) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.map((item) => (
          <Card key={item.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-primary/10 rounded">
                    {item.icon}
                  </div>
                  <CardTitle className="text-sm">{item.title}</CardTitle>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {item.estimatedTime}
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <CardDescription className="text-xs mb-3">
                {item.description}
              </CardDescription>
              <Button variant="ghost" size="sm" asChild className="p-0 h-auto text-xs">
                <Link href={item.href} className="flex items-center gap-1">
                  View guide
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {filteredItems.map((item) => (
        <Card key={item.id} className="hover:shadow-lg transition-all duration-200">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  {item.icon}
                </div>
                <div>
                  <CardTitle className="text-lg">{item.title}</CardTitle>
                  <CardDescription className="mt-1">
                    {item.description}
                  </CardDescription>
                </div>
              </div>
              
              <div className="flex flex-col gap-2 items-end">
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {item.estimatedTime}
                </div>
                <Badge variant={getDifficultyColor(item.difficulty) as 'default' | 'secondary' | 'destructive' | 'outline'}>
                  {item.difficulty}
                </Badge>
              </div>
            </div>
            
            {showCategories && (
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(item.category)}`}>
                  {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
                </span>
              </div>
            )}
          </CardHeader>
          
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-sm mb-2">Steps:</h4>
                <ol className="space-y-1">
                  {item.steps.map((step, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <span className="text-primary font-medium min-w-[1.5rem]">
                        {index + 1}.
                      </span>
                      <span className="text-muted-foreground">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
              
              {item.tips && item.tips.length > 0 && (
                <div>
                  <h4 className="font-medium text-sm mb-2">Tips:</h4>
                  <ul className="space-y-1">
                    {item.tips.map((tip, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <span className="text-primary">•</span>
                        <span className="text-muted-foreground">{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              <div className="pt-2 border-t">
                <Button variant="outline" asChild className="w-full">
                  <Link href={item.href} className="flex items-center gap-2">
                    View detailed guide
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Export individual category components for convenience
export function MemberManagementCards(props: Omit<QuickReferenceCardsProps, 'category'>) {
  return <QuickReferenceCards {...props} category="members" />;
}

export function FinanceManagementCards(props: Omit<QuickReferenceCardsProps, 'category'>) {
  return <QuickReferenceCards {...props} category="finance" />;
}

export function EventManagementCards(props: Omit<QuickReferenceCardsProps, 'category'>) {
  return <QuickReferenceCards {...props} category="events" />;
}

export function CommunicationCards(props: Omit<QuickReferenceCardsProps, 'category'>) {
  return <QuickReferenceCards {...props} category="communication" />;
}

export function SettingsCards(props: Omit<QuickReferenceCardsProps, 'category'>) {
  return <QuickReferenceCards {...props} category="settings" />;
}