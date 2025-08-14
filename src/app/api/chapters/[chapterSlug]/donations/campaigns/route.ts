import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { DonationCampaignStatus } from '@/generated/prisma';

const createCampaignSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().optional(),
  goalAmount: z.number().min(1).optional(),
  status: z.nativeEnum(DonationCampaignStatus),
});

// Helper function to check admin access
async function checkAdminAccess(chapterSlug: string, userEmail: string) {
  const user = await prisma.user.findUnique({
    where: { email: userEmail },
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
    return null;
  }

  const chapter = await prisma.chapter.findUnique({
    where: { slug: chapterSlug }
  });

  return { user, chapter };
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ chapterSlug: string }> }
) {
  try {
    const { chapterSlug } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const access = await checkAdminAccess(chapterSlug, session.user.email);
    if (!access) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = createCampaignSchema.parse(body);

    const campaign = await prisma.donationCampaign.create({
      data: {
        title: validatedData.title,
        description: validatedData.description || '',
        goalAmount: validatedData.goalAmount,
        status: validatedData.status,
        chapterId: access.chapter!.id,
        createdById: access.user.id,
      },
    });

    return NextResponse.json(campaign);
  } catch (error) {
    console.error('Error creating donation campaign:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}