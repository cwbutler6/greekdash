import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireChapterAccess } from "@/lib/auth";
// Define enum for membership roles since MembershipRole might not be exported from Prisma directly
enum MembershipRoleEnum {
  MEMBER = "MEMBER",
  ADMIN = "ADMIN",
  OWNER = "OWNER"
}

// API route to get billing information for a chapter
export async function GET(
  request: Request,
  { params }: { params: Promise<{ chapterSlug: string }> }
) {
  try {
    // In Next.js 15, params is a Promise that needs to be awaited
    const { chapterSlug } = await params;

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
    const pendingInvoices = await prisma.transaction.findMany({
      where: {
        chapterId: chapter.id,
        type: "OTHER",
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
    
    // Get finance module usage statistics
    const financeStats = await getFinanceStats(chapter.id);
    
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
    console.error("Error fetching chapter billing information:", error);
    return NextResponse.json(
      { error: "Failed to fetch billing information" },
      { status: 500 }
    );
  }
}

// POST /api/chapters/[chapterSlug]/billing - Update subscription plan
export async function POST(
  request: Request,
  { params }: { params: Promise<{ chapterSlug: string }> }
) {
  try {
    // Get chapter slug from params
    const { chapterSlug } = await params;

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
        console.log(`Would cancel subscription: ${chapter.subscription.stripeSubscriptionId}`);
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
          type: "OTHER",
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
    console.error("Error updating subscription plan:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid plan data", issues: error.issues },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to update subscription plan" },
      { status: 500 }
    );
  }
}

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
async function getFinanceStats(chapterId: string) {
  // Get financial stats for the chapter
  const budgetCount = await prisma.budget.count({ where: { chapterId } });
  const expenseCount = await prisma.expense.count({ where: { chapterId } });
  const duesCount = await prisma.duesPayment.count({ where: { chapterId } });
  
  const totalDuesResult = await prisma.duesPayment.aggregate({
    where: {
      chapterId,
      paidAt: { not: null },
    },
    _sum: { amount: true },
  });
  
  const totalExpensesResult = await prisma.expense.aggregate({
    where: {
      chapterId,
      status: "PAID",
    },
    _sum: { amount: true },
  });
  
  return {
    budgetCount,
    expenseCount,
    duesCount,
    totalRevenue: totalDuesResult._sum.amount || 0,
    totalExpenses: totalExpensesResult._sum.amount || 0,
    balance: (totalDuesResult._sum.amount || 0) - (totalExpensesResult._sum.amount || 0),
  };
}
