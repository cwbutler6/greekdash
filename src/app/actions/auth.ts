'use server'

import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { hash } from 'bcrypt';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { MembershipRole } from '@/generated/prisma';

// Shared validation schemas
const chapterSlugSchema = z
  .string()
  .min(3, "Chapter URL must be at least 3 characters")
  .max(30, "Chapter URL must be at most 30 characters")
  .regex(/^[a-z0-9-]+$/, "Chapter URL must only contain lowercase letters, numbers, and hyphens")
  .transform(val => val.toLowerCase());

// Validation schema for Google user chapter creation (fullName now optional)
const googleChapterSchema = z.object({
  chapterSlug: chapterSlugSchema,
  fullName: z.string().min(3, "Full name must be at least 3 characters").optional(),
});

// Validation schema for joining chapter
const joinChapterSchema = z.object({
  chapterSlug: chapterSlugSchema,
  joinCode: z.string().min(1, "Join code is required"),
});

// Interfaces
interface GoogleChapterFormData {
  chapterSlug: string;
  fullName?: string;
}

interface JoinChapterFormData {
  chapterSlug: string;
  joinCode: string;
}

interface ChapterAvailabilityResult {
  available: boolean;
  message: string;
}

interface CreateChapterResult {
  success: boolean;
  chapterSlug: string;
  redirectUrl: string;
}

// Type-safe form data extraction
function extractFormDataSafely<T extends Record<string, unknown>>(
  formData: FormData, 
  schema: z.ZodSchema<T>
): T {
  const rawData: Record<string, FormDataEntryValue> = {};
  
  // Extract form data entries with proper typing
  for (const [key, value] of formData.entries()) {
    rawData[key] = value;
  }
  
  const result = schema.safeParse(rawData);
  
  if (!result.success) {
    const errorMessage = result.error.errors[0]?.message || 'Invalid form data';
    throw new Error(errorMessage);
  }
  
  return result.data;
}

function validateGoogleChapterData(formData: FormData): GoogleChapterFormData {
  return extractFormDataSafely(formData, googleChapterSchema);
}

function validateJoinChapterData(formData: FormData): JoinChapterFormData {
  return extractFormDataSafely(formData, joinChapterSchema);
}

function validateSlugFormat(slug: string): { isValid: boolean; message: string } {
  const result = chapterSlugSchema.safeParse(slug);
  return {
    isValid: result.success,
    message: result.success ? 'Valid format' : (result.error.errors[0]?.message || 'Invalid format')
  };
}

async function findChapterBySlug(slug: string) {
  return await prisma.chapter.findUnique({
    where: { slug }
  });
}

async function findChapterBySlugAndJoinCode(slug: string, joinCode: string) {
  return await prisma.chapter.findFirst({
    where: {
      slug,
      joinCode
    }
  });
}

async function checkExistingMembership(userId: string, chapterId: string) {
  return await prisma.membership.findFirst({
    where: {
      userId,
      chapterId
    }
  });
}

function generateSecurePassword(): string {
  return `G${Math.random().toString(36).slice(2, 10)}${Math.floor(Math.random() * 10)}A`;
}

function generateChapterName(fullName?: string): string {
  if (!fullName) {
    return "New Chapter";
  }
  return fullName.split(' ')[0] + "'s Chapter";
}

// Exported functions
export async function checkChapterSlugAvailability(slug: string): Promise<ChapterAvailabilityResult> {
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

export async function createChapterForGoogleUser(formData: FormData): Promise<CreateChapterResult> {
  try {
    console.log('Starting social chapter creation process');
    const session = await getSession();
    
    if (!session?.user?.id) {
      console.error('Social chapter creation failed: Not authenticated');
      throw new Error('Not authenticated');
    }
    
    const validatedData = validateGoogleChapterData(formData);
    
    // Check if slug is available
    const existingChapter = await findChapterBySlug(validatedData.chapterSlug);
    
    if (existingChapter) {
      console.error(`Social chapter creation failed: Slug '${validatedData.chapterSlug}' is already taken`);
      throw new Error('Chapter URL is already taken');
    }
    
    // Generate secure random password on the server
    const securePassword = generateSecurePassword();
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
    
    // Construct chapter name from full name or use default
    const chapterName = generateChapterName(validatedData.fullName);
    
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

export async function joinChapterForSocialUser(formData: FormData): Promise<void> {
  const session = await getSession();
  
  if (!session?.user?.id) {
    throw new Error('You must be logged in to join a chapter');
  }

  const validatedData = validateJoinChapterData(formData);

  try {
    // Find the chapter and validate join code
    const chapter = await findChapterBySlugAndJoinCode(
      validatedData.chapterSlug, 
      validatedData.joinCode
    );

    if (!chapter) {
      throw new Error('Invalid chapter URL or join code');
    }

    // Check if user already has a membership with this chapter
    const existingMembership = await checkExistingMembership(session.user.id, chapter.id);

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
    redirect(`/${validatedData.chapterSlug}/pending`);
    
  } catch (error) {
    console.error('Error joining chapter for social user:', error);
    throw error;
  }
}
