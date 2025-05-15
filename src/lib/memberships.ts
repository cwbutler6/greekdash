import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * Get the current user's membership for a specific chapter
 */
export async function getCurrentMembership(chapterId: string) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return null;
    }
    
    const membership = await prisma.membership.findUnique({
      where: {
        userId_chapterId: {
          userId: session.user.id,
          chapterId,
        },
      },
    });
    
    return membership;
  } catch (error) {
    console.error('Error fetching current membership:', error);
    return null;
  }
}

/**
 * Get all memberships for a chapter
 */
export async function getChapterMemberships(chapterId: string) {
  try {
    const memberships = await prisma.membership.findMany({
      where: { chapterId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    
    return memberships;
  } catch (error) {
    console.error('Error fetching chapter memberships:', error);
    return [];
  }
}

/**
 * Check if a user has admin access to a chapter
 */
export async function hasAdminAccess(chapterId: string) {
  const membership = await getCurrentMembership(chapterId);
  
  if (!membership) {
    return false;
  }
  
  return membership.role === 'ADMIN' || membership.role === 'OWNER';
}
