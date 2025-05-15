import { Suspense } from "react";
import Link from "next/link";
import { ExpensesList } from "@/components/finance/expenses/ExpensesList";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "@radix-ui/react-icons";
import { CardSkeleton } from "@/components/skeletons/card-skeleton";

export default async function ExpensesPage({
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
          title="Expenses"
          description="Track and manage chapter expenses and reimbursements."
        />
        <Link href={`/${chapterSlug}/admin/finance/expenses/new`}>
          <Button>
            <PlusIcon className="mr-2 h-4 w-4" />
            Submit Expense
          </Button>
        </Link>
      </div>
      
      <Suspense fallback={<CardSkeleton className="h-[600px]" />}>
        <ExpensesList chapterSlug={chapterSlug} />
      </Suspense>
    </div>
  );
}
