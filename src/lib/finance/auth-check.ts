import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

// Enum for membership roles
export enum FinanceAccessRole {
  MEMBER = "MEMBER",
  ADMIN = "ADMIN",
  OWNER = "OWNER"
}

// Define the membership return type
export interface Subscription {
  id: string;
  plan: string;
  status: string;
  chapterId: string;
  stripeSubscriptionId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Chapter {
  id: string;
  name: string;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
  stripeCustomerId?: string | null;
  subscription?: Subscription | null;
}

export interface ChapterMembership {
  id: string;
  userId: string;
  chapterId: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
  chapter: Chapter;
}

/**
 * Require chapter access with finance permissions
 * This function checks if the current user has access to the chapter's finance features
 * based on their role and the subscription plan.
 */
export async function requireFinanceAccess(
  chapterSlug: string, 
  requiredRole: FinanceAccessRole = FinanceAccessRole.MEMBER
): Promise<{ membership: ChapterMembership; chapter: Chapter }> {
  // Get the current session
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    throw new Error("Authentication required");
  }
  
  // Check if the user has membership with required access to the chapter
  const membership = await prisma.membership.findFirst({
    where: {
      userId: session.user.id,
      chapter: {
        slug: chapterSlug,
      },
      role: 
        requiredRole === FinanceAccessRole.OWNER
          ? "OWNER" 
          : requiredRole === FinanceAccessRole.ADMIN
            ? { in: ["ADMIN", "OWNER"] }
            : { in: ["MEMBER", "ADMIN", "OWNER"] },
    },
    include: {
      chapter: {
        include: {
          subscription: true,
        },
      },
    },
  });
  
  if (!membership) {
    throw new Error("You don't have access to this chapter");
  }
  
  const { chapter } = membership;
  
  // Check subscription for finance feature access
  if (!hasFinanceFeatureAccess(chapter.subscription?.plan || "FREE", requiredRole)) {
    throw new Error(
      requiredRole === FinanceAccessRole.MEMBER
        ? "This feature is not available on your current plan"
        : `You need ${requiredRole} permissions and an appropriate subscription plan to access this feature`
    );
  }
  
  return { membership, chapter };
}

/**
 * Check if the chapter's subscription plan includes the requested finance feature
 */
function hasFinanceFeatureAccess(plan: string, requiredRole: FinanceAccessRole): boolean {
  // Define which features are available in each plan
  const planFeatures: Record<string, Record<string, boolean>> = {
    FREE: {
      basicFinance: true,
      budgeting: false,
      expenseTracking: false,
      duesCollection: false,
    },
    BASIC: {
      basicFinance: true,
      budgeting: true,
      expenseTracking: true,
      duesCollection: true,
    },
    PRO: {
      basicFinance: true,
      budgeting: true,
      expenseTracking: true,
      duesCollection: true,
      advancedReporting: true,
    },
  };

  // Basic finance access is available to all users on all plans
  if (requiredRole === FinanceAccessRole.MEMBER && planFeatures[plan]?.basicFinance) {
    return true;
  }

  // For admin and owner operations, check if the plan supports more advanced features
  const hasAdminFeatures = 
    requiredRole !== FinanceAccessRole.OWNER &&
    (planFeatures[plan]?.budgeting || 
     planFeatures[plan]?.expenseTracking || 
     planFeatures[plan]?.duesCollection);
  
  // Owner operations like advanced reporting require PRO plan
  const hasOwnerFeatures = 
    requiredRole === FinanceAccessRole.OWNER &&
    planFeatures[plan]?.advancedReporting;
    
  // Return true if the plan supports the required features for the role
  return requiredRole === FinanceAccessRole.OWNER
    ? hasOwnerFeatures
    : requiredRole === FinanceAccessRole.ADMIN
      ? hasAdminFeatures
      : true; // Members always have some level of access
}
