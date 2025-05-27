import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/server';
import { prisma } from '@/lib/db';
const DOWNLOAD_EXPIRY = 120; // 2 minutes in seconds

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ chapterSlug: string; fileId: string }> }
) {
  try {
    const { chapterSlug, fileId } = await params;
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
    
    // Get the file from the database
    const file = await prisma.file.findUnique({
      where: { 
        id: fileId,
        chapterId: chapter.id, // Ensure file belongs to the chapter
      },
    });
    
    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }
    
    // Generate a signed URL for secure download
    const { data, error } = await supabaseAdmin.storage
      .from('chapter-files')
      .createSignedUrl(file.path, DOWNLOAD_EXPIRY);
    
    if (error || !data?.signedUrl) {
      console.error('Error generating signed URL:', error);
      return NextResponse.json(
        { error: 'Failed to generate download link' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ url: data.signedUrl });
  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json(
      { error: 'An error occurred while generating download link' },
      { status: 500 }
    );
  }
}