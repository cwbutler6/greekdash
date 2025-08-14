import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { DonationCampaignStatus } from '@/generated/prisma';

const updateCampaignSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  goalAmount: z.number().min(1),
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

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ chapterSlug: string; campaignId: string }> }
) {
  try {
    const { chapterSlug, campaignId } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const access = await checkAdminAccess(chapterSlug, session.user.email);
    if (!access) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = updateCampaignSchema.parse(body);

    const campaign = await prisma.donationCampaign.update({
      where: {
        id: campaignId,
        chapterId: access.chapter!.id,
      },
      data: validatedData,
    });

    return NextResponse.json(campaign);
  } catch (error) {
    console.error('Error updating donation campaign:', error);
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

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ chapterSlug: string; campaignId: string }> }
) {
  try {
    const { chapterSlug, campaignId } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const access = await checkAdminAccess(chapterSlug, session.user.email);
    if (!access) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if campaign has donations
    const donationCount = await prisma.donation.count({
      where: {
        campaignId: campaignId,
        status: 'COMPLETED',
      },
    });

    if (donationCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete campaign with completed donations' },
        { status: 400 }
      );
    }

    await prisma.donationCampaign.delete({
      where: {
        id: campaignId,
        chapterId: access.chapter!.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting donation campaign:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}