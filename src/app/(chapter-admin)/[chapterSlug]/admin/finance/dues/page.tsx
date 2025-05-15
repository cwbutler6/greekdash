import { Suspense } from "react";
import Link from "next/link";
import { DuesList } from "@/components/finance/dues/DuesList";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "@radix-ui/react-icons";
import { CardSkeleton } from "@/components/skeletons/card-skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BulkDuesFormPanel } from "@/components/finance/dues/BulkDuesFormPanel";

export default async function DuesPage({
  params,
}: {
  params: Promise<{ chapterSlug: string }>;
}) {
  // Get the chapterSlug from the dynamic route parameter
  const { chapterSlug } = await params;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Dues Management"
          description="Collect member dues and track payment status."
        />
        <Link href={`/${chapterSlug}/admin/finance/dues/new`}>
          <Button>
            <PlusIcon className="mr-2 h-4 w-4" />
            Add Dues Payment
          </Button>
        </Link>
      </div>
      
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Dues</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="paid">Paid</TabsTrigger>
          <TabsTrigger value="create">Create Bulk</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="space-y-4">
          <Suspense fallback={<CardSkeleton className="h-[600px]" />}>
            <DuesList chapterSlug={chapterSlug} />
          </Suspense>
        </TabsContent>
        
        <TabsContent value="pending" className="space-y-4">
          <Suspense fallback={<CardSkeleton className="h-[600px]" />}>
            <DuesList chapterSlug={chapterSlug} status="pending" />
          </Suspense>
        </TabsContent>
        
        <TabsContent value="paid" className="space-y-4">
          <Suspense fallback={<CardSkeleton className="h-[600px]" />}>
            <DuesList chapterSlug={chapterSlug} status="paid" />
          </Suspense>
        </TabsContent>
        
        <TabsContent value="create" className="space-y-4">
          <BulkDuesFormPanel chapterSlug={chapterSlug} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
