import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { MembershipRole } from '@/generated/prisma';
import { uploadFile } from '@/lib/supabase/server/uploadFile';

/**
 * POST handler for uploading gallery images
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ chapterSlug: string }> }
) {
  try {
    const { chapterSlug } = await params;
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Find chapter by slug
    const chapter = await prisma.chapter.findUnique({
      where: { slug: chapterSlug },
    });
    
    if (!chapter) {
      return NextResponse.json({ error: 'Chapter not found' }, { status: 404 });
    }
    
    // Check admin permissions
    const membership = await prisma.membership.findFirst({
      where: {
        userId: session.user.id,
        chapterId: chapter.id,
      },
    });
    
    if (!membership || (membership.role !== MembershipRole.ADMIN && membership.role !== MembershipRole.OWNER)) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const caption = formData.get('caption') as string;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }
    
    // Validate file type (images only)
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Only image files are allowed' },
        { status: 400 }
      );
    }
    
    // Upload file using existing upload utility
    const uploadResult = await uploadFile({
      fileBuffer: Buffer.from(await file.arrayBuffer()),
      fileName: file.name,
      mimeType: file.type,
      fileSize: file.size,
      chapterId: chapter.id,
      uploaderId: session.user.id,
      folderPath: '/gallery/',
    });
    
    if (!uploadResult.id) {
      return NextResponse.json(
        { error: uploadResult || 'Upload failed' },
        { status: 500 }
      );
    }
    
    // Create gallery image record
    const galleryImage = await prisma.galleryImage.create({
      data: {
        url: uploadResult.displayPath,
        caption: caption || null,
        chapterId: chapter.id,
      },
    });
    
    return NextResponse.json(galleryImage, { status: 201 });
  } catch (error) {
    console.error('Error uploading gallery image:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}