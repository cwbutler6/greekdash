import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { hash } from 'bcrypt';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { MembershipRole } from '@/generated/prisma';

// Validation schema for Google user chapter creation
const googleSignupSchema = z.object({
  chapterSlug: z
    .string()
    .min(3, "Chapter URL must be at least 3 characters")
    .max(30, "Chapter URL must be at most 30 characters")
    .regex(/^[a-z0-9-]+$/, "Chapter URL must only contain lowercase letters, numbers, and hyphens")
    .transform(val => val.toLowerCase()),
  fullName: z.string().min(3, "Full name must be at least 3 characters"),
});

export async function POST(request: Request) {
  try {
    const session = await getSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    // Parse and validate request body
    const body = await request.json();
    const validationResult = googleSignupSchema.safeParse(body);
    
    if (!validationResult.success) {
      // Get the first error message
      const errorMessage = validationResult.error.errors[0]?.message || 'Invalid request data';
      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }
    
    const { chapterSlug, fullName } = validationResult.data;
    
    // Check slug availability
    const existingChapter = await prisma.chapter.findUnique({
      where: { slug: chapterSlug }
    });
    
    if (existingChapter) {
      return NextResponse.json({ error: 'Chapter URL is already taken' }, { status: 400 });
    }
    
    // Generate secure password server-side
    const securePassword = `G${Math.random().toString(36).slice(2, 10)}${Math.floor(Math.random() * 10)}A`;
    const hashedPassword = await hash(securePassword, 10);
    
    // Update user with password
    await prisma.user.update({
      where: { id: session.user.id },
      data: { password: hashedPassword }
    });
    
    // Create chapter and membership
    const chapter = await prisma.chapter.create({
      data: {
        slug: chapterSlug,
        name: fullName.split(' ')[0] + "'s Chapter",
        memberships: {
          create: {
            userId: session.user.id,
            role: 'OWNER' as MembershipRole
          }
        }
      }
    });
    
    return NextResponse.json({ 
      success: true, 
      redirectTo: `/${chapterSlug}/admin`,
      chapter: {
        id: chapter.id,
        slug: chapter.slug,
        name: chapter.name
      }
    });
  } catch (error) {
    console.error('Google signup error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'An unexpected error occurred' 
    }, { status: 500 });
  }
}

/**
 * GET handler to check if a slug is available
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');
    
    if (!slug) {
      return NextResponse.json({ error: 'Slug parameter is required' }, { status: 400 });
    }
    
    // Basic validation
    if (slug.length < 3) {
      return NextResponse.json({ 
        available: false, 
        message: 'Slug must be at least 3 characters' 
      });
    }
    
    if (!/^[a-z0-9-]+$/.test(slug)) {
      return NextResponse.json({ 
        available: false, 
        message: 'Slug can only contain lowercase letters, numbers, and hyphens' 
      });
    }
    
    // Check if slug is available in the database
    const existingChapter = await prisma.chapter.findUnique({
      where: { slug }
    });
    
    return NextResponse.json({
      available: !existingChapter,
      message: existingChapter ? 'This chapter URL is already taken' : 'Available'
    });
  } catch (error) {
    console.error('Slug check error:', error);
    return NextResponse.json({ error: 'An error occurred checking slug availability' }, { status: 500 });
  }
}
