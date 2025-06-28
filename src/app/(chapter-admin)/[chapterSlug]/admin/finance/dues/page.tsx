import { requireChapterAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { redirect } from 'next/navigation';
import { DuesPlansTable } from '@/components/finances/dues/dues-plans-table';
import { DuesPaymentTable } from '@/components/finances/dues/dues-payment-table';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CreateDuesPlanDialog } from '@/components/finances/dues/create-dues-plan-dialog';
import { AssignDuesDialog } from '@/components/finances/dues/assign-dues-dialog';

export default async function DuesPage({
  params,
}: {
  params: Promise<{ chapterSlug: string }>;
}) {
  const { chapterSlug } = await params;
  
  // Server-side auth check
  const { chapter } = await requireChapterAdmin(chapterSlug);
  if (!chapter) redirect(`/${chapterSlug}/login`);

  // Fetch dues plans
  const duesPlans = await prisma.duesPlan.findMany({
    where: {
      chapter: { slug: chapterSlug },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Fetch all dues payments
  const duesPayments = await prisma.duesPayment.findMany({
    where: {
      chapter: { slug: chapterSlug },
    },
    include: {
      user: true,
      duesPlan: true,
    },
    orderBy: { dueDate: 'desc' },
  });

  // Fetch dues plan assignments
  const duesPlanAssignments = await prisma.duesPlanAssignment.findMany({
    where: {
      chapter: { slug: chapterSlug },
    },
    include: {
      user: true,
      duesPlan: true,
      assignedByUser: true,
    },
    orderBy: { assignedAt: 'desc' },
  });

  // Check if this chapter can use payments (has Stripe integration)
  const hasPaymentEnabled = Boolean(chapter.stripeCustomerId);

  return (
    <div className="container py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dues Management</h1>
          <p className="text-muted-foreground">
            Create and manage dues plans for your chapter
          </p>
        </div>
        <div className="flex space-x-2">
          <CreateDuesPlanDialog>
            <Button>
              <PlusCircle className="h-4 w-4 mr-2" />
              New Dues Plan
            </Button>
          </CreateDuesPlanDialog>
          
          {duesPlans.length > 0 && (
            <AssignDuesDialog duesPlans={duesPlans}>
              <Button variant="outline">
                Assign Dues to Members
              </Button>
            </AssignDuesDialog>
          )}
        </div>
      </div>

      <Tabs defaultValue="plans">
        <TabsList>
          <TabsTrigger value="plans">Dues Plans</TabsTrigger>
          <TabsTrigger value="assignments">Plan Assignments</TabsTrigger>
          <TabsTrigger value="payments">All Payments</TabsTrigger>
        </TabsList>
        
        <TabsContent value="plans" className="mt-6">
          <DuesPlansTable plans={duesPlans} />
        </TabsContent>
        
        <TabsContent value="assignments" className="mt-6">
          {/* TODO: Create PlanAssignmentsTable component */}
          <div className="rounded-md border">
            <div className="p-4">
              <h3 className="text-lg font-medium">Plan Assignments</h3>
              <p className="text-sm text-muted-foreground mt-1">
                View and manage dues plan assignments to members
              </p>
              {duesPlanAssignments.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">
                  No plan assignments found
                </p>
              ) : (
                <div className="mt-4">
                  {/* Temporary table structure until PlanAssignmentsTable is created */}
                  <div className="space-y-2">
                    {duesPlanAssignments.map((assignment) => (
                      <div key={assignment.id} className="flex justify-between items-center p-2 border rounded">
                        <div>
                          <span className="font-medium">{assignment.user.name}</span>
                          <span className="text-sm text-muted-foreground ml-2">
                            - {assignment.duesPlan.name}
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Assigned by {assignment.assignedByUser.name}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="payments" className="mt-6">
          <DuesPaymentTable 
            payments={duesPayments}
            hasPaymentEnabled={hasPaymentEnabled} 
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}