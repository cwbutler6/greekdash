import { PlanTier } from '@/types/docs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

import { Check, X, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PlanBadge } from './plan-badge';
import { CTAButton } from './cta-components';

interface FeatureComparisonItem {
  name: string;
  description?: string;
  plans: {
    [K in PlanTier]: boolean | string | number;
  };
}

interface FeatureComparisonProps {
  features: FeatureComparisonItem[];
  highlightPlan?: PlanTier;
  showCTA?: boolean;
  className?: string;
}

export function FeatureComparison({ 
  features, 
  highlightPlan = 'PRO',
  showCTA = true,
  className 
}: FeatureComparisonProps) {
  const plans: PlanTier[] = ['FREE', 'BASIC', 'PRO', 'ENTERPRISE'];
  
  const planDetails = {
    FREE: {
      name: 'Free',
      price: '$0',
      period: 'forever',
      description: 'Perfect for small chapters getting started',
      ctaText: 'Get Started',
      ctaHref: '/signup?plan=free'
    },
    BASIC: {
      name: 'Basic',
      price: '$29',
      period: 'per month',
      description: 'Essential tools for growing chapters',
      ctaText: 'Start Trial',
      ctaHref: '/signup?plan=basic'
    },
    PRO: {
      name: 'Pro',
      price: '$79',
      period: 'per month',
      description: 'Complete chapter management solution',
      ctaText: 'Start Trial',
      ctaHref: '/signup?plan=pro'
    },
    ENTERPRISE: {
      name: 'Enterprise',
      price: 'Custom',
      period: 'pricing',
      description: 'Advanced features for large organizations',
      ctaText: 'Contact Sales',
      ctaHref: '/contact?plan=enterprise'
    }
  };

  const renderFeatureValue = (value: boolean | string | number) => {
    if (typeof value === 'boolean') {
      return value ? (
        <Check className="h-5 w-5 text-emerald-600" />
      ) : (
        <X className="h-5 w-5 text-gray-400" />
      );
    }
    
    if (typeof value === 'string' || typeof value === 'number') {
      return <span className="text-sm font-medium">{value}</span>;
    }
    
    return <X className="h-5 w-5 text-gray-400" />;
  };

  return (
    <div className={cn('space-y-8', className)}>
      {/* Plan Headers */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {plans.map((plan) => {
          const details = planDetails[plan];
          const isHighlighted = plan === highlightPlan;
          
          return (
            <Card 
              key={plan} 
              className={cn(
                'relative',
                isHighlighted && 'ring-2 ring-emerald-500 ring-offset-2'
              )}
            >
              {isHighlighted && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-emerald-600 text-white">
                    <Star className="h-3 w-3 mr-1" />
                    Most Popular
                  </Badge>
                </div>
              )}
              
              <CardHeader className="text-center pb-4">
                <div className="mb-2">
                  <PlanBadge plan={plan} size="md" />
                </div>
                <CardTitle className="text-2xl">{details.name}</CardTitle>
                <div className="space-y-1">
                  <div className="text-3xl font-bold">
                    {details.price}
                    {details.price !== 'Custom' && (
                      <span className="text-sm font-normal text-muted-foreground">
                        /{details.period}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {details.description}
                  </p>
                </div>
              </CardHeader>
              
              {showCTA && (
                <CardContent className="pt-0">
                  <CTAButton 
                    href={details.ctaHref}
                    variant={isHighlighted ? 'default' : 'outline'}
                    className="w-full"
                  >
                    {details.ctaText}
                  </CTAButton>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {/* Feature Comparison Table */}
      <div className="overflow-x-auto">
        <div className="min-w-full">
          {/* Desktop Table */}
          <div className="hidden lg:block">
            <div className="space-y-1">
              {features.map((feature, index) => (
                <div 
                  key={index}
                  className={cn(
                    'grid grid-cols-5 gap-4 py-4 px-4 rounded-lg',
                    index % 2 === 0 ? 'bg-gray-50' : 'bg-white'
                  )}
                >
                  <div className="col-span-1">
                    <div className="font-medium text-sm">{feature.name}</div>
                    {feature.description && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {feature.description}
                      </div>
                    )}
                  </div>
                  
                  {plans.map((plan) => (
                    <div key={plan} className="flex justify-center items-center">
                      {renderFeatureValue(feature.plans[plan])}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Mobile Cards */}
          <div className="lg:hidden space-y-6">
            {plans.map((plan) => (
              <Card key={plan}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <PlanBadge plan={plan} size="md" />
                    <div className="text-right">
                      <div className="text-lg font-bold">
                        {planDetails[plan].price}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {planDetails[plan].period}
                      </div>
                    </div>
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="space-y-3">
                  {features.map((feature, index) => (
                    <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                      <div className="flex-1">
                        <div className="font-medium text-sm">{feature.name}</div>
                        {feature.description && (
                          <div className="text-xs text-muted-foreground">
                            {feature.description}
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        {renderFeatureValue(feature.plans[plan])}
                      </div>
                    </div>
                  ))}
                  
                  {showCTA && (
                    <div className="pt-4">
                      <CTAButton 
                        href={planDetails[plan].ctaHref}
                        variant={plan === highlightPlan ? 'default' : 'outline'}
                        className="w-full"
                      >
                        {planDetails[plan].ctaText}
                      </CTAButton>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}