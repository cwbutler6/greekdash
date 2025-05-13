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
import { CreditCard, ArrowRight, Loader2 } from 'lucide-react';
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

// Server action to create Stripe portal link
async function createStripePortalLink(formData: FormData) {
  try {
    const response = await fetch('/api/stripe/create-portal-link', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create billing portal link');
    }

    return await response.json();
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error('An unexpected error occurred');
  }
}

export default function BillingClient({ chapterSlug }: { chapterSlug: string }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [isCreatingPortal, setIsCreatingPortal] = useState(false);
  
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
      } catch (error) {
        toast.error('Failed to load billing information');
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBillingInfo();
  }, [chapterSlug]);

  // Handle Stripe billing portal creation
  const handleOpenBillingPortal = async () => {
    if (!chapter) return;
    
    try {
      setIsCreatingPortal(true);
      
      const formData = new FormData();
      formData.append('chapterSlug', chapterSlug);

      const result = await createStripePortalLink(formData);
      
      // Redirect to Stripe portal
      if (result.url) {
        window.location.href = result.url;
      } else {
        throw new Error('No portal URL returned');
      }
    } catch (error) {
      toast.error('Failed to open billing portal');
      console.error(error);
      setIsCreatingPortal(false);
    }
  };

  // Helper to format subscription status
  const getStatusBadge = (status: SubscriptionStatus) => {
    const statusStyles = {
      [SubscriptionStatus.ACTIVE]: 'bg-green-100 text-green-800',
      [SubscriptionStatus.PAST_DUE]: 'bg-yellow-100 text-yellow-800',
      [SubscriptionStatus.CANCELED]: 'bg-red-100 text-red-800',
      [SubscriptionStatus.TRIALING]: 'bg-blue-100 text-blue-800',
      [SubscriptionStatus.INCOMPLETE]: 'bg-gray-100 text-gray-800',
    };
    
    return (
      <Badge className={statusStyles[status]} variant="outline">
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  // Helper to format plan name
  const getPlanDetails = (plan: PlanType) => {
    const planDetails = {
      [PlanType.FREE]: {
        name: 'Free Plan',
        description: 'Basic features for small chapters',
        color: 'text-gray-600',
      },
      [PlanType.BASIC]: {
        name: 'Basic Plan',
        description: 'Enhanced features for growing chapters',
        color: 'text-blue-600',
      },
      [PlanType.PRO]: {
        name: 'Pro Plan',
        description: 'Premium features for established chapters',
        color: 'text-purple-600',
      },
    };
    
    return planDetails[plan];
  };

  if (isLoading && !chapter) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  const subscription = chapter?.subscription;
  const planDetails = subscription ? getPlanDetails(subscription.plan) : getPlanDetails(PlanType.FREE);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Subscription Plan</CardTitle>
          <CardDescription>
            Manage your chapter&apos;s subscription and billing details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="border rounded-md p-6">
              <h3 className={`text-xl font-semibold mb-1 ${planDetails.color}`}>
                {planDetails.name}
              </h3>
              <p className="text-gray-500 mb-4">{planDetails.description}</p>
              
              {subscription && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Status</span>
                    {getStatusBadge(subscription.status)}
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Start Date</span>
                    <span>
                      {new Date(subscription.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  
                  {subscription.stripeSubscriptionId && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">Subscription ID</span>
                      <span className="font-mono text-sm text-gray-600">
                        {subscription.stripeSubscriptionId.substring(0, 14)}...
                      </span>
                    </div>
                  )}
                </div>
              )}

              {!subscription && (
                <div className="mt-4 text-sm text-gray-500">
                  You are currently on the free plan. Upgrade to access premium features.
                </div>
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end space-x-2">
          {!chapter?.stripeCustomerId && (
            <Button
              variant="default"
              onClick={() => router.push(`/${chapterSlug}/admin/upgrade`)}
            >
              Upgrade Plan <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
          
          {chapter?.stripeCustomerId && (
            <Button
              variant="outline"
              onClick={handleOpenBillingPortal}
              disabled={isCreatingPortal}
            >
              {isCreatingPortal ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Opening Portal...
                </>
              ) : (
                <>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Manage Billing
                </>
              )}
            </Button>
          )}
        </CardFooter>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>
            Recent invoices and payment history
          </CardDescription>
        </CardHeader>
        <CardContent>
          {chapter?.stripeCustomerId ? (
            <div className="text-center py-8 text-gray-500">
              <p>View your complete payment history in the Stripe billing portal.</p>
              <Button
                variant="link"
                onClick={handleOpenBillingPortal}
                disabled={isCreatingPortal}
              >
                Open Billing Portal
              </Button>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No payment history available on the free plan.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
