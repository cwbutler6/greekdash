'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, ChevronRight } from 'lucide-react';
import { formatCurrency } from "@/lib/utils/format";
import { Progress } from '@/components/ui/progress';
import Link from 'next/link';

interface DuesStatsProps {
  chapterSlug: string;
  expanded?: boolean;
}

interface DuesPayment {
  id: string;
  user: {
    name?: string;
    email: string;
  };
  paidAt: string | null;
  dueDate: string;
  amount: number;
}

interface DuesStatsData {
  totalCollected: number;
  totalPending: number;
  totalPaidCount: number;
  totalPendingCount: number;
  recentPayments: DuesPayment[];
}

export function DuesStats({ chapterSlug, expanded = false }: DuesStatsProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['dues-stats', chapterSlug],
    queryFn: async (): Promise<DuesStatsData> => {
      const res = await fetch(`/api/chapters/${chapterSlug}/finance/dues?stats=true`);
      if (!res.ok) {
        throw new Error('Failed to fetch dues statistics');
      }
      return res.json();
    },
  });

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Dues Collection</CardTitle>
          <CardDescription>Error loading dues data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-4">
            <AlertCircle className="h-8 w-8 text-destructive mr-2" />
            <p>Failed to load dues data. Please try again later.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate payment metrics
  const totalDues = (data?.totalCollected || 0) + (data?.totalPending || 0);
  const collectionRate = totalDues > 0 ? ((data?.totalCollected || 0) / totalDues) * 100 : 0;
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle>Dues Collection</CardTitle>
          <CardDescription>Member payment status</CardDescription>
        </div>
        {!expanded && (
          <Link href={`/${chapterSlug}/admin/finance/dues`}>
            <Button variant="ghost" size="sm">
              View All
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-muted/50 p-4 rounded-lg">
                <div className="text-sm font-medium text-muted-foreground">
                  Total Collected
                </div>
                <div className="text-2xl font-bold">{formatCurrency(data?.totalCollected || 0)}</div>
                <div className="text-sm text-muted-foreground">{data?.totalPaidCount || 0} payments</div>
              </div>
              <div className="bg-muted/50 p-4 rounded-lg">
                <div className="text-sm font-medium text-muted-foreground">
                  Pending Collection
                </div>
                <div className="text-2xl font-bold">{formatCurrency(data?.totalPending || 0)}</div>
                <div className="text-sm text-muted-foreground">{data?.totalPendingCount || 0} pending</div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="text-sm font-medium">Collection Rate</div>
                <div className="text-sm font-medium">{Math.round(collectionRate)}%</div>
              </div>
              <Progress value={collectionRate} className="h-2" />
            </div>
            
            {expanded && (
              <div className="mt-6 space-y-4">
                <div className="flex justify-between items-center border-b pb-2">
                  <div className="font-medium">Recent Activity</div>
                  <Button variant="outline" size="sm">
                    Create Bulk Dues
                  </Button>
                </div>
                
                {(data?.recentPayments && data.recentPayments.length > 0) ? (
                  <div className="space-y-3">
                    {data?.recentPayments.map((payment: DuesPayment) => (
                      <div key={payment.id} className="flex justify-between items-center p-3 bg-muted/50 rounded-md">
                        <div>
                          <div className="font-medium">{payment.user.name || payment.user.email}</div>
                          <div className="text-sm text-muted-foreground">
                            {payment.paidAt ? 'Paid' : 'Due'} {new Date(payment.dueDate).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`font-medium ${payment.paidAt ? 'text-green-600' : 'text-amber-600'}`}>
                            {formatCurrency(payment.amount)}
                          </div>
                          <div className={`text-xs rounded-full px-2 py-1 ${payment.paidAt ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                            {payment.paidAt ? 'PAID' : 'PENDING'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    No recent dues payments found.
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
