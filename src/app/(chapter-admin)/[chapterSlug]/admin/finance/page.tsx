import { Suspense } from "react";
import { CardSkeleton } from "@/components/skeletons/card-skeleton";
import { FinanceSummary } from "@/components/finance/FinanceSummary";
import { RecentTransactions } from "@/components/finance/RecentTransactions";
import { DuesStats } from "@/components/finance/DuesStats";
import { ExpensesStats } from "@/components/finance/ExpensesStats";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
        description="Manage your chapter's finances, track dues payments, and expenses."
      />
      
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="dues">Dues</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
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
      </Tabs>
    </div>
  );
}
