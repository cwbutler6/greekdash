'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate } from '@/lib/utils';

interface DuesPlan {
  id: string;
  name: string;
  description: string | null;
}

interface PaymentRecord {
  id: string;
  amount: number;
  dueDate: Date;
  paidAt: Date | null;
  status: 'PAID' | 'WAIVED';
  stripePaymentId: string | null;
  notes: string | null;
  duesPlan: DuesPlan | null;
}

interface PaymentHistoryProps {
  payments: PaymentRecord[];
}

export function PaymentHistory({ payments }: PaymentHistoryProps) {
  if (payments.length === 0) {
    return (
      <div className="rounded-md border p-6 text-center">
        <p className="text-sm text-muted-foreground">
          You don&apos;t have any payment history yet.
        </p>
      </div>
    );
  }

  // Get status badge variant
  const getStatusBadgeVariant = (status: PaymentRecord['status']) => {
    if (status === 'PAID') return 'default';
    return 'secondary';
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Description</TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Payment Date</TableHead>
            <TableHead>Payment Method</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.map((payment) => (
            <TableRow key={payment.id}>
              <TableCell>
                <div className="font-medium">{payment.duesPlan?.name || "Chapter Dues"}</div>
                {payment.notes && (
                  <div className="text-xs text-muted-foreground mt-1">{payment.notes}</div>
                )}
              </TableCell>
              <TableCell>{formatDate(payment.dueDate)}</TableCell>
              <TableCell>{formatCurrency(payment.amount)}</TableCell>
              <TableCell>
                <Badge variant={getStatusBadgeVariant(payment.status)}>
                  {payment.status}
                </Badge>
              </TableCell>
              <TableCell>{payment.paidAt ? formatDate(payment.paidAt) : '-'}</TableCell>
              <TableCell>
                {payment.status === 'PAID' 
                  ? (payment.stripePaymentId ? 'Credit Card' : 'Manual') 
                  : '-'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
