import { requireChapterAccess } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { redirect } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DuesPaymentTable } from '@/components/finances/dues/dues-payment-table';

// Since the payment-history component seems to be missing a type declaration file,
// we'll define the PaymentRecord type here directly
interface PaymentRecord {
  id: string;
  amount: number;
  dueDate: Date;
  paidAt: Date | null;
  status: 'PAID' | 'WAIVED';
  stripePaymentId: string | null;
  notes: string | null;
  duesPlan: {
    id: string;
    name: string;
    description: string | null;
  } | null;
};

// Create a PaymentHistory component here since the import is failing
function PaymentHistory({ payments }: { payments: PaymentRecord[] }) {
  return (
    <div className="rounded-md border">
      <table className="w-full">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="p-2 text-left font-medium">Date</th>
            <th className="p-2 text-left font-medium">Plan</th>
            <th className="p-2 text-left font-medium">Amount</th>
            <th className="p-2 text-left font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {payments.length === 0 ? (
            <tr>
              <td colSpan={4} className="p-4 text-center text-muted-foreground">
                No payment history available
              </td>
            </tr>
          ) : (
            payments.map((payment) => (
              <tr key={payment.id} className="border-b">
                <td className="p-2">{payment.paidAt?.toLocaleDateString() || 'N/A'}</td>
                <td className="p-2">{payment.duesPlan?.name || 'Manual Payment'}</td>
                <td className="p-2">${payment.amount.toFixed(2)}</td>
                <td className="p-2">
                  <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                    payment.status === 'PAID' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {payment.status}
                  </span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default async function MemberDuesPage({
  params,
}: {
  params: Promise<{ chapterSlug: string }>;
}) {
  const { chapterSlug } = await params;
  
  // Server-side auth check
  const { membership, user } = await requireChapterAccess(chapterSlug);
  if (!membership) redirect(`/${chapterSlug}/login`);

  // Get chapter
  const chapter = await prisma.chapter.findUnique({
    where: { slug: chapterSlug },
  });

  if (!chapter) redirect('/login');

  // Fetch outstanding dues
  // Fetch only dues payments for plans assigned to this user
  const outstandingDues = await prisma.duesPayment.findMany({
    where: {
      chapter: { slug: chapterSlug },
      userId: user.id,
      status: { in: ['PENDING', 'OVERDUE'] },
      // Only include dues from assigned plans or manual assignments
      OR: [
        {
          duesPlan: {
            assignments: {
              some: {
                userId: user.id,
                isActive: true,
              },
            },
          },
        },
        {
          duesPlanId: { equals: undefined }, // Manual dues assignments
        },
      ],
    },
    select: {
      id: true,
      amount: true,
      dueDate: true,
      paidAt: true,
      status: true,
      stripePaymentIntentId: true,  // Changed from stripePaymentId
      stripeCheckoutUrl: true,      // This field exists, stripeInvoiceId does not
      createdAt: true,
      updatedAt: true,
      notes: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      duesPlan: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: { dueDate: 'asc' },
  });

  // Fetch payment history
  const paymentHistory = await prisma.duesPayment.findMany({
    where: {
      userId: user.id,
      chapterId: chapter.id,
      status: { in: ['PAID', 'WAIVED'] }
    },
    include: {
      duesPlan: true
    },
    orderBy: {
      paidAt: 'desc'
    }
  });

  // Check if chapter has payment enabled
  const hasPaymentEnabled = Boolean(chapter.stripeCustomerId);

  return (
    <div className="container py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Chapter Dues</h1>
        <p className="text-muted-foreground">
          View and pay your chapter dues
        </p>
      </div>

      <Tabs defaultValue="dues">
        <TabsList>
          <TabsTrigger value="dues">Outstanding Dues</TabsTrigger>
          <TabsTrigger value="history">Payment History</TabsTrigger>
        </TabsList>
        
        <TabsContent value="dues" className="mt-6">
          <DuesPaymentTable 
            payments={outstandingDues}
            hasPaymentEnabled={hasPaymentEnabled} 
          />
        </TabsContent>
        
        <TabsContent value="history" className="mt-6">
          <PaymentHistory 
            payments={paymentHistory.map(payment => ({
              id: payment.id,
              amount: payment.amount,
              dueDate: payment.dueDate,
              paidAt: payment.paidAt,
              status: payment.status as 'PAID' | 'WAIVED',
              stripePaymentId: payment.stripePaymentIntentId,
              notes: payment.notes,
              duesPlan: payment.duesPlan ? {
                id: payment.duesPlan.id,
                name: payment.duesPlan.name,
                description: payment.duesPlan.description
              } : null
            }))} 
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
