import Link from 'next/link';
import { 
  ArrowRight, 
  Users, 
  DollarSign, 
  Calendar, 
  Zap, 
  Settings, 
  MessageSquare, 
  Shield, 
  BookOpen, 
  CheckCircle,
  Clock,
  Star,
  Lightbulb
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const quickStartLinks = [
  {
    title: 'Getting Started',
    description: 'Set up your chapter and get started with GreekDash',
    href: '/docs/getting-started',
    icon: <Zap className="h-6 w-6" />,
    badge: 'Essential',
    estimatedTime: '15 min',
  },
  {
    title: 'Member Management',
    description: 'Learn how to invite and manage chapter members',
    href: '/docs/admin-guide/members',
    icon: <Users className="h-6 w-6" />,
    badge: 'Popular',
    estimatedTime: '10 min',
  },
  {
    title: 'Financial Management',
    description: 'Set up dues collection and expense tracking',
    href: '/docs/admin-guide/finance',
    icon: <DollarSign className="h-6 w-6" />,
    badge: 'Pro Feature',
    estimatedTime: '20 min',
  },
  {
    title: 'Event Management',
    description: 'Create and manage chapter events',
    href: '/docs/admin-guide/events',
    icon: <Calendar className="h-6 w-6" />,
    estimatedTime: '8 min',
  },
];

const featureHighlights = [
  {
    title: 'Complete Admin Guide',
    description: 'Step-by-step instructions for every admin feature',
    href: '/docs/admin-guide',
    icon: <BookOpen className="h-5 w-5" />,
    features: ['Member Management', 'Financial Tools', 'Event Planning', 'Settings'],
  },
  {
    title: 'Feature Overview',
    description: 'Explore all the features available in GreekDash',
    href: '/docs/features',
    icon: <Star className="h-5 w-5" />,
    features: ['Screenshots', 'Video Demos', 'Use Cases', 'Plan Comparison'],
  },
  {
    title: 'Security & Compliance',
    description: 'Learn about security best practices and compliance',
    href: '/docs/security',
    icon: <Shield className="h-5 w-5" />,
    features: ['Data Protection', 'Access Control', 'Audit Logs', 'Best Practices'],
  },
];

const quickReferenceCards = [
  {
    title: 'Invite Members',
    description: 'Send invitations to new chapter members',
    steps: ['Go to Members → Invites', 'Add email addresses', 'Select roles', 'Send invitations'],
    href: '/docs/admin-guide/members/invites',
    icon: <Users className="h-4 w-4" />,
  },
  {
    title: 'Create Event',
    description: 'Set up a new chapter event with RSVP',
    steps: ['Navigate to Events', 'Click "Create Event"', 'Fill event details', 'Set RSVP options'],
    href: '/docs/admin-guide/events',
    icon: <Calendar className="h-4 w-4" />,
  },
  {
    title: 'Set Up Dues',
    description: 'Configure dues collection and payment processing',
    steps: ['Go to Finance → Dues', 'Create dues plan', 'Connect Stripe', 'Test payment flow'],
    href: '/docs/admin-guide/finance/dues',
    icon: <DollarSign className="h-4 w-4" />,
  },
  {
    title: 'Send Broadcast',
    description: 'Communicate with all chapter members',
    steps: ['Go to Communications', 'Choose message type', 'Write your message', 'Select recipients'],
    href: '/docs/admin-guide/communications',
    icon: <MessageSquare className="h-4 w-4" />,
  },
];

const adminFeatures = [
  {
    category: 'Member Management',
    icon: <Users className="h-5 w-5" />,
    features: [
      { name: 'Member Directory', href: '/docs/admin-guide/members/directory' },
      { name: 'Invitation System', href: '/docs/admin-guide/members/invites' },
      { name: 'Role Management', href: '/docs/admin-guide/members/roles' },
      { name: 'Member Approval', href: '/docs/admin-guide/members/pending' },
    ],
  },
  {
    category: 'Financial Tools',
    icon: <DollarSign className="h-5 w-5" />,
    features: [
      { name: 'Dues Collection', href: '/docs/admin-guide/finance/dues' },
      { name: 'Expense Tracking', href: '/docs/admin-guide/finance/expenses' },
      { name: 'Financial Reports', href: '/docs/admin-guide/finance/reports' },
      { name: 'Budget Management', href: '/docs/admin-guide/finance/budgets' },
    ],
  },
  {
    category: 'Communication',
    icon: <MessageSquare className="h-5 w-5" />,
    features: [
      { name: 'Email Broadcasts', href: '/docs/admin-guide/communications/email' },
      { name: 'SMS Notifications', href: '/docs/admin-guide/communications/sms' },
      { name: 'Announcements', href: '/docs/admin-guide/communications/announcements' },
      { name: 'Contact Forms', href: '/docs/admin-guide/communications/forms' },
    ],
  },
  {
    category: 'Chapter Settings',
    icon: <Settings className="h-5 w-5" />,
    features: [
      { name: 'Chapter Profile', href: '/docs/admin-guide/settings/chapter' },
      { name: 'Branding & Colors', href: '/docs/admin-guide/settings/branding' },
      { name: 'Privacy Settings', href: '/docs/admin-guide/settings/privacy' },
      { name: 'Billing & Plans', href: '/docs/admin-guide/settings/billing' },
    ],
  },
];

export function DocsHomePage() {
  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <div className="text-center space-y-6">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tight lg:text-6xl">
            GreekDash Documentation
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Everything you need to know about managing your chapter with GreekDash. 
            From getting started to advanced features, we&apos;ve got you covered.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
          <Button asChild size="lg">
            <Link href="/docs/getting-started">
              Get Started
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link href="/">Start Free Trial</Link>
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl mx-auto mt-12">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">50+</div>
            <div className="text-sm text-muted-foreground">Detailed Guides</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">100+</div>
            <div className="text-sm text-muted-foreground">Screenshots</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">24/7</div>
            <div className="text-sm text-muted-foreground">Support</div>
          </div>
        </div>
      </div>

      {/* Quick Start Links */}
      <div className="space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-semibold">Quick Start Guides</h2>
          <p className="text-muted-foreground">Get up and running with these essential guides</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {quickStartLinks.map((link) => (
            <Card key={link.href} className="hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      {link.icon}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{link.title}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{link.estimatedTime}</span>
                      </div>
                    </div>
                  </div>
                  {link.badge && (
                    <Badge variant={link.badge === 'Essential' ? 'default' : link.badge === 'Popular' ? 'secondary' : 'outline'}>
                      {link.badge}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="mb-4">
                  {link.description}
                </CardDescription>
                <Button variant="ghost" asChild className="p-0 h-auto font-medium">
                  <Link href={link.href} className="flex items-center gap-2">
                    Start guide
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Quick Reference Cards */}
      <div className="space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-semibold">Quick Reference</h2>
          <p className="text-muted-foreground">Common admin tasks at a glance</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickReferenceCards.map((card) => (
            <Card key={card.href} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-primary/10 rounded">
                    {card.icon}
                  </div>
                  <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <CardDescription className="text-xs mb-3">
                  {card.description}
                </CardDescription>
                <ol className="text-xs space-y-1 mb-3">
                  {card.steps.map((step, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-primary font-medium">{index + 1}.</span>
                      <span className="text-muted-foreground">{step}</span>
                    </li>
                  ))}
                </ol>
                <Button variant="ghost" size="sm" asChild className="p-0 h-auto text-xs">
                  <Link href={card.href} className="flex items-center gap-1">
                    View guide
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Feature Overview */}
      <div className="space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-semibold">Complete Feature Documentation</h2>
          <p className="text-muted-foreground">Explore all GreekDash capabilities</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {adminFeatures.map((category) => (
            <Card key={category.category} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    {category.icon}
                  </div>
                  <CardTitle className="text-xl">{category.category}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {category.features.map((feature) => (
                    <Link
                      key={feature.href}
                      href={feature.href}
                      className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/50 transition-colors text-sm"
                    >
                      <CheckCircle className="h-3 w-3 text-primary" />
                      <span>{feature.name}</span>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Documentation Sections */}
      <div className="space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-semibold">Documentation Sections</h2>
          <p className="text-muted-foreground">Comprehensive guides for every aspect of GreekDash</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {featureHighlights.map((feature) => (
            <Card key={feature.href} className="hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </div>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-1">
                    {feature.features.map((item) => (
                      <Badge key={item} variant="secondary" className="text-xs">
                        {item}
                      </Badge>
                    ))}
                  </div>
                  <Button variant="ghost" asChild className="p-0 h-auto font-medium">
                    <Link href={feature.href} className="flex items-center gap-2">
                      Explore section
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Help Section */}
      <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-xl p-8">
        <div className="text-center space-y-6">
          <div className="space-y-2">
            <h3 className="text-2xl font-semibold">Need Additional Help?</h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Our documentation covers everything, but if you need personalized assistance, 
              we&apos;re here to help you succeed.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild>
              <Link href="/">
                <Lightbulb className="mr-2 h-4 w-4" />
                Start Free Trial
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/contact">
                Contact Support
              </Link>
            </Button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl mx-auto mt-8">
            <div className="text-center">
              <div className="text-lg font-semibold">Live Chat</div>
              <div className="text-sm text-muted-foreground">Available 24/7</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold">Video Calls</div>
              <div className="text-sm text-muted-foreground">Personalized demos</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold">Email Support</div>
              <div className="text-sm text-muted-foreground">Response within 2 hours</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}