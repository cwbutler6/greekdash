import { Suspense } from "react";
import Link from "next/link";
import { BudgetsList } from "@/components/finance/budgets/BudgetsList";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "@radix-ui/react-icons";
import { CardSkeleton } from "@/components/skeletons/card-skeleton";

export default async function BudgetsPage({
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
          title="Budgets"
          description="Create and manage your chapter's budget plans."
        />
        <Link href={`/${chapterSlug}/admin/finance/budgets/new`}>
          <Button>
            <PlusIcon className="mr-2 h-4 w-4" />
            New Budget
          </Button>
        </Link>
      </div>
      
      <Suspense fallback={<CardSkeleton className="h-[600px]" />}>
        <BudgetsList chapterSlug={chapterSlug} />
      </Suspense>
    </div>
  );
}
