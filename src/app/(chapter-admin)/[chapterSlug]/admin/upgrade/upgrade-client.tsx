'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter,
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Check, Loader2, CreditCard, ArrowRight } from 'lucide-react';
import { PlanType, SubscriptionStatus } from '@/generated/prisma';

interface SubscriptionInfo {
  id: string;
  plan: PlanType;
  status: SubscriptionStatus;
  stripeSubscriptionId: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Chapter {
  id: string;
  name: string;
  slug: string;
  stripeCustomerId: string | null;
  subscription: SubscriptionInfo | null;
}

// Server action to create checkout session
async function createCheckoutSession(formData: FormData) {
  try {
    const response = await fetch('/api/stripe/create-checkout', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create checkout session');
    }

    return await response.json();
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error('An unexpected error occurred');
  }
}

// Plans data
const PLANS = [
  {
    id: 'free',
    name: 'Free',
    description: 'Basic features for small chapters',
    price: '$0',
    interval: 'forever',
    type: PlanType.FREE,
    features: [
      'Up to 25 members',
      'Basic chapter profile',
      'Event management',
      'Member directory'
    ],
    recommended: false,
    stripePriceId: null,
  },
  {
    id: 'basic',
    name: 'Basic',
    description: 'Enhanced features for growing chapters',
    price: '$19',
    interval: 'month',
    type: PlanType.BASIC,
    features: [
      'Up to 100 members',
      'Custom chapter branding',
      'Dues collection',
      'Basic analytics',
      'Email notifications',
    ],
    recommended: true,
    stripePriceId: 'price_basic',
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'Premium features for established chapters',
    price: '$49',
    interval: 'month',
    type: PlanType.PRO,
    features: [
      'Unlimited members',
      'Advanced analytics',
      'Custom forms',
      'Integration with external tools',
      'Priority support',
      'All Basic features'
    ],
    recommended: false,
    stripePriceId: 'price_pro',
  }
];

export function UpgradeClient({ chapterSlug }: { chapterSlug: string }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  
  // Fetch billing data on component mount
  useEffect(() => {
    const fetchBillingInfo = async () => {
      try {
        const response = await fetch(`/api/chapters/${chapterSlug}/billing`);
        if (!response.ok) {
          throw new Error('Failed to fetch billing information');
        }
        const data = await response.json();
        setChapter(data.chapter);
        
        // Set current plan as selected
        if (data.chapter.subscription) {
          const currentPlan = PLANS.find(plan => plan.type === data.chapter.subscription.plan);
          if (currentPlan) {
            setSelectedPlan(currentPlan.id);
          }
        } else {
          setSelectedPlan('free');
        }
      } catch (error) {
        toast.error('Failed to load billing information');
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBillingInfo();
  }, [chapterSlug]);

  const handleUpgrade = async (planId: string) => {
    if (!chapter) return;
    
    const plan = PLANS.find(p => p.id === planId);
    if (!plan || !plan.stripePriceId) {
      // Free plan doesn't need Stripe checkout
      if (plan?.type === PlanType.FREE) {
        toast.info("You're already on the Free plan");
        return;
      }
      toast.error('Invalid plan selection');
      return;
    }
    
    // Don't do anything if selecting current plan
    if (chapter.subscription?.plan === plan.type && 
        chapter.subscription?.status === SubscriptionStatus.ACTIVE) {
      toast.info("You're already subscribed to this plan");
      return;
    }
    
    try {
      setIsUpgrading(true);
      setSelectedPlan(planId);
      
      const formData = new FormData();
      formData.append('chapterSlug', chapterSlug);
      formData.append('priceId', plan.stripePriceId);

      const result = await createCheckoutSession(formData);
      
      // Redirect to Stripe checkout
      if (result.url) {
        window.location.href = result.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (error) {
      toast.error('Failed to start checkout process');
      console.error(error);
      setIsUpgrading(false);
    }
  };

  if (isLoading && !chapter) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  const currentPlanType = chapter?.subscription?.plan || PlanType.FREE;

  return (
    <div className="space-y-6">
      <div className="mx-auto max-w-4xl">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold mb-2">Choose Your Plan</h1>
          <p className="text-gray-500">
            Select the best plan for your chapter&apos;s needs
          </p>
          {chapter?.subscription && (
            <div className="mt-4">
              <Badge variant="outline" className="bg-blue-50 text-blue-700">
                Current Plan: {PLANS.find(p => p.type === currentPlanType)?.name}
              </Badge>
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {PLANS.map((plan) => {
            const isCurrentPlan = currentPlanType === plan.type;
            const isSelected = selectedPlan === plan.id;
            
            return (
              <Card 
                key={plan.id} 
                className={`relative border-2 ${isSelected ? 'border-primary' : 'border-gray-100'} ${plan.recommended ? 'ring-2 ring-primary' : ''} flex flex-col h-full`}
              >
                {plan.recommended && (
                  <div className="absolute -top-3 left-0 right-0 mx-auto w-fit px-3 py-1 bg-primary text-primary-foreground text-xs font-medium rounded-full">
                    Recommended
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {plan.name}
                    {isCurrentPlan && (
                      <Badge variant="outline" className="ml-2 bg-green-50 text-green-700">
                        Current
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <div className="mb-4">
                    <span className="text-3xl font-bold">{plan.price}</span>
                    {plan.interval !== 'forever' && (
                      <span className="text-gray-500">/{plan.interval}</span>
                    )}
                  </div>
                  <ul className="space-y-2">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter className="mt-auto pt-6">
                  <Button 
                    className="w-full"
                    variant={isCurrentPlan ? "outline" : "default"}
                    disabled={isUpgrading || (isCurrentPlan && chapter?.subscription?.status === SubscriptionStatus.ACTIVE)}
                    onClick={() => handleUpgrade(plan.id)}
                  >
                    {isUpgrading && isSelected ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : isCurrentPlan ? (
                      'Current Plan'
                    ) : (
                      <>
                        {plan.type === PlanType.FREE ? 'Downgrade to Free' : `Upgrade to ${plan.name}`}
                        {!isCurrentPlan && <ArrowRight className="ml-2 h-4 w-4" />}
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>

        <div className="text-center mt-10">
          <p className="text-sm text-gray-500 mb-4">
            Need to manage your existing subscription?
          </p>
          <Button
            variant="outline"
            onClick={() => router.push(`/${chapterSlug}/admin/billing`)}
          >
            <CreditCard className="mr-2 h-4 w-4" />
            Manage Billing
          </Button>
        </div>
      </div>
    </div>
  );
}
