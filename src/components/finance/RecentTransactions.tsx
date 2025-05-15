'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Transaction, TransactionType } from '@/generated/prisma';

interface RecentTransactionsProps {
  chapterSlug: string;
  limit?: number;
}

const transactionTypeColors: Record<TransactionType, string> = {
  DUES_PAYMENT: 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100',
  EXPENSE: 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100',
  INCOME: 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100',
  TRANSFER: 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100',
  REFUND: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100',
  OTHER: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100',
};

const transactionTypeIcons: Record<TransactionType, React.ReactNode> = {
  DUES_PAYMENT: <ChevronUp className="h-4 w-4 text-green-600" />,
  EXPENSE: <ChevronDown className="h-4 w-4 text-red-600" />,
  INCOME: <ChevronUp className="h-4 w-4 text-green-600" />,
  TRANSFER: <ChevronRight className="h-4 w-4 text-blue-600" />,
  REFUND: <ChevronUp className="h-4 w-4 text-yellow-600" />,
  OTHER: <ChevronRight className="h-4 w-4 text-gray-600" />,
};

export function RecentTransactions({ chapterSlug, limit = 5 }: RecentTransactionsProps) {
  const { data: transactions, isLoading, error } = useQuery({
    queryKey: ['transactions', chapterSlug, limit],
    queryFn: async () => {
      const res = await fetch(`/api/chapters/${chapterSlug}/finance/transactions?limit=${limit}`);
      if (!res.ok) {
        throw new Error('Failed to fetch transactions');
      }
      return res.json();
    },
  });

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>Error loading transaction data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-4">
            <AlertCircle className="h-8 w-8 text-destructive mr-2" />
            <p>Failed to load transaction data. Please try again later.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>Latest financial activity</CardDescription>
        </div>
        <Link href={`/${chapterSlug}/admin/finance/transactions`}>
          <Button variant="ghost" size="sm">
            View All
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: limit }).map((_, index) => (
              <div key={index} className="flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[200px]" />
                  <Skeleton className="h-4 w-[160px]" />
                </div>
              </div>
            ))}
          </div>
        ) : transactions?.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            No transactions found.
          </div>
        ) : (
          <div className="space-y-4">
            {transactions?.map((transaction: Transaction) => (
              <div key={transaction.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-full p-2 bg-muted">
                    {transactionTypeIcons[transaction.type as TransactionType]}
                  </div>
                  <div>
                    <div className="font-medium">{transaction.description || getTransactionDescription(transaction)}</div>
                    <div className="text-sm text-muted-foreground">
                      {formatDate(transaction.createdAt)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`font-medium ${transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(transaction.amount)}
                  </div>
                  <Badge variant="outline" className={transactionTypeColors[transaction.type as TransactionType]}>
                    {transaction.type.replace('_', ' ')}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Helper function to generate a description if none is provided
function getTransactionDescription(transaction: Transaction): string {
  // Handle expense-related transactions
  if (transaction.expenseId) {
    return `Expense payment`;
  }

  // Handle dues payment-related transactions
  if (transaction.duesPaymentId) {
    return `Dues payment`;
  }

  // Handle specific transaction types with friendly descriptions
  switch (transaction.type) {
    case TransactionType.TRANSFER:
      return 'Funds transfer';
    case TransactionType.REFUND:
      return 'Refund processed';
    case TransactionType.INCOME:
      return 'Income received';
    case TransactionType.OTHER:
      return 'Other transaction';
    default:
      // Default description based on transaction type
      return transaction.type.replace('_', ' ');
  }
}
