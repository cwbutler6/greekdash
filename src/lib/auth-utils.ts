import { prisma } from "@/lib/db";

/**
 * Check if a user has access to a specific chapter (for API routes)
 * Returns boolean instead of redirecting
 */
export async function hasChapterAccess(
  userEmail: string,
  chapterSlug: string
): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      include: {
        memberships: {
          include: {
            chapter: true
          }
        }
      }
    });

    if (!user) {
      return false;
    }

    // Check if user has any membership in the specified chapter
    const hasAccess = user.memberships.some(
      (membership) => membership.chapter.slug === chapterSlug
    );

    return hasAccess;
  } catch (error) {
    console.error('Error checking chapter access:', error);
    return false;
  }
}

/**
 * Check if a user has admin access to a specific chapter (for API routes)
 * Returns boolean instead of redirecting
 */
export async function hasAdminAccess(
  userEmail: string,
  chapterSlug: string
): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      include: {
        memberships: {
          include: {
            chapter: true
          }
        }
      }
    });

    if (!user) {
      return false;
    }

    // Check if user has admin or owner role in the specified chapter
    const hasAdminRole = user.memberships.some(
      (membership) => 
        membership.chapter.slug === chapterSlug &&
        (membership.role === 'ADMIN' || membership.role === 'OWNER')
    );

    return hasAdminRole;
  } catch (error) {
    console.error('Error checking admin access:', error);
    return false;
  }
}

/**
 * Get user's membership for a specific chapter (for API routes)
 * Returns the membership object or null
 */
export async function getUserChapterMembership(
  userEmail: string,
  chapterSlug: string
) {
  try {
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      include: {
        memberships: {
          include: {
            chapter: true
          }
        }
      }
    });

    if (!user) {
      return null;
    }

    const membership = user.memberships.find(
      (membership) => membership.chapter.slug === chapterSlug
    );

    return membership || null;
  } catch (error) {
    console.error('Error getting user chapter membership:', error);
    return null;
  }
}