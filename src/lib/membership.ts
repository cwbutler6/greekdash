import { prisma } from '@/lib/db';
import { randomBytes } from 'crypto';

/**
 * Generates a unique join code for a chapter
 * Note: In the current schema, joinCode is a field on the Chapter model (not a separate model)
 */
export async function generateJoinCode({ 
  chapterSlug, 
  expiresInDays = 7 
}: { 
  chapterSlug: string, 
  expiresInDays?: number 
}) {
  // Find the chapter
  const chapter = await prisma.chapter.findUnique({
    where: { slug: chapterSlug }
  });

  if (!chapter) {
    throw new Error(`Chapter with slug '${chapterSlug}' not found`);
  }

  // Generate a random 6-character code (letters and numbers)
  const code = randomBytes(3).toString('hex').toUpperCase();

  // Update the chapter with the new join code
  const updatedChapter = await prisma.chapter.update({
    where: { id: chapter.id },
    data: { joinCode: code }
  });

  return { 
    code: updatedChapter.joinCode,
    chapterId: chapter.id,
    expiresAt: new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000) 
  };
}

/**
 * Validates a join code for a chapter
 */
export async function validateJoinCode({
  chapterSlug,
  code
}: {
  chapterSlug: string,
  code: string
}) {
  const chapter = await prisma.chapter.findFirst({
    where: {
      slug: chapterSlug,
      joinCode: code
    }
  });

  if (!chapter) {
    return { valid: false, message: 'Invalid join code', chapterId: null };
  }

  return { valid: true, chapterId: chapter.id };
}

/**
 * Allows a new user to join a chapter using a join code
 */
export async function joinChapter({
  chapterSlug,
  joinCode,
  userData
}: {
  chapterSlug: string,
  joinCode: string,
  userData: {
    email: string,
    firstName: string,
    lastName: string,
    password?: string
  }
}) {
  try {
    // First validate the join code
    const validation = await validateJoinCode({
      chapterSlug,
      code: joinCode
    });

    if (!validation.valid) {
      return { success: false, message: validation.message || 'Invalid join code' };
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: userData.email }
    });

    return await prisma.$transaction(async (tx) => {
    // Create or get the user
    const user = existingUser || await tx.user.create({
      data: {
        email: userData.email,
        name: `${userData.firstName} ${userData.lastName}`,
        // Additional user data would be handled here (password hashing, etc.)
      }
    });

    // Create the membership with PENDING_MEMBER role
    // Ensure chapterId is defined
    if (!validation.chapterId) {
      return { success: false, message: 'Chapter ID not found' };
    }

    const membership = await tx.membership.create({
      data: {
        userId: user.id,
        chapterId: validation.chapterId,
        role: 'PENDING_MEMBER'
      }
    });

    return { 
      success: true, 
      user, 
      membership
    };
  });
  } catch (error) {
    // Handle Prisma unique constraint error (most likely email already in use)
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return { success: false, message: 'Email already in use. Please login or use a different email.' };
    }
    
    // Handle other errors
    return { 
      success: false, 
      message: 'An error occurred while trying to join the chapter.'
    };
  }
}
