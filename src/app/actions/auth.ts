'use server'

import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { hash } from 'bcrypt';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { MembershipRole } from '@/generated/prisma';

// Validation schema for Google user chapter creation
const googleChapterSchema = z.object({
  chapterSlug: z
    .string()
    .min(3, "Chapter URL must be at least 3 characters")
    .max(30, "Chapter URL must be at most 30 characters")
    .regex(/^[a-z0-9-]+$/, "Chapter URL must only contain lowercase letters, numbers, and hyphens")
    .transform(val => val.toLowerCase()),
  fullName: z.string().min(3, "Full name must be at least 3 characters"),
});

// Add proper interface for form validation
interface GoogleChapterFormData {
  chapterSlug: string;
  fullName: string;
}

// Add proper return type for validation function
function validateGoogleChapterData(formData: FormData): GoogleChapterFormData {
  const result = googleChapterSchema.safeParse({
    chapterSlug: formData.get('chapterSlug'),
    fullName: formData.get('fullName'),
  });

  if (!result.success) {
    const errorMessage = result.error.errors[0]?.message || 'Invalid form data';
    throw new Error(errorMessage);
  }

  return result.data;
}

/**
 * Server action to create a chapter for Google users
 * This handles all server-side business logic and validation
 */
// Extract common slug validation logic
function validateSlugFormat(slug: string): { isValid: boolean; message: string } {
  if (!slug || slug.length < 3) {
    return { isValid: false, message: 'Slug must be at least 3 characters' };
  }
  
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return { isValid: false, message: 'Slug can only contain lowercase letters, numbers, and hyphens' };
  }
  
  return { isValid: true, message: 'Valid format' };
}

// Extract common chapter lookup logic
async function findChapterBySlug(slug: string) {
  return await prisma.chapter.findUnique({
    where: { slug }
  });
}

// Refactor checkChapterSlugAvailability to use extracted functions
export async function checkChapterSlugAvailability(slug: string) {
  const validation = validateSlugFormat(slug);
  if (!validation.isValid) {
    return { available: false, message: validation.message };
  }
  
  const existingChapter = await findChapterBySlug(slug);
  
  return {
    available: !existingChapter,
    message: existingChapter ? 'This chapter URL is already taken' : 'Available'
  };
}

// Use in createChapterForGoogleUser
export async function createChapterForGoogleUser(formData: FormData) {
  try {
    console.log('Starting social chapter creation process');
    const session = await getSession();
    
    if (!session?.user?.id) {
      console.error('Social chapter creation failed: Not authenticated');
      throw new Error('Not authenticated');
    }
    
    const validatedData = validateGoogleChapterData(formData);
    
    // Check if slug is available
    const existingChapter = await prisma.chapter.findUnique({
      where: { slug: validatedData.chapterSlug }
    });
    
    if (existingChapter) {
      console.error(`Social chapter creation failed: Slug '${validatedData.chapterSlug}' is already taken`);
      throw new Error('Chapter URL is already taken');
    }
    
    // Generate secure random password on the server
    const securePassword = `G${Math.random().toString(36).slice(2, 10)}${Math.floor(Math.random() * 10)}A`;
    const hashedPassword = await hash(securePassword, 10);
    
    console.log(`Setting password for social user ${session.user.id}`);
    
    // Instead of directly updating, use upsert to handle the race condition
    await prisma.user.upsert({
      where: { id: session.user.id },
      update: { password: hashedPassword },
      create: {
        id: session.user.id,
        email: session.user.email!,
        name: session.user.name!,
        password: hashedPassword,
        emailVerified: new Date()
      }
    });
    
    // Construct chapter name from full name
    let chapterName = validatedData.fullName.split(' ')[0] + "'s Chapter";
    if (chapterName.length < 3) {
      chapterName = "New Greek Chapter";
    }
    
    console.log(`Creating chapter '${chapterName}' with slug '${validatedData.chapterSlug}'`);
    
    // Create the chapter and membership
    const newChapter = await prisma.chapter.create({
      data: {
        slug: validatedData.chapterSlug,
        name: chapterName,
        memberships: {
          create: {
            userId: session.user.id,
            role: 'OWNER' as MembershipRole
          }
        }
      },
      include: {
        memberships: true
      }
    });
    
    console.log(`Successfully created chapter:`, {
      chapterId: newChapter.id,
      chapterSlug: newChapter.slug,
      membershipCount: newChapter.memberships.length
    });
    
    // Instead of redirect, return success data
    return {
      success: true,
      chapterSlug: validatedData.chapterSlug,
      redirectUrl: `/${validatedData.chapterSlug}/admin`
    };
  } catch (error) {
    console.error('Error in createChapterForGoogleUser:', error);
    throw error;
  }
}

export async function joinChapterForSocialUser(formData: FormData) {
  const session = await getSession();
  
  if (!session?.user?.id) {
    throw new Error('You must be logged in to join a chapter');
  }

  const chapterSlug = formData.get('chapterSlug') as string;
  const joinCode = formData.get('joinCode') as string;

  if (!chapterSlug || !joinCode) {
    throw new Error('Chapter URL and join code are required');
  }

  try {
    // Find the chapter and validate join code
    const chapter = await prisma.chapter.findFirst({
      where: {
        slug: chapterSlug,
        joinCode: joinCode
      }
    });

    if (!chapter) {
      throw new Error('Invalid chapter URL or join code');
    }

    // Check if user already has a membership with this chapter
    const existingMembership = await prisma.membership.findFirst({
      where: {
        userId: session.user.id,
        chapterId: chapter.id
      }
    });

    if (existingMembership) {
      throw new Error('You are already a member or have a pending request for this chapter');
    }

    // Create membership as PENDING_MEMBER
    await prisma.membership.create({
      data: {
        userId: session.user.id,
        chapterId: chapter.id,
        role: "PENDING_MEMBER"
      }
    });

    // Redirect to the chapter's pending page
    redirect(`/${chapterSlug}/pending`);
    
  } catch (error) {
    console.error('Error joining chapter for social user:', error);
    throw error;
  }
}
