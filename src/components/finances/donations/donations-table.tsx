'use client';

import { Donation, DonationStatus, User, DonationCampaign } from '@/generated/prisma';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';

interface DonationWithRelations extends Donation {
  user: User | null;
  campaign: DonationCampaign | null;
}

interface DonationsTableProps {
  donations: DonationWithRelations[];
  hasPaymentEnabled: boolean;
}

function getStatusBadge(status: DonationStatus) {
  switch (status) {
    case 'PENDING':
      return <Badge variant="secondary">Pending</Badge>;
    case 'COMPLETED':
      return <Badge variant="default">Completed</Badge>;
    case 'FAILED':
      return <Badge variant="destructive">Failed</Badge>;
    case 'REFUNDED':
      return <Badge variant="outline">Refunded</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

export function DonationsTable({ donations }: DonationsTableProps) {
  if (donations.length === 0) {
    return (
      <div className="rounded-md border">
        <div className="p-8 text-center">
          <h3 className="text-lg font-medium">No donations</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Donations will appear here once members start contributing
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Donor</TableHead>
            <TableHead>Campaign</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Message</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Payment ID</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {donations.map((donation) => (
            <TableRow key={donation.id}>
              <TableCell>
                <div>
                  <div className="font-medium">
                    {donation.isAnonymous ? 'Anonymous' : (donation.user?.name || donation.donorName || 'Unknown')}
                  </div>
                  {!donation.isAnonymous && donation.donorEmail && (
                    <div className="text-sm text-muted-foreground">
                      {donation.donorEmail}
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="font-medium">
                  {donation.campaign?.title || 'General Donation'}
                </div>
              </TableCell>
              <TableCell className="font-medium">
                {formatCurrency(donation.amount)}
              </TableCell>
              <TableCell>{getStatusBadge(donation.status)}</TableCell>
              <TableCell>
                {donation.message ? (
                  <div className="max-w-[200px] truncate" title={donation.message}>
                    {donation.message}
                  </div>
                ) : (
                  <span className="text-muted-foreground">No message</span>
                )}
              </TableCell>
              <TableCell>{format(donation.createdAt, 'MMM d, yyyy')}</TableCell>
              <TableCell>
                {donation.stripePaymentIntentId ? (
                  <code className="text-xs bg-muted px-1 py-0.5 rounded">
                    {donation.stripePaymentIntentId.slice(-8)}
                  </code>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}