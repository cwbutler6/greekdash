import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireChapterAccess } from "@/lib/auth";
import { withApiLogging } from "@/lib/api-logger";
import { createChapterLogger } from "@/lib/logger";

// Define Transaction type for the response
type TransactionRecord = {
  id: string;
  amount: number;
  type: string;
  description: string | null;
  metadata: unknown; // Using unknown instead of any for better type safety while remaining compatible with Prisma
  createdAt: Date;
  processedAt: Date | null;
  chapterId: string;
  expenseId: string | null;
  duesPaymentId: string | null;
};
// Define enum for membership roles since MembershipRole might not be exported from Prisma directly
enum MembershipRoleEnum {
  MEMBER = "MEMBER",
  ADMIN = "ADMIN",
  OWNER = "OWNER"
}

// API route to get billing information for a chapter
export const GET = withApiLogging(async (
  request: Request,
  { params }: { params: Promise<{ chapterSlug: string }> }
) => {
  // In Next.js 15, params is a Promise that needs to be awaited
  const { chapterSlug } = await params;
  const logger = createChapterLogger(chapterSlug);

  try {
    if (!chapterSlug) {
      return NextResponse.json(
        { error: "Chapter slug is required" },
        { status: 400 }
      );
    }

    // Get the authenticated user and membership with access check
    const { membership } = await requireChapterAccess(chapterSlug);

    // Check if the user has admin privileges
    if (
      membership.role !== MembershipRoleEnum.ADMIN &&
      membership.role !== MembershipRoleEnum.OWNER
    ) {
      return NextResponse.json(
        { error: "You must be an admin to access this resource" },
        { status: 403 }
      );
    }

    // Find the chapter with its subscription
    const chapter = await prisma.chapter.findUnique({
      where: { slug: chapterSlug },
      include: {
        subscription: true,
      },
    });

    if (!chapter) {
      return NextResponse.json(
        { error: "Chapter not found" },
        { status: 404 }
      );
    }

    // Get finance features available based on subscription plan
    const financeFeatures = getFinanceFeatures(chapter.subscription?.plan || "FREE");
    
    // Get any pending finance-related invoices
    let pendingInvoices: TransactionRecord[] = [];
    try {
      // Try to fetch invoices with the 'EXPENSE' transaction type
      pendingInvoices = await prisma.transaction.findMany({
        where: {
          chapterId: chapter.id,
          type: "EXPENSE",
          metadata: {
            path: ["transactionCategory"],
            equals: "invoice",
          },
          AND: {
            metadata: {
              path: ["status"],
              equals: "pending",
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 5,
      });
    } catch (error) {
      logger.error(
        'Failed to fetch pending invoices',
        error instanceof Error ? error : new Error('Unknown error'),
        { action: 'fetch_pending_invoices' }
      );
      // Keep pendingInvoices as empty array in case of error
      // This allows the page to load even if there's an issue with the TransactionType enum
    }
    
    // Get finance module usage statistics
    const financeStats = await getFinanceStats(chapter.id, logger);
    
    // Return the chapter with enhanced billing information
    return NextResponse.json({
      success: true,
      chapter: {
        id: chapter.id,
        name: chapter.name,
        slug: chapter.slug,
        stripeCustomerId: chapter.stripeCustomerId,
        subscription: chapter.subscription,
      },
      financeFeatures,
      pendingInvoices,
      financeStats,
    });
  } catch (error) {
    logger.error(
      'Failed to fetch chapter billing information',
      error instanceof Error ? error : new Error('Unknown error'),
      { action: 'fetch_billing_info' }
    );
    throw error;
  }
}, 'chapters/[chapterSlug]/billing');

export const POST = withApiLogging(async (
  request: Request,
  { params }: { params: Promise<{ chapterSlug: string }> }
) => {
  const { chapterSlug } = await params;
  const logger = createChapterLogger(chapterSlug);
  
  try {
    if (!chapterSlug) {
      return NextResponse.json(
        { error: "Chapter slug is required" },
        { status: 400 }
      );
    }

    // Get the authenticated user and membership with access check
    const { membership } = await requireChapterAccess(chapterSlug);

    // Check if the user has owner privileges (only owners can change subscription)
    if (membership.role !== MembershipRoleEnum.OWNER) {
      return NextResponse.json(
        { error: "You must be the chapter owner to modify billing settings" },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    
    const planSchema = z.object({
      plan: z.enum(["FREE", "BASIC", "PRO"]),
    });
    
    const { plan } = planSchema.parse(body);
    
    // Get the chapter
    const chapter = await prisma.chapter.findUnique({
      where: { slug: chapterSlug },
      include: { subscription: true },
    });

    if (!chapter) {
      return NextResponse.json(
        { error: "Chapter not found" },
        { status: 404 }
      );
    }
    
    // Handle plan change
    if (plan === "FREE" && chapter.subscription?.plan !== "FREE") {
      // Downgrading to FREE plan
      if (chapter.subscription?.stripeSubscriptionId) {
        // In a real implementation, cancel the Stripe subscription here
        logger.info('Subscription cancellation requested', {
          action: 'cancel_subscription',
          metadata: { stripeSubscriptionId: chapter.subscription.stripeSubscriptionId }
        });
      }
      
      // Update subscription in database
      await prisma.subscription.upsert({
        where: { 
          chapterId: chapter.id 
        },
        update: { 
          plan: "FREE",
          status: "ACTIVE",
          updatedAt: new Date(),
        },
        create: {
          chapterId: chapter.id,
          plan: "FREE",
          status: "ACTIVE"
        },
      });
      
      // Record the plan change in the transactions table for finance tracking
      await prisma.transaction.create({
        data: {
          amount: 0,
          type: "INCOME",
          description: `Subscription downgraded to FREE plan`,
          chapterId: chapter.id,
          metadata: {
            transactionCategory: "PLAN_CHANGE",
            fromPlan: chapter.subscription?.plan || "NONE",
            toPlan: "FREE",
            effective: new Date().toISOString()
          },
          processedAt: new Date(),
        },
      });
      
      return NextResponse.json({ 
        success: true, 
        message: "Successfully downgraded to FREE plan",
        plan: "FREE",
        financeFeatures: getFinanceFeatures("FREE")
      });
    } else if (plan !== "FREE") {
      // Upgrading to a paid plan or changing between paid plans
      // In a real implementation, this would create a Stripe checkout session
      // For now, simulate creating a checkout URL
      const checkoutUrl = `/api/checkout/session?chapter=${chapterSlug}&plan=${plan}`;
      
      return NextResponse.json({ 
        success: true,
        message: "Redirecting to checkout",
        checkoutUrl,
        plan,
        financeFeatures: getFinanceFeatures(plan)
      });
    } else {
      // Already on FREE plan, no changes needed
      return NextResponse.json({ 
        success: true, 
        message: "No changes made - already on FREE plan",
        plan: "FREE",
        financeFeatures: getFinanceFeatures("FREE")
      });
    }
  } catch (error) {
    logger.error(
      'Failed to update subscription plan',
      error instanceof Error ? error : new Error('Unknown error'),
      { action: 'update_subscription_plan' }
    );
    throw error;
  }
}, 'chapters/[chapterSlug]/billing');

// Helper function to get finance features available for a given plan
function getFinanceFeatures(plan: string): Record<string, boolean> {
  switch (plan) {
    case "PRO":
      return {
        basicFinance: true,
        budgeting: true,
        expenseTracking: true,
        duesCollection: true,
        advancedReporting: true,
        financialForecasting: true,
        multipleAccounts: true,
        dataExport: true,
        auditTrail: true,
        donationTracking: true,
      };
    case "BASIC":
      return {
        basicFinance: true,
        budgeting: true,
        expenseTracking: true,
        duesCollection: true,
        advancedReporting: false,
        financialForecasting: false,
        multipleAccounts: false,
        dataExport: true,
        auditTrail: false,
        donationTracking: false,
      };
    case "FREE":
    default:
      return {
        basicFinance: true,
        budgeting: false,
        expenseTracking: false,
        duesCollection: false,
        advancedReporting: false,
        financialForecasting: false,
        multipleAccounts: false,
        dataExport: false,
        auditTrail: false,
        donationTracking: false,
      };
  }
}

// Helper function to get finance module usage statistics
async function getFinanceStats(chapterId: string, logger: ReturnType<typeof createChapterLogger>) {
  try {
    // Get financial stats for the chapter
    const budgetCount = await prisma.budget.count({ where: { chapterId } });
    const expenseCount = await prisma.expense.count({ where: { chapterId } });
    const duesCount = await prisma.duesPayment.count({ where: { chapterId } });
    
    let totalDuesAmount = 0;
    let totalExpensesAmount = 0;
    
    try {
      // Try to get paid dues - might fail if paidAt column doesn't exist yet
      const totalDuesResult = await prisma.duesPayment.aggregate({
        where: {
          chapterId,
          paidAt: { not: null },
        },
        _sum: { amount: true },
      });
      totalDuesAmount = totalDuesResult._sum.amount || 0;
    } catch (error) {
      logger.error(
        'Error getting dues payments with paidAt filter',
        error instanceof Error ? error : new Error('Unknown error'),
        { action: 'get_paid_dues' }
      );
      // Fallback: sum all dues payments regardless of paid status
      try {
        const allDuesResult = await prisma.duesPayment.aggregate({
          where: { chapterId },
          _sum: { amount: true },
        });
        totalDuesAmount = allDuesResult._sum.amount || 0;
      } catch (innerError) {
        logger.error(
          'Error getting all dues payments',
          innerError instanceof Error ? innerError : new Error('Unknown error'),
          { action: 'get_all_dues' }
        );
      }
    }
    
    try {
      // Try to get expenses with PAID status
      const totalExpensesResult = await prisma.expense.aggregate({
        where: {
          chapterId,
          status: "PAID",
        },
        _sum: { amount: true },
      });
      totalExpensesAmount = totalExpensesResult._sum.amount || 0;
    } catch (error) {
      logger.error(
        'Error getting paid expenses',
        error instanceof Error ? error : new Error('Unknown error'),
        { action: 'get_paid_expenses' }
      );
      // If ExpenseStatus enum doesn't exist, try querying all expenses instead
      try {
        const allExpensesResult = await prisma.expense.aggregate({
          where: { chapterId },
          _sum: { amount: true },
        });
        totalExpensesAmount = allExpensesResult._sum.amount || 0;
      } catch (innerError) {
        logger.error(
          'Error getting all expenses',
          innerError instanceof Error ? innerError : new Error('Unknown error'),
          { action: 'get_all_expenses' }
        );
      }
    }
    
    return {
      budgetCount,
      expenseCount,
      duesCount,
      totalRevenue: totalDuesAmount,
      totalExpenses: totalExpensesAmount,
      balance: totalDuesAmount - totalExpensesAmount,
    };
  } catch (error) {
    logger.error(
      'Error getting finance stats',
      error instanceof Error ? error : new Error('Unknown error'),
      { action: 'get_finance_stats' }
    );
    return {
      budgetCount: 0,
      expenseCount: 0,
      duesCount: 0,
      totalRevenue: 0,
      totalExpenses: 0,
      balance: 0,
    };
  }
}
