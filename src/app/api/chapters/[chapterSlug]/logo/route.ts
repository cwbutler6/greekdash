import { NextRequest, NextResponse } from 'next/server';
import { requireChapterAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { uploadFile } from '@/lib/supabase/server/uploadFile';
import { supabaseAdmin } from '@/lib/supabase/server';

interface RouteParams {
  params: Promise<{ chapterSlug: string }>;
}

// Upload chapter logo
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { chapterSlug } = await params;
    const { user, chapter } = await requireChapterAdmin(chapterSlug);

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'File must be an image' },
        { status: 400 }
      );
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size must be less than 5MB' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Supabase
    const uploadResult = await uploadFile({
      chapterId: chapter.id,
      uploaderId: user.id,
      fileName: file.name,
      mimeType: file.type,
      fileBuffer: buffer,
      fileSize: file.size,
      folderPath: '/logos',
    });

    // Generate the public URL from Supabase
    const { data } = supabaseAdmin.storage
      .from('chapter-files')
      .getPublicUrl(uploadResult.path);

    if (!data?.publicUrl) {
      throw new Error('Failed to generate public URL for uploaded logo');
    }

    // Add cache-busting timestamp to prevent caching issues
    const timestamp = Date.now();
    const publicUrl = `${data.publicUrl}?t=${timestamp}`;

    // Update chapter with the full public URL
    const updatedChapter = await prisma.chapter.update({
      where: { id: chapter.id },
      data: { logoUrl: publicUrl },
      select: { logoUrl: true },
    });

    return NextResponse.json({
      logoUrl: updatedChapter.logoUrl,
      message: 'Logo uploaded successfully',
    });
  } catch (error) {
    console.error('Logo upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload logo' },
      { status: 500 }
    );
  }
}

// Delete chapter logo
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { chapterSlug } = await params;
    const { chapter } = await requireChapterAdmin(chapterSlug);

    // Update chapter to remove logo URL
    await prisma.chapter.update({
      where: { id: chapter.id },
      data: { logoUrl: null },
    });

    return NextResponse.json({
      message: 'Logo removed successfully',
    });
  } catch (error) {
    console.error('Logo deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to remove logo' },
      { status: 500 }
    );
  }
}