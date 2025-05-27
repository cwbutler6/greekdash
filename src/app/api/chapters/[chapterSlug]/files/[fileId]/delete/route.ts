import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { MembershipRole } from '@/generated/prisma';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/server';
import { prisma } from '@/lib/db';

export async function DELETE(
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
    
    // Check if user is a member of this chapter and get their role
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
        chapterId: chapter.id, // Ensure file belongs to the chapter (multi-tenant security)
      },
    });
    
    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }
    
    // Check permissions: Only file uploader or admins/owners can delete files
    const isAdmin = membership.role === MembershipRole.ADMIN || membership.role === MembershipRole.OWNER;
    const isUploader = file.uploaderId === session.user.id;
    
    if (!isUploader && !isAdmin) {
      return NextResponse.json(
        { error: 'You do not have permission to delete this file' },
        { status: 403 }
      );
    }
    
    // Delete the file from Supabase Storage
    const { error: deleteStorageError } = await supabaseAdmin.storage
      .from('chapter-files')
      .remove([file.path]);
    
    if (deleteStorageError) {
      console.error('Error deleting file from storage:', deleteStorageError);
      // Continue with DB deletion even if storage deletion fails
    }
    
    // Delete the file record from the database
    await prisma.file.delete({
      where: { id: fileId },
    });
    
    // Create audit log entry
    await prisma.auditLog.create({
      data: {
        action: 'DELETE_FILE',
        targetType: 'FILE',
        targetId: fileId,
        userId: session.user.id,
        chapterId: chapter.id,
        metadata: {
          fileName: file.name,
          fileSize: file.size,
        },
      },
    });
    
    return NextResponse.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json(
      { error: 'An error occurred while deleting the file' },
      { status: 500 }
    );
  }
}
