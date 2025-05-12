'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ReloadIcon } from '@radix-ui/react-icons';

interface ManageBillingButtonProps {
  chapterSlug: string;
  variant?: 'default' | 'outline' | 'secondary' | 'destructive' | 'ghost' | 'link';
  className?: string;
  children?: React.ReactNode;
}

/**
 * Button component that redirects to Stripe Customer Portal for subscription management
 */
export function ManageBillingButton({
  chapterSlug,
  variant = 'outline',
  className = '',
  children,
}: ManageBillingButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  // Use TanStack Query for handling the portal creation
  const createPortalSession = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chapterSlug,
          returnUrl: `${window.location.origin}/${chapterSlug}/admin`,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create portal session');
      }

      return response.json();
    },
    onSuccess: (data) => {
      // Redirect to Stripe Customer Portal
      window.location.href = data.url;
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : 'Failed to create portal session');
      setIsLoading(false);
    },
  });

  const handleManageBilling = async () => {
    setIsLoading(true);
    createPortalSession.mutate();
  };

  return (
    <Button
      variant={variant}
      className={className}
      onClick={handleManageBilling}
      disabled={isLoading}
    >
      {isLoading ? (
        <>
          <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
          Loading...
        </>
      ) : (
        children || 'Manage Billing'
      )}
    </Button>
  );
}
