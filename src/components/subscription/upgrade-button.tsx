'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ReloadIcon } from '@radix-ui/react-icons';

interface UpgradeButtonProps {
  chapterSlug: string;
  planId: 'basic' | 'pro';
  variant?: 'default' | 'outline' | 'secondary' | 'destructive' | 'ghost' | 'link';
  className?: string;
  children?: React.ReactNode;
}

/**
 * Button component that redirects to Stripe Checkout for subscription upgrade
 */
export function UpgradeButton({
  chapterSlug,
  planId,
  variant = 'default',
  className = '',
  children,
}: UpgradeButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  // Use TanStack Query for handling the checkout process
  // Define TypeScript interface for the checkout response
  interface CheckoutResponse {
    url: string;
  }
  
  interface ErrorResponse {
    error: string;
  }

  const checkout = useMutation({
    mutationFn: async (): Promise<CheckoutResponse> => {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chapterSlug,
          planId,
          returnUrl: `${window.location.origin}/${chapterSlug}/admin?checkout=success`,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json() as ErrorResponse;
        throw new Error(errorData.error || 'Failed to create checkout session');
      }

      return response.json() as Promise<CheckoutResponse>;
    },
    onSuccess: (data: CheckoutResponse) => {
      // Redirect to Stripe Checkout
      window.location.href = data.url;
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : 'Failed to create checkout session');
      setIsLoading(false);
    },
  });

  const handleUpgrade = async () => {
    setIsLoading(true);
    checkout.mutate();
  };

  return (
    <Button
      variant={variant}
      className={className}
      onClick={handleUpgrade}
      disabled={isLoading}
    >
      {isLoading ? (
        <>
          <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
          Loading...
        </>
      ) : (
        children || `Upgrade to ${planId === 'basic' ? 'Basic' : 'Pro'}`
      )}
    </Button>
  );
}
