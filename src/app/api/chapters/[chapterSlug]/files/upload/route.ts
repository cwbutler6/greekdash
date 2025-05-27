import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { uploadFile } from '@/lib/supabase/server/uploadFile';
import { prisma } from '@/lib/db';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

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
    
    // Find chapter by slug to get ID
    const chapter = await prisma.chapter.findUnique({
      where: { slug: chapterSlug },
    });
    
    if (!chapter) {
      return NextResponse.json({ error: 'Chapter not found' }, { status: 404 });
    }
    
    // Check if user is a member of this chapter
    const membership = await prisma.membership.findFirst({
      where: {
        userId: session.user.id,
        chapterId: chapter.id,
      },
    });
    
    if (!membership) {
      return NextResponse.json(
        { error: 'You do not have access to this chapter' },
        { status: 403 }
      );
    }
    
    // Parse the multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    
    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds the 10MB limit' },
        { status: 400 }
      );
    }
    
    // Convert the file to a buffer
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    
    // Upload the file using our helper
    const uploadedFile = await uploadFile({
      chapterId: chapter.id,
      uploaderId: session.user.id,
      fileName: file.name,
      mimeType: file.type,
      fileBuffer,
      fileSize: file.size,
    });
    
    return NextResponse.json({
      message: 'File uploaded successfully',
      file: uploadedFile,
    });
  } catch (error) {
    console.error('Upload error:', error);
    
    // Handle specific error for storage limit exceeded
    if (error instanceof Error && error.message.includes('Storage limit exceeded')) {
      return NextResponse.json(
        { error: error.message },
        { status: 402 } // 402 Payment Required is appropriate for quota limits
      );
    }
    
    return NextResponse.json(
      { error: 'An error occurred while uploading the file' },
      { status: 500 }
    );
  }
}
