import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { z } from 'zod';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

// Validation schema for creating a dues plan
const duesPlanSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  amount: z.number().positive('Amount must be positive'),
  frequency: z.enum(['ONE_TIME', 'MONTHLY', 'QUARTERLY', 'SEMESTER', 'ANNUAL']),
  isActive: z.boolean().default(true),
  applyToNewMembers: z.boolean().default(true),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ chapterSlug: string }> }
) {
  try {
    const { chapterSlug } = await params;
    
    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user and check admin status
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        memberships: {
          where: { 
            chapter: { slug: chapterSlug },
            role: { in: ['ADMIN', 'OWNER'] }
          }
        }
      }
    });

    if (!user || user.memberships.length === 0) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Get chapter
    const chapter = await prisma.chapter.findUnique({
      where: { slug: chapterSlug }
    });

    if (!chapter) {
      return NextResponse.json({ error: 'Chapter not found' }, { status: 404 });
    }

    // Get all dues plans for this chapter
    const duesPlans = await prisma.duesPlan.findMany({
      where: {
        chapterId: chapter.id
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(duesPlans);
  } catch (error) {
    console.error('Error fetching dues plans:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dues plans' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ chapterSlug: string }> }
) {
  try {
    const { chapterSlug } = await params;
    
    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user and check admin status
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        memberships: {
          where: { 
            chapter: { slug: chapterSlug },
            role: { in: ['ADMIN', 'OWNER'] }
          }
        }
      }
    });

    if (!user || user.memberships.length === 0) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Get chapter
    const chapter = await prisma.chapter.findUnique({
      where: { slug: chapterSlug }
    });

    if (!chapter) {
      return NextResponse.json({ error: 'Chapter not found' }, { status: 404 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = duesPlanSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const { name, description, amount, frequency, isActive, applyToNewMembers } = validationResult.data;

    // Create dues plan
    const duesPlan = await prisma.duesPlan.create({
      data: {
        name,
        description: description || null,
        amount,
        frequency,
        isActive,
        applyToNewMembers,
        chapterId: chapter.id
      }
    });

    return NextResponse.json(duesPlan, { status: 201 });
  } catch (error) {
    console.error('Error creating dues plan:', error);
    return NextResponse.json(
      { error: 'Failed to create dues plan' },
      { status: 500 }
    );
  }
}
