import { requireChapterAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { DonationsTable } from '@/components/finances/donations/donations-table';
import { DonationCampaignsTable } from '@/components/finances/donations/donation-campaigns-table';
import { CreateCampaignDialog } from '@/components/finances/donations/create-campaign-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';

export default async function DonationsAdminPage({
  params,
}: {
  params: Promise<{ chapterSlug: string }>;
}) {
  const { chapterSlug } = await params;
  const { chapter } = await requireChapterAdmin(chapterSlug);

  // Fetch donations with relations
  const donations = await prisma.donation.findMany({
    where: { chapterId: chapter.id },
    include: {
      user: true,
      campaign: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  // Fetch campaigns with stats
  const campaigns = await prisma.donationCampaign.findMany({
    where: { chapterId: chapter.id },
    include: {
      donations: {
        where: { status: 'COMPLETED' },
      },
      _count: {
        select: { donations: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Calculate campaign stats
  const campaignsWithStats = campaigns.map(campaign => {
    const totalRaised = campaign.donations.reduce((sum, donation) => sum + donation.amount, 0);
    const donationCount = campaign._count.donations;
    const progressPercentage = campaign.goalAmount ? (totalRaised / campaign.goalAmount) * 100 : 0;
    
    return {
      ...campaign,
      totalRaised,
      donationCount,
      progressPercentage,
    };
  });

  // Calculate summary stats
  const totalDonations = donations.filter(d => d.status === 'COMPLETED').reduce((sum, d) => sum + d.amount, 0);
  const totalDonationCount = donations.filter(d => d.status === 'COMPLETED').length;
  const activeCampaigns = campaigns.filter(c => c.status === 'ACTIVE').length;
  const pendingDonations = donations.filter(d => d.status === 'PENDING').length;

  // Check if Stripe is enabled
  const hasPaymentEnabled = !!process.env.STRIPE_SECRET_KEY;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Donation Management"
        description="Manage donation campaigns and track donations for your chapter."
      >
        <CreateCampaignDialog>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Campaign
          </Button>
        </CreateCampaignDialog>
      </PageHeader>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Donations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalDonations)}</div>
            <p className="text-xs text-muted-foreground">
              {totalDonationCount} completed donations
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCampaigns}</div>
            <p className="text-xs text-muted-foreground">
              {campaigns.length} total campaigns
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Donations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingDonations}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting payment confirmation
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Payment Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {hasPaymentEnabled ? '✅' : '❌'}
            </div>
            <p className="text-xs text-muted-foreground">
              {hasPaymentEnabled ? 'Stripe enabled' : 'Payments disabled'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Campaigns and Donations */}
      <Tabs defaultValue="campaigns" className="space-y-4">
        <TabsList>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="donations">Donations</TabsTrigger>
        </TabsList>
        
        <TabsContent value="campaigns" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Donation Campaigns</CardTitle>
              <CardDescription>
                Manage your chapter&apos;s donation campaigns and track their progress.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DonationCampaignsTable campaigns={campaignsWithStats} />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="donations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Donations</CardTitle>
              <CardDescription>
                View and manage all donations received by your chapter.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DonationsTable 
                donations={donations} 
                hasPaymentEnabled={hasPaymentEnabled}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}