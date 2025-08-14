'use client';

import { useState } from 'react';
import { DonationCampaign, DonationCampaignStatus } from '@/generated/prisma';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EditCampaignDialog } from '@/components/finances/donations/edit-campaign-dialog';
import { DeleteCampaignDialog } from '@/components/finances/donations/delete-campaign-dialog';

interface CampaignWithStats extends DonationCampaign {
  totalRaised: number;
  donationCount: number;
  progressPercentage: number;
}

interface DonationCampaignsTableProps {
  campaigns: CampaignWithStats[];
}

function getStatusBadge(status: DonationCampaignStatus) {
  switch (status) {
    case 'ACTIVE':
      return <Badge variant="default">Active</Badge>;
    case 'PAUSED':
      return <Badge variant="secondary">Paused</Badge>;
    case 'COMPLETED':
      return <Badge variant="outline">Completed</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

export function DonationCampaignsTable({ campaigns }: DonationCampaignsTableProps) {
  const [editingCampaign, setEditingCampaign] = useState<CampaignWithStats | null>(null);
  const [deletingCampaign, setDeletingCampaign] = useState<CampaignWithStats | null>(null);

  if (campaigns.length === 0) {
    return (
      <div className="rounded-md border">
        <div className="p-8 text-center">
          <h3 className="text-lg font-medium">No donation campaigns</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Create your first donation campaign to start raising funds
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Campaign</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Progress</TableHead>
              <TableHead>Goal</TableHead>
              <TableHead>Raised</TableHead>
              <TableHead>Donations</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {campaigns.map((campaign) => (
              <TableRow key={campaign.id}>
                <TableCell>
                  <div>
                    <div className="font-medium">{campaign.title}</div>
                    {campaign.description && (
                      <div className="text-sm text-muted-foreground truncate max-w-[200px]">
                        {campaign.description}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>{getStatusBadge(campaign.status)}</TableCell>
                <TableCell>
                  <div className="w-[100px]">
                    <Progress value={campaign.progressPercentage} className="h-2" />
                    <div className="text-xs text-muted-foreground mt-1">
                      {campaign.progressPercentage.toFixed(1)}%
                    </div>
                  </div>
                </TableCell>
                <TableCell>{campaign.goalAmount ? formatCurrency(campaign.goalAmount) : 'No goal set'}</TableCell>
                <TableCell className="font-medium">
                  {formatCurrency(campaign.totalRaised)}
                </TableCell>
                <TableCell>{campaign.donationCount}</TableCell>
                <TableCell>{format(campaign.createdAt, 'MMM d, yyyy')}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditingCampaign(campaign)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => setDeletingCampaign(campaign)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {editingCampaign && (
        <EditCampaignDialog
          campaign={editingCampaign}
          open={!!editingCampaign}
          onOpenChange={(open) => !open && setEditingCampaign(null)}
        />
      )}

      {deletingCampaign && (
        <DeleteCampaignDialog
          campaign={deletingCampaign}
          open={!!deletingCampaign}
          onOpenChange={(open) => !open && setDeletingCampaign(null)}
        />
      )}
    </>
  );
}