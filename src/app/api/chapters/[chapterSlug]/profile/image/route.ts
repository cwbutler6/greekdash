import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { uploadProfileImage, removeProfileImage } from '@/lib/supabase/server/uploadProfileImage';

export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ chapterSlug: string }> }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Await params to get the chapterSlug in Next.js 15
    const { chapterSlug } = await params;

    // Get the user and their membership in this chapter
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        memberships: {
          where: { chapter: { slug: chapterSlug } },
          include: { chapter: true },
        },
        profiles: {
          where: { chapter: { slug: chapterSlug } },
        },
      },
    });

    if (!user || user.memberships.length === 0) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const membership = user.memberships[0];
    const profile = user.profiles[0];

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Parse the form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Upload the file
    const updatedProfile = await uploadProfileImage({
      profileId: profile.id,
      chapterId: membership.chapterId,
      fileName: file.name,
      mimeType: file.type,
      fileBuffer: buffer,
    });
    
    if (!updatedProfile) {
      return NextResponse.json({ 
        error: 'Failed to update profile image' 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      profileImage: updatedProfile.profileImage 
    });
  } catch (error) {
    console.error('Error uploading profile image:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ chapterSlug: string }> }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Await params to get the chapterSlug in Next.js 15
    const { chapterSlug } = await params;

    // Get the user and their membership in this chapter
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        profiles: {
          where: { chapter: { slug: chapterSlug } },
        },
      },
    });

    if (!user || user.profiles.length === 0) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const profile = user.profiles[0];

    // Remove the profile image
    await removeProfileImage(profile.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing profile image:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
