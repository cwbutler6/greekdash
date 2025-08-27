import Link from 'next/link';
import {
  ArrowRight,
  Check,
  Star,
  DollarSign,
  MessageSquare,
  BarChart3,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

const pricingPlans = [
  {
    id: 'FREE',
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Perfect for small chapters getting started with basic management tools',
    badge: 'Most Popular',
    badgeVariant: 'secondary' as const,
    color: 'border-gray-200',
    buttonText: 'Get Started Free',
    buttonVariant: 'outline' as const,
    features: [
      'Up to 25 active members',
      '1 GB file storage',
      'Member directory & profiles',
      'Basic event management',
      'Email notifications',
      'Public chapter page',
      'Community support',
      'Mobile-responsive design'
    ],
    limitations: [
      'No dues collection',
      'No SMS messaging',
      'Limited analytics',
      'No custom branding'
    ],
    valueProps: [
      'No setup fees or hidden costs',
      'Perfect for new chapters',
      'All core features included',
      'Easy migration to paid plans'
    ]
  },
  {
    id: 'BASIC',
    name: 'Basic',
    price: '$29',
    period: 'per month',
    description: 'Essential tools for growing chapters with financial management needs',
    badge: 'Recommended',
    badgeVariant: 'default' as const,
    color: 'border-blue-500 ring-2 ring-blue-100',
    buttonText: 'Start Free Trial',
    buttonVariant: 'default' as const,
    features: [
      'Up to 100 active members',
      '10 GB file storage',
      'All Free plan features',
      'Dues collection & Stripe integration',
      'Expense tracking & reports',
      'SMS messaging (500 messages/month)',
      'Custom chapter branding',
      'Recurring events',
      'Member lineage tracking',
      'Email support'
    ],
    limitations: [
      'Limited advanced analytics',
      'No treasury management',
      'No API access'
    ],
    valueProps: [
      'Save 8+ hours per month on admin tasks',
      'Automated dues collection',
      'Professional chapter appearance',
      'Improved member communication'
    ]
  },
  {
    id: 'PRO',
    name: 'Pro',
    price: '$79',
    period: 'per month',
    description: 'Advanced features for established chapters with complex needs',
    badge: 'Most Features',
    badgeVariant: 'outline' as const,
    color: 'border-purple-500',
    buttonText: 'Start Free Trial',
    buttonVariant: 'default' as const,
    features: [
      'Up to 500 active members',
      '100 GB file storage',
      'All Basic plan features',
      'Advanced analytics & insights',
      'Budget management tools',
      'Treasury & DeFi integration',
      'Unlimited SMS messaging',
      'Custom reports & dashboards',
      'Audit logging & compliance',
      'API access for integrations',
      'Custom domain support',
      'Priority support'
    ],
    limitations: [
      'No dedicated account manager',
      'Standard integrations only'
    ],
    valueProps: [
      'Save 15+ hours per month',
      'Complete financial oversight',
      'Advanced member insights',
      'Professional integrations'
    ]
  },
  {
    id: 'ENTERPRISE',
    name: 'Enterprise',
    price: 'Custom',
    period: 'pricing',
    description: 'Tailored solutions for large organizations and multi-chapter management',
    badge: 'Custom Solution',
    badgeVariant: 'outline' as const,
    color: 'border-emerald-500',
    buttonText: 'Contact Sales',
    buttonVariant: 'default' as const,
    features: [
      'Unlimited members',
      'Unlimited file storage',
      'All Pro plan features',
      'Multi-chapter management',
      'Custom integrations',
      'Dedicated account manager',
      'Custom training & onboarding',
      'SLA guarantees',
      'Advanced security features',
      'Custom reporting',
      'White-label options',
      '24/7 phone support'
    ],
    limitations: [],
    valueProps: [
      'Scalable for any organization size',
      'Dedicated support team',
      'Custom feature development',
      'Enterprise-grade security'
    ]
  }
];

const comparisonCategories = [
  {
    name: 'Core Features',
    icon: <Star className="h-5 w-5" />,
    features: [
      { name: 'Member Directory', free: true, basic: true, pro: true, enterprise: true },
      { name: 'Event Management', free: true, basic: true, pro: true, enterprise: true },
      { name: 'File Storage', free: '1 GB', basic: '10 GB', pro: '100 GB', enterprise: 'Unlimited' },
      { name: 'Mobile App', free: true, basic: true, pro: true, enterprise: true }
    ]
  },
  {
    name: 'Financial Management',
    icon: <DollarSign className="h-5 w-5" />,
    features: [
      { name: 'Dues Collection', free: false, basic: true, pro: true, enterprise: true },
      { name: 'Expense Tracking', free: false, basic: true, pro: true, enterprise: true },
      { name: 'Financial Reports', free: false, basic: true, pro: true, enterprise: true },
      { name: 'Budget Management', free: false, basic: false, pro: true, enterprise: true },
      { name: 'Treasury Management', free: false, basic: false, pro: true, enterprise: true }
    ]
  },
  {
    name: 'Communication',
    icon: <MessageSquare className="h-5 w-5" />,
    features: [
      { name: 'Email Notifications', free: true, basic: true, pro: true, enterprise: true },
      { name: 'SMS Messaging', free: false, basic: '500/month', pro: 'Unlimited', enterprise: 'Unlimited' },
      { name: 'Broadcast Campaigns', free: false, basic: true, pro: true, enterprise: true },
      { name: 'Communication Analytics', free: false, basic: false, pro: true, enterprise: true }
    ]
  },
  {
    name: 'Analytics & Reports',
    icon: <BarChart3 className="h-5 w-5" />,
    features: [
      { name: 'Basic Analytics', free: true, basic: true, pro: true, enterprise: true },
      { name: 'Advanced Analytics', free: false, basic: false, pro: true, enterprise: true },
      { name: 'Custom Reports', free: false, basic: false, pro: true, enterprise: true },
      { name: 'Data Export', free: false, basic: true, pro: true, enterprise: true }
    ]
  }
];

const faqItems = [
  {
    question: 'Can I change plans at any time?',
    answer: 'Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately, and billing is prorated.'
  },
  {
    question: 'Is there a setup fee?',
    answer: 'No, there are no setup fees for any plan. You only pay the monthly subscription fee.'
  },
  {
    question: 'What happens if I exceed my member limit?',
    answer: 'We&apos;ll notify you when you approach your limit. You can upgrade your plan or we&apos;ll help you manage your member count.'
  },
  {
    question: 'Do you offer discounts for annual billing?',
    answer: 'Yes, we offer a 20% discount when you pay annually. Contact us for details on annual billing options.'
  },
  {
    question: 'Can I try Pro features before upgrading?',
    answer: 'Yes, all paid plans come with a 14-day free trial. You can explore all features before committing.'
  },
  {
    question: 'What support is included?',
    answer: 'Free plans include community support. Paid plans include email support, with priority support for Pro and dedicated support for Enterprise.'
  }
];

const renderFeatureValue = (value: boolean | string) => {
  if (typeof value === 'boolean') {
    return value ? (
      <Check className="h-4 w-4 text-green-600 mx-auto" />
    ) : (
      <span className="text-gray-400 text-sm">—</span>
    );
  }
  return <span className="text-sm font-medium">{value}</span>;
};

export function PricingPlans() {
  return (
    <div className="space-y-16">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">Pricing Plans</h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Choose the perfect plan for your chapter. Start free and upgrade as you grow.
          All plans include our core chapter management features.
        </p>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {pricingPlans.map((plan) => (
          <Card key={plan.id} className={`relative ${plan.color} hover:shadow-lg transition-all duration-200`}>
            <CardHeader className="text-center pb-4">
              {plan.badge && (
                <Badge variant={plan.badgeVariant} className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  {plan.badge}
                </Badge>
              )}
              <CardTitle className="text-2xl">{plan.name}</CardTitle>
              <div className="space-y-1">
                <div className="text-4xl font-bold">{plan.price}</div>
                <div className="text-sm text-muted-foreground">{plan.period}</div>
              </div>
              <CardDescription className="text-sm">{plan.description}</CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <Button asChild variant={plan.buttonVariant} className="w-full">
                <Link href="/">
                  {plan.buttonText}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>

              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    What&apos;s Included
                  </h4>
                  <ul className="space-y-2">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-sm">
                        <Check className="h-3 w-3 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {plan.limitations.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm mb-3 text-muted-foreground">
                      Limitations
                    </h4>
                    <ul className="space-y-2">
                      {plan.limitations.map((limitation) => (
                        <li key={limitation} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <span className="text-gray-400">•</span>
                          <span>{limitation}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <Separator />

                <div>
                  <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    Key Benefits
                  </h4>
                  <ul className="space-y-2">
                    {plan.valueProps.map((prop) => (
                      <li key={prop} className="flex items-start gap-2 text-sm">
                        <Star className="h-3 w-3 text-primary mt-0.5 flex-shrink-0" />
                        <span>{prop}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Feature Comparison */}
      <div className="space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-semibold">Detailed Feature Comparison</h2>
          <p className="text-muted-foreground">See exactly what&apos;s included in each plan</p>
        </div>

        <div className="space-y-8">
          {comparisonCategories.map((category) => (
            <Card key={category.name}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {category.icon}
                  {category.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3 font-medium">Feature</th>
                        <th className="text-center p-3 font-medium">Free</th>
                        <th className="text-center p-3 font-medium">Basic</th>
                        <th className="text-center p-3 font-medium">Pro</th>
                        <th className="text-center p-3 font-medium">Enterprise</th>
                      </tr>
                    </thead>
                    <tbody>
                      {category.features.map((feature, index) => (
                        <tr key={feature.name} className={index % 2 === 0 ? 'bg-muted/20' : ''}>
                          <td className="p-3 font-medium">{feature.name}</td>
                          <td className="p-3 text-center">{renderFeatureValue(feature.free)}</td>
                          <td className="p-3 text-center">{renderFeatureValue(feature.basic)}</td>
                          <td className="p-3 text-center">{renderFeatureValue(feature.pro)}</td>
                          <td className="p-3 text-center">{renderFeatureValue(feature.enterprise)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* FAQ Section */}
      <div className="space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-semibold">Frequently Asked Questions</h2>
          <p className="text-muted-foreground">Common questions about our pricing and plans</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {faqItems.map((item) => (
            <Card key={item.question}>
              <CardHeader>
                <CardTitle className="text-lg">{item.question}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{item.answer}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-xl p-8">
        <div className="text-center space-y-6">
          <div className="space-y-2">
            <h3 className="text-2xl font-semibold">Ready to Get Started?</h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Start with our free plan and upgrade as your chapter grows. 
              All paid plans include a 14-day free trial with full access to features.
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
                <BarChart3 className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl mx-auto mt-8">
            <div className="text-center">
              <div className="text-lg font-semibold">14-Day Free Trial</div>
              <div className="text-sm text-muted-foreground">Full access to all features</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold">No Setup Fees</div>
              <div className="text-sm text-muted-foreground">Start immediately</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold">Cancel Anytime</div>
              <div className="text-sm text-muted-foreground">No long-term contracts</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}