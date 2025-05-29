'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import { useMutation } from '@tanstack/react-query';
import { AlertCircle, CreditCard, CheckCircle, Clock } from 'lucide-react';

interface DuesPlan {
  id: string;
  name: string;
  description: string | null;
}

interface DuesPayment {
  id: string;
  amount: number;
  dueDate: Date;
  status: string;
  stripeCheckoutUrl: string | null;
  duesPlan: DuesPlan | null;
}

interface MemberDuesPaymentsProps {
  dues: DuesPayment[];
  hasPaymentEnabled: boolean;
}

export function MemberDuesPayments({ dues, hasPaymentEnabled }: MemberDuesPaymentsProps) {
  const params = useParams();
  const chapterSlug = params.chapterSlug as string;
  // Using sonner toast directly
  const [processingPaymentId, setProcessingPaymentId] = useState<string | null>(null);

  // Create payment link mutation
  const createPaymentLinkMutation = useMutation({
    mutationFn: async (paymentId: string) => {
      setProcessingPaymentId(paymentId);
      const response = await fetch(`/api/chapters/${chapterSlug}/finance/dues/payments/${paymentId}/checkout`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create payment link');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      // Redirect to Stripe checkout
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        toast.error("No payment link was returned");
      }
      setProcessingPaymentId(null);
    },
    onError: (error: Error) => {
      toast.error(`Payment error: ${error.message}`);
      setProcessingPaymentId(null);
    },
  });

  const handlePayNow = (paymentId: string, checkoutUrl: string | null) => {
    if (checkoutUrl) {
      // Use existing checkout URL
      window.location.href = checkoutUrl;
    } else {
      // Generate new checkout URL
      createPaymentLinkMutation.mutate(paymentId);
    }
  };

  // Calculate if a due date is overdue
  const isOverdue = (dueDate: Date) => {
    return new Date(dueDate) < new Date();
  };

  if (dues.length === 0) {
    return (
      <Alert>
        <CheckCircle className="h-5 w-5" />
        <AlertTitle>No outstanding dues</AlertTitle>
        <AlertDescription>
          You have no pending dues to pay at this time.
        </AlertDescription>
      </Alert>
    );
  }

  const overdue = dues.filter(due => isOverdue(due.dueDate));
  const upcoming = dues.filter(due => !isOverdue(due.dueDate));

  return (
    <div className="space-y-6">
      {overdue.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 mr-2 text-destructive" />
            <h3 className="text-lg font-medium">Overdue Dues</h3>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {overdue.map(payment => (
              <Card key={payment.id} className="border-destructive">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{payment.duesPlan?.name || "Chapter Dues"}</CardTitle>
                      <CardDescription className="mt-1">
                        Due date: {formatDate(payment.dueDate)}
                      </CardDescription>
                    </div>
                    <Badge variant="destructive">Overdue</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(payment.amount)}
                  </div>
                </CardContent>
                <CardFooter>
                  {hasPaymentEnabled ? (
                    <Button 
                      className="w-full" 
                      onClick={() => handlePayNow(payment.id, payment.stripeCheckoutUrl)}
                      disabled={processingPaymentId === payment.id || createPaymentLinkMutation.isPending}
                    >
                      {processingPaymentId === payment.id ? (
                        <>Processing...</>
                      ) : (
                        <>
                          <CreditCard className="mr-2 h-4 w-4" /> 
                          Pay Now
                        </>
                      )}
                    </Button>
                  ) : (
                    <Alert>
                      <AlertDescription className="text-xs">
                        Online payments are not available. Please contact your chapter treasurer.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      )}

      {upcoming.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center">
            <Clock className="h-5 w-5 mr-2 text-muted-foreground" />
            <h3 className="text-lg font-medium">Upcoming Dues</h3>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {upcoming.map(payment => (
              <Card key={payment.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{payment.duesPlan?.name || "Chapter Dues"}</CardTitle>
                      <CardDescription className="mt-1">
                        Due date: {formatDate(payment.dueDate)}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(payment.amount)}
                  </div>
                </CardContent>
                <CardFooter>
                  {hasPaymentEnabled ? (
                    <Button 
                      className="w-full" 
                      onClick={() => handlePayNow(payment.id, payment.stripeCheckoutUrl)}
                      disabled={processingPaymentId === payment.id || createPaymentLinkMutation.isPending}
                    >
                      {processingPaymentId === payment.id ? (
                        <>Processing...</>
                      ) : (
                        <>
                          <CreditCard className="mr-2 h-4 w-4" /> 
                          Pay Now
                        </>
                      )}
                    </Button>
                  ) : (
                    <Alert>
                      <AlertDescription className="text-xs">
                        Online payments are not available. Please contact your chapter treasurer.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
