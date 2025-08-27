import Link from 'next/link';
import {
  ArrowRight,
  Users,
  DollarSign,
  Shield,
  BarChart3,
  Star,
  CheckCircle,
  TrendingUp,
  Award,
  PlayCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { featuresData } from '@/lib/docs/features-data';

const platformStats = [
  {
    metric: '500+',
    label: 'Active Chapters',
    description: 'Chapters successfully managing operations with GreekDash',
    icon: <Users className="h-5 w-5" />
  },
  {
    metric: '50,000+',
    label: 'Members Managed',
    description: 'Individual members across all chapters',
    icon: <TrendingUp className="h-5 w-5" />
  },
  {
    metric: '$2M+',
    label: 'Dues Processed',
    description: 'Total dues collected through the platform',
    icon: <DollarSign className="h-5 w-5" />
  },
  {
    metric: '99.9%',
    label: 'Uptime',
    description: 'Reliable platform availability',
    icon: <Shield className="h-5 w-5" />
  }
];

const keyBenefits = [
  {
    title: 'Save 10+ Hours Weekly',
    description: 'Automate administrative tasks and streamline chapter operations',
    icon: <TrendingUp className="h-6 w-6" />,
    metrics: ['Automated dues collection', 'Streamlined member onboarding', 'Efficient event management']
  },
  {
    title: 'Increase Member Engagement',
    description: 'Better communication tools lead to more active participation',
    icon: <Users className="h-6 w-6" />,
    metrics: ['25% higher event attendance', '40% more member interactions', 'Improved retention rates']
  },
  {
    title: 'Professional Chapter Image',
    description: 'Present a polished, organized appearance to members and prospects',
    icon: <Award className="h-6 w-6" />,
    metrics: ['Custom branding options', 'Professional public pages', 'Mobile-optimized experience']
  },
  {
    title: 'Financial Transparency',
    description: 'Clear financial tracking and reporting builds member trust',
    icon: <BarChart3 className="h-6 w-6" />,
    metrics: ['Real-time financial dashboards', 'Automated expense tracking', 'Compliance reporting']
  }
];

const quickActions = [
  {
    title: 'Explore Features',
    description: 'See detailed feature comparison across all plans',
    href: '/docs/overview/features',
    icon: <Star className="h-5 w-5" />,
    badge: 'Popular'
  },
  {
    title: 'View Pricing',
    description: 'Compare plans and find the right fit for your chapter',
    href: '/docs/overview/pricing',
    icon: <DollarSign className="h-5 w-5" />,
    badge: 'Essential'
  },
  {
    title: 'Calculate ROI',
    description: 'See potential time and cost savings for your chapter',
    href: '/docs/overview/roi-calculator',
    icon: <TrendingUp className="h-5 w-5" />,
    badge: 'New'
  },
  {
    title: 'Success Stories',
    description: 'Read how other chapters have transformed with GreekDash',
    href: '/docs/overview/success-stories',
    icon: <Award className="h-5 w-5" />
  },
  {
    title: 'Demo Videos',
    description: 'Watch comprehensive feature demonstrations',
    href: '/docs/overview/demo-videos',
    icon: <PlayCircle className="h-5 w-5" />
  },
  {
    title: 'Get Started',
    description: 'Begin your chapter setup with our step-by-step guide',
    href: '/docs/getting-started',
    icon: <ArrowRight className="h-5 w-5" />
  }
];

export function PlatformOverview() {
  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <div className="text-center space-y-6">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tight lg:text-6xl">
            GreekDash Platform Overview
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            The complete chapter management solution designed specifically for fraternities and sororities.
            Streamline operations, engage members, and grow your chapter with confidence.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
          <Button asChild size="lg">
            <Link href="/">
              Start Free Trial
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link href="/docs/overview/demo-videos">
              Watch Demo
              <PlayCircle className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Platform Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {platformStats.map((stat) => (
          <Card key={stat.label} className="text-center">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-center mb-2">
                <div className="p-2 bg-primary/10 rounded-lg">
                  {stat.icon}
                </div>
              </div>
              <div className="text-3xl font-bold text-primary">{stat.metric}</div>
              <CardTitle className="text-lg">{stat.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-sm">
                {stat.description}
              </CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Key Benefits */}
      <div className="space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-semibold">Why Chapters Choose GreekDash</h2>
          <p className="text-muted-foreground">Proven benefits that transform chapter operations</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {keyBenefits.map((benefit) => (
            <Card key={benefit.title} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    {benefit.icon}
                  </div>
                  <div>
                    <CardTitle className="text-xl">{benefit.title}</CardTitle>
                    <CardDescription className="mt-1">{benefit.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {benefit.metrics.map((metric) => (
                    <li key={metric} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-primary" />
                      <span>{metric}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Feature Highlights */}
      <div className="space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-semibold">Complete Feature Set</h2>
          <p className="text-muted-foreground">Everything you need to manage your chapter effectively</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuresData.slice(0, 6).map((feature) => (
            <Card key={feature.title} className="hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      {feature.icon}
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </div>
                  {feature.planRequired && (
                    <Badge variant={feature.planRequired === 'FREE' ? 'secondary' : feature.planRequired === 'PRO' ? 'default' : 'outline'}>
                      {feature.planRequired}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="mb-4">
                  {feature.description}
                </CardDescription>
                {feature.ctaUrl && (
                  <Button variant="ghost" asChild className="p-0 h-auto font-medium">
                    <Link href={feature.ctaUrl} className="flex items-center gap-2">
                      {feature.ctaText || 'Learn more'}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <Button asChild variant="outline" size="lg">
            <Link href="/docs/overview/features">
              View All Features
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-semibold">Explore GreekDash</h2>
          <p className="text-muted-foreground">Discover how GreekDash can transform your chapter</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quickActions.map((action) => (
            <Card key={action.href} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      {action.icon}
                    </div>
                    <CardTitle className="text-lg">{action.title}</CardTitle>
                  </div>
                  {action.badge && (
                    <Badge variant={action.badge === 'Popular' ? 'default' : action.badge === 'Essential' ? 'secondary' : 'outline'}>
                      {action.badge}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="mb-4">
                  {action.description}
                </CardDescription>
                <Button variant="ghost" asChild className="p-0 h-auto font-medium">
                  <Link href={action.href} className="flex items-center gap-2">
                    Explore
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-xl p-8">
        <div className="text-center space-y-6">
          <div className="space-y-2">
            <h3 className="text-2xl font-semibold">Ready to Transform Your Chapter?</h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Join hundreds of chapters already using GreekDash to streamline operations,
              engage members, and achieve their goals.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg">
              <Link href="/">
                Start Free Trial
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/docs/overview/roi-calculator">
                Calculate Your ROI
                <TrendingUp className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl mx-auto mt-8">
            <div className="text-center">
              <div className="text-lg font-semibold">Free Trial</div>
              <div className="text-sm text-muted-foreground">No credit card required</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold">Setup Support</div>
              <div className="text-sm text-muted-foreground">Guided onboarding included</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold">24/7 Support</div>
              <div className="text-sm text-muted-foreground">Always here to help</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}