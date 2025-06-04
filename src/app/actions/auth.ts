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

type GoogleChapterFormData = z.infer<typeof googleChapterSchema>;

/**
 * Validates the input data for Google chapter creation
 */
function validateGoogleChapterData(formData: FormData): GoogleChapterFormData {
  const result = googleChapterSchema.safeParse({
    chapterSlug: formData.get('chapterSlug'),
    fullName: formData.get('fullName'),
  });

  if (!result.success) {
    // Get the first error message
    const errorMessage = result.error.errors[0]?.message || 'Invalid form data';
    throw new Error(errorMessage);
  }

  return result.data;
}

/**
 * Server action to create a chapter for Google users
 * This handles all server-side business logic and validation
 */
export async function createChapterForGoogleUser(formData: FormData) {
  try {
    console.log('Starting social chapter creation process');
    const session = await getSession();
    
    // Check session data
    console.log('Session data for chapter creation:', { 
      hasSession: !!session,
      userId: session?.user?.id,
      userName: session?.user?.name,
      userEmail: session?.user?.email
    });
    
    if (!session?.user?.id) {
      console.error('Social chapter creation failed: Not authenticated');
      throw new Error('Not authenticated');
    }
    
    // Validate form data server-side
    const formValues = {
      chapterSlug: formData.get('chapterSlug'),
      fullName: formData.get('fullName'),
      email: formData.get('email')
    };
    
    console.log('Form data received:', formValues);
    
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
    // We need this because social logins don't have passwords initially
    const securePassword = `G${Math.random().toString(36).slice(2, 10)}${Math.floor(Math.random() * 10)}A`;
    const hashedPassword = await hash(securePassword, 10);
    
    console.log(`Setting password for social user ${session.user.id}`);
    
    // Update the user with the hashed password
    await prisma.user.update({
      where: { id: session.user.id },
      data: { password: hashedPassword }
    });
    
    // Construct chapter name from full name
    let chapterName = validatedData.fullName.split(' ')[0] + "'s Chapter";
    if (chapterName.length < 3) {
      // Fallback if we can't get a good chapter name
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
    
    // Redirect to the admin dashboard for the new chapter
    redirect(`/${validatedData.chapterSlug}/admin`);
  } catch (error) {
    console.error('Error in createChapterForGoogleUser:', error);
    throw error; // Re-throw to show error in UI
  }
}

/**
 * Server action to validate if a chapter slug is available
 * This allows for server-side validation of slug availability
 */
export async function checkChapterSlugAvailability(slug: string) {
  if (!slug || slug.length < 3) {
    return { available: false, message: 'Slug must be at least 3 characters' };
  }
  
  // Basic validation
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return { available: false, message: 'Slug can only contain lowercase letters, numbers, and hyphens' };
  }
  
  // Check if slug is available in the database
  const existingChapter = await prisma.chapter.findUnique({
    where: { slug }
  });
  
  return {
    available: !existingChapter,
    message: existingChapter ? 'This chapter URL is already taken' : 'Available'
  };
}
