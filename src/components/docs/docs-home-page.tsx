import Link from 'next/link';
import { ArrowRight, Users, DollarSign, Calendar, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const quickStartLinks = [
  {
    title: 'Getting Started',
    description: 'Set up your chapter and get started with GreekDash',
    href: '/docs/getting-started',
    icon: <Zap className="h-6 w-6" />,
  },
  {
    title: 'Member Management',
    description: 'Learn how to invite and manage chapter members',
    href: '/docs/admin-guide/members',
    icon: <Users className="h-6 w-6" />,
  },
  {
    title: 'Financial Management',
    description: 'Set up dues collection and expense tracking',
    href: '/docs/admin-guide/finance',
    icon: <DollarSign className="h-6 w-6" />,
  },
  {
    title: 'Event Management',
    description: 'Create and manage chapter events',
    href: '/docs/admin-guide/events',
    icon: <Calendar className="h-6 w-6" />,
  },
];

const featureHighlights = [
  {
    title: 'Complete Admin Guide',
    description: 'Step-by-step instructions for every admin feature',
    href: '/docs/admin-guide',
  },
  {
    title: 'Feature Overview',
    description: 'Explore all the features available in GreekDash',
    href: '/docs/features',
  },
  {
    title: 'Security & Compliance',
    description: 'Learn about security best practices and compliance',
    href: '/docs/security',
  },
];

export function DocsHomePage() {
  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight lg:text-6xl">
          GreekDash Documentation
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Everything you need to know about managing your chapter with GreekDash. 
          From getting started to advanced features, we&apos;ve got you covered.
        </p>
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
      </div>

      {/* Quick Start Links */}
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold text-center">Quick Start</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {quickStartLinks.map((link) => (
            <Card key={link.href} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    {link.icon}
                  </div>
                  <CardTitle className="text-lg">{link.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="mb-4">
                  {link.description}
                </CardDescription>
                <Button variant="ghost" asChild className="p-0 h-auto">
                  <Link href={link.href} className="flex items-center gap-2">
                    Learn more
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Feature Highlights */}
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold text-center">Explore Documentation</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {featureHighlights.map((feature) => (
            <Card key={feature.href} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="ghost" asChild className="p-0 h-auto">
                  <Link href={feature.href} className="flex items-center gap-2">
                    View documentation
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Call to Action */}
      <div className="bg-muted rounded-lg p-8 text-center space-y-4">
        <h3 className="text-2xl font-semibold">Ready to get started?</h3>
        <p className="text-muted-foreground">
          Join thousands of chapters already using GreekDash to streamline their operations.
        </p>
        <Button asChild size="lg">
          <Link href="/">Start Your Free Trial</Link>
        </Button>
      </div>
    </div>
  );
}