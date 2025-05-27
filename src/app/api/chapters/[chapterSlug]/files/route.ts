import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { MembershipRole } from '@/generated/prisma';

const DEFAULT_PAGE_SIZE = 20;

/**
 * GET handler for listing files
 * Supports both regular member view and admin view (with ?admin=true)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ chapterSlug: string }> }
) {
  try {
    const { chapterSlug } = await params;
    const session = await getServerSession(authOptions);
    const searchParams = new URL(request.url).searchParams;
    
    // Get request type (admin vs regular)
    const isAdminRequest = searchParams.get('admin') === 'true';
    
    // Parse pagination and filtering parameters
    const page = Number(searchParams.get('page') || '1');
    const pageSize = Number(searchParams.get('pageSize') || DEFAULT_PAGE_SIZE);
    const uploader = searchParams.get('uploader');
    const sort = searchParams.get('sort') || 'newest';
    
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
    
    // If this is an admin request, verify the user has admin permissions
    if (isAdminRequest) {
      const isAdmin = membership.role === MembershipRole.ADMIN || 
                      membership.role === MembershipRole.OWNER;
      
      if (!isAdmin) {
        return NextResponse.json(
          { error: 'Admin access required' },
          { status: 403 }
        );
      }
    }
    
    // Build the query where clause
    const where = {
      chapterId: chapter.id,
      ...(uploader ? { uploaderId: uploader } : {}),
    };
    
    // Determine sort order
    let orderBy = {};
    switch (sort) {
      case 'oldest':
        orderBy = { createdAt: 'asc' };
        break;
      case 'name':
        orderBy = { name: 'asc' };
        break;
      case 'size':
        orderBy = { size: 'desc' };
        break;
      case 'newest':
      default:
        orderBy = { createdAt: 'desc' };
        break;
    }
    
    // Get total count for pagination
    const totalFiles = await prisma.file.count({
      where,
    });
    
    // Get total storage size
    const totalSize = await prisma.file.aggregate({
      where,
      _sum: { size: true },
    });
    
    // Get the files with pagination
    const files = await prisma.file.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        uploader: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
    
    // If this is an admin request, also include uploader data for filtering
    type Uploader = { id: string; name: string | null };
    let uploaders: Uploader[] = [];
    if (isAdminRequest) {
      uploaders = await prisma.user.findMany({
        where: {
          memberships: {
            some: {
              chapterId: chapter.id,
            }
          },
          uploadedFiles: {
            some: {
              chapterId: chapter.id,
            }
          }
        },
        select: {
          id: true,
          name: true,
        },
        orderBy: { name: 'asc' },
      });
    }
    
    // Return response based on request type
    return NextResponse.json({
      files,
      ...(isAdminRequest ? { uploaders } : {}),
      pagination: {
        total: totalFiles,
        totalSize: totalSize._sum.size,
        currentPage: page,
        totalPages: Math.ceil(totalFiles / pageSize),
        limit: pageSize,
      },
    });
  } catch (error) {
    console.error('Error fetching files:', error);
    return NextResponse.json(
      { error: 'An error occurred while fetching files' },
      { status: 500 }
    );
  }
}
