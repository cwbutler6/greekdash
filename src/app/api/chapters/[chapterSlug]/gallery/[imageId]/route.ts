import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { MembershipRole } from '@/generated/prisma';

/**
 * PUT handler for updating gallery images
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ chapterSlug: string; imageId: string }> }
) {
  try {
    const { chapterSlug, imageId } = await params;
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
    
    // Check if image exists and belongs to this chapter
    const existingImage = await prisma.galleryImage.findFirst({
      where: {
        id: imageId,
        chapterId: chapter.id,
      },
    });
    
    if (!existingImage) {
      return NextResponse.json(
        { error: 'Gallery image not found' },
        { status: 404 }
      );
    }
    
    const body = await request.json();
    const { caption } = body;
    
    // Update gallery image
    const updatedImage = await prisma.galleryImage.update({
      where: { id: imageId },
      data: {
        caption: caption || null,
      },
    });
    
    return NextResponse.json(updatedImage);
  } catch (error) {
    console.error('Error updating gallery image:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE handler for removing gallery images
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ chapterSlug: string; imageId: string }> }
) {
  try {
    const { chapterSlug, imageId } = await params;
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
    
    // Check if image exists and belongs to this chapter
    const existingImage = await prisma.galleryImage.findFirst({
      where: {
        id: imageId,
        chapterId: chapter.id,
      },
    });
    
    if (!existingImage) {
      return NextResponse.json(
        { error: 'Gallery image not found' },
        { status: 404 }
      );
    }
    
    // Delete gallery image
    await prisma.galleryImage.delete({
      where: { id: imageId },
    });
    
    return NextResponse.json({ message: 'Gallery image deleted successfully' });
  } catch (error) {
    console.error('Error deleting gallery image:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}