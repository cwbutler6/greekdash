'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, ChevronRight } from 'lucide-react';
import { formatCurrency } from "@/lib/utils/format";
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

interface ExpensesStatsProps {
  chapterSlug: string;
  expanded?: boolean;
}

interface ExpenseItem {
  id: string;
  title: string;
  amount: number;
  status: 'PENDING' | 'APPROVED' | 'DENIED' | 'PAID';
  submittedBy: {
    name: string | null;
    email: string | null;
  };
  receiptUrl?: string;
  description?: string;
}

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100',
  APPROVED: 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100',
  DENIED: 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100',
  PAID: 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100',
};

export function ExpensesStats({ chapterSlug, expanded = false }: ExpensesStatsProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['expenses-stats', chapterSlug],
    queryFn: async () => {
      const res = await fetch(`/api/chapters/${chapterSlug}/finance/expenses?stats=true`);
      if (!res.ok) {
        throw new Error('Failed to fetch expenses statistics');
      }
      return res.json();
    },
  });

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Expense Tracking</CardTitle>
          <CardDescription>Error loading expense data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-4">
            <AlertCircle className="h-8 w-8 text-destructive mr-2" />
            <p>Failed to load expense data. Please try again later.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle>Expense Tracking</CardTitle>
          <CardDescription>Monitor chapter spending</CardDescription>
        </div>
        {!expanded && (
          <Link href={`/${chapterSlug}/admin/finance/expenses`}>
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
                  Total Expenses
                </div>
                <div className="text-2xl font-bold">{formatCurrency(data?.totalExpenses || 0)}</div>
                <div className="text-sm text-muted-foreground">{data?.totalExpensesCount || 0} expenses</div>
              </div>
              <div className="bg-muted/50 p-4 rounded-lg">
                <div className="text-sm font-medium text-muted-foreground">
                  Pending Approval
                </div>
                <div className="text-2xl font-bold">{formatCurrency(data?.pendingAmount || 0)}</div>
                <div className="text-sm text-muted-foreground">{data?.pendingCount || 0} pending</div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
              <div className="p-2 border rounded">
                <div className="text-sm font-medium text-muted-foreground">Pending</div>
                <div className="font-semibold">{data?.statusCounts?.PENDING || 0}</div>
              </div>
              <div className="p-2 border rounded">
                <div className="text-sm font-medium text-muted-foreground">Approved</div>
                <div className="font-semibold">{data?.statusCounts?.APPROVED || 0}</div>
              </div>
              <div className="p-2 border rounded">
                <div className="text-sm font-medium text-muted-foreground">Paid</div>
                <div className="font-semibold">{data?.statusCounts?.PAID || 0}</div>
              </div>
              <div className="p-2 border rounded">
                <div className="text-sm font-medium text-muted-foreground">Denied</div>
                <div className="font-semibold">{data?.statusCounts?.DENIED || 0}</div>
              </div>
            </div>
            
            {expanded && (
              <div className="mt-6 space-y-4">
                <div className="flex justify-between items-center border-b pb-2">
                  <div className="font-medium">Recent Expenses</div>
                  <Link href={`/${chapterSlug}/admin/finance/expenses/new`}>
                    <Button variant="outline" size="sm">
                      Submit New Expense
                    </Button>
                  </Link>
                </div>
                
                {data?.recentExpenses?.length > 0 ? (
                  <div className="space-y-3">
                    {data?.recentExpenses.map((expense: ExpenseItem) => (
                      <div key={expense.id} className="flex justify-between items-center p-3 bg-muted/50 rounded-md">
                        <div>
                          <div className="font-medium">{expense.title}</div>
                          <div className="text-sm text-muted-foreground">
                            Submitted by {expense.submittedBy.name || expense.submittedBy.email}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="font-medium">
                            {formatCurrency(expense.amount)}
                          </div>
                          <Badge variant="outline" className={statusColors[expense.status]}>
                            {expense.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    No recent expenses found.
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
