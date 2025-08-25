import { Suspense } from "react";
import { CardSkeleton } from "@/components/skeletons/card-skeleton";
import { FinanceSummary } from "@/components/finance/FinanceSummary";
import { RecentTransactions } from "@/components/finance/RecentTransactions";
import { DuesStats } from "@/components/finance/DuesStats";
import { ExpensesStats } from "@/components/finance/ExpensesStats";
import { FundsDashboard } from "@/components/admin/funds-dashboard";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";

export default async function FinanceDashboardPage({
  params,
}: {
  params: Promise<{ chapterSlug: string }>;
}) {
  // Get the chapterSlug from the dynamic route parameter
  const { chapterSlug } = await params;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Finance Dashboard"
        description="Manage your chapter's finances, track dues payments, expenses, and donations."
      >
        <Link href={`/${chapterSlug}/admin/finance/donations`}>
          <Button variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            Manage Donations
          </Button>
        </Link>
      </PageHeader>
      
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="funds">Funds</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="dues">Dues</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="donations">Donations</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
            <Suspense fallback={<CardSkeleton />}>
              <FinanceSummary chapterSlug={chapterSlug} />
            </Suspense>
            
            <Suspense fallback={<CardSkeleton />}>
              <RecentTransactions chapterSlug={chapterSlug} limit={5} />
            </Suspense>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
            <Suspense fallback={<CardSkeleton />}>
              <DuesStats chapterSlug={chapterSlug} />
            </Suspense>
            
            <Suspense fallback={<CardSkeleton />}>
              <ExpensesStats chapterSlug={chapterSlug} />
            </Suspense>
          </div>
        </TabsContent>
        
        <TabsContent value="funds" className="space-y-4">
          <Suspense fallback={<CardSkeleton className="h-[600px]" />}>
            <FundsDashboard chapterSlug={chapterSlug} />
          </Suspense>
        </TabsContent>
        
        <TabsContent value="transactions" className="space-y-4">
          <Suspense fallback={<CardSkeleton className="h-[600px]" />}>
            <RecentTransactions chapterSlug={chapterSlug} limit={25} />
          </Suspense>
        </TabsContent>
        
        <TabsContent value="dues" className="space-y-4">
          <div className="grid gap-4">
            <Suspense fallback={<CardSkeleton className="h-[600px]" />}>
              <DuesStats chapterSlug={chapterSlug} expanded />
            </Suspense>
          </div>
        </TabsContent>
        
        <TabsContent value="expenses" className="space-y-4">
          <div className="grid gap-4">
            <Suspense fallback={<CardSkeleton className="h-[600px]" />}>
              <ExpensesStats chapterSlug={chapterSlug} expanded />
            </Suspense>
          </div>
        </TabsContent>
        
        <TabsContent value="donations" className="space-y-4">
          <div className="text-center py-8">
            <h3 className="text-lg font-medium mb-2">Donation Management</h3>
            <p className="text-muted-foreground mb-4">
              Manage donation campaigns and track donations in the dedicated donations section.
            </p>
            <Link href={`/${chapterSlug}/admin/finance/donations`}>
              <Button>
                Go to Donations
              </Button>
            </Link>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
