'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DollarSign, CreditCard, TrendingUp, AlertCircle } from 'lucide-react';
import { formatCurrency } from "@/lib/utils/format";
import { Skeleton } from '@/components/ui/skeleton';

interface FinanceSummaryProps {
  chapterSlug: string;
}

export function FinanceSummary({ chapterSlug }: FinanceSummaryProps) {
  const [timeframe, setTimeframe] = useState<'month' | 'quarter' | 'year'>('month');

  const { data: summary, isLoading, error } = useQuery({
    queryKey: ['finance-summary', chapterSlug, timeframe],
    queryFn: async () => {
      const res = await fetch(`/api/chapters/${chapterSlug}/finance/summary?timeframe=${timeframe}`);
      if (!res.ok) {
        throw new Error('Failed to fetch financial summary');
      }
      return res.json();
    },
  });

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Finance Summary</CardTitle>
          <CardDescription>Error loading financial data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-4">
            <AlertCircle className="h-8 w-8 text-destructive mr-2" />
            <p>Failed to load financial summary. Please try again later.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Financial Overview</CardTitle>
            <CardDescription>Track your chapter&apos;s financial health</CardDescription>
          </div>
          <Tabs
            value={timeframe}
            onValueChange={(value) => setTimeframe(value as 'month' | 'quarter' | 'year')}
            className="w-[200px]"
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="month">Month</TabsTrigger>
              <TabsTrigger value="quarter">Quarter</TabsTrigger>
              <TabsTrigger value="year">Year</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 grid-cols-2">
          {/* Balance */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="flex items-center">
              <div className="mr-2 rounded-full p-2 bg-primary/10">
                <DollarSign className="h-4 w-4 text-primary" />
              </div>
              <div className="text-sm font-medium">Balance</div>
            </div>
            {isLoading ? (
              <Skeleton className="h-8 w-24 mt-2" />
            ) : (
              <div className="text-2xl font-bold mt-2">
                {formatCurrency(summary?.balance || 0)}
              </div>
            )}
          </div>

          {/* Income */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="flex items-center">
              <div className="mr-2 rounded-full p-2 bg-green-500/10">
                <TrendingUp className="h-4 w-4 text-green-500" />
              </div>
              <div className="text-sm font-medium">Income</div>
            </div>
            {isLoading ? (
              <Skeleton className="h-8 w-24 mt-2" />
            ) : (
              <div className="text-2xl font-bold mt-2">
                {formatCurrency(summary?.totalIncome || 0)}
              </div>
            )}
          </div>

          {/* Expenses */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="flex items-center">
              <div className="mr-2 rounded-full p-2 bg-red-500/10">
                <CreditCard className="h-4 w-4 text-red-500" />
              </div>
              <div className="text-sm font-medium">Expenses</div>
            </div>
            {isLoading ? (
              <Skeleton className="h-8 w-24 mt-2" />
            ) : (
              <div className="text-2xl font-bold mt-2">
                {formatCurrency(summary?.totalExpenses || 0)}
              </div>
            )}
          </div>

          {/* Active Budgets */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="flex items-center">
              <div className="mr-2 rounded-full p-2 bg-blue-500/10">
                <DollarSign className="h-4 w-4 text-blue-500" />
              </div>
              <div className="text-sm font-medium">Active Budgets</div>
            </div>
            {isLoading ? (
              <Skeleton className="h-8 w-24 mt-2" />
            ) : (
              <div className="text-2xl font-bold mt-2">
                {summary?.activeBudgetsCount || 0}
              </div>
            )}
          </div>
        </div>

        <div className="grid gap-4 grid-cols-2 mt-4">
          {/* Pending Dues */}
          <div className="p-4 border rounded-lg">
            <div className="text-sm font-medium text-muted-foreground">
              Unpaid Dues
            </div>
            {isLoading ? (
              <Skeleton className="h-8 w-24 mt-2" />
            ) : (
              <>
                <div className="text-xl font-semibold mt-2">
                  {formatCurrency(summary?.unpaidDues?.amount || 0)}
                </div>
                <div className="text-sm text-muted-foreground">{summary?.unpaidDues?.count || 0} payments</div>
              </>
            )}
          </div>

          {/* Pending Expenses */}
          <div className="p-4 border rounded-lg">
            <div className="text-sm font-medium text-muted-foreground">
              Pending Expenses
            </div>
            {isLoading ? (
              <Skeleton className="h-8 w-24 mt-2" />
            ) : (
              <>
                <div className="text-xl font-semibold mt-2">
                  {formatCurrency(summary?.pendingExpenses?.amount || 0)}
                </div>
                <div className="text-sm text-muted-foreground">{summary?.pendingExpenses?.count || 0} requests</div>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
