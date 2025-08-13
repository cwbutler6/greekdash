import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { MembershipRole, PlanType } from '@/generated/prisma';
import { getStorageLimit, getMaxFileSize } from '@/lib/storage-limits';

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
    
    // Get folder path (if any)
    const folderPath = searchParams.get('folder') || '/';
    
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
      displayPath: folderPath,
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
    
    // Get folders at this path level
    // We extract unique folder paths that are direct children of the current path
    const allChildItems = await prisma.file.findMany({
      where: {
        chapterId: chapter.id,
        displayPath: {
          startsWith: folderPath === '/' ? folderPath : `${folderPath}/`,
        },
        // Exclude items in the current folder itself
        NOT: {
          displayPath: folderPath,
        },
      },
      select: {
        displayPath: true,
      },
    });
    
    // Extract immediate subfolders (one level down)
    const folders = new Set();
    
    allChildItems.forEach(item => {
      // Remove the current path prefix to get the relative path
      const relativePath = item.displayPath.replace(
        folderPath === '/' ? '/' : `${folderPath}/`, 
        ''
      );
      
      // Get the first segment of the relative path (immediate subfolder)
      const segments = relativePath.split('/');
      if (segments.length > 0 && segments[0]) {
        folders.add(segments[0]);
      }
    });
    
    // Convert to an array of folder objects
    const folderList = Array.from(folders).map(folder => ({
      name: folder,
      path: folderPath === '/' ? `/${folder}` : `${folderPath}/${folder}`,
      isFolder: true,
    }));
    
    // Return response based on request type
    return NextResponse.json({
      files,
      folders: folderList,
      ...(isAdminRequest ? { uploaders } : {}),
      pagination: {
        page,
        pageSize,
        totalPages: Math.ceil(totalFiles / pageSize),
        totalItems: totalFiles,
      },
      storage: {
        used: totalSize._sum.size || 0,
      },
      currentPath: folderPath,
    });
  } catch (error) {
    console.error('Error fetching files:', error);
    return NextResponse.json(
      { error: 'An error occurred while fetching files' },
      { status: 500 }
    );
  }
}

/**
 * POST handler for uploading files
 * Supports uploading to specific folders
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ chapterSlug: string }> }
) {
  try {
    const { chapterSlug } = await params;
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const formData = await request.formData();
    const file = formData.get('file');
    const folderPathValue = formData.get('folderPath');
    const folderPath = folderPathValue ? folderPathValue.toString() : '/';
    
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    
    // Find chapter by slug
    const chapter = await prisma.chapter.findUnique({
      where: { slug: chapterSlug },
      include: { subscription: true },
    });
    
    if (!chapter) {
      return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
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
        { error: "You do not have access to this chapter" },
        { status: 403 }
      );
    }
    
    // Check file size limits based on subscription plan
    const planType = chapter.subscription?.plan || 'FREE';
    const maxFileSize = getMaxFileSize(planType as PlanType);
    
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Invalid file format" }, { status: 400 });
    }
    
    if (file.size > maxFileSize) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${maxFileSize / (1024 * 1024)}MB for your plan` },
        { status: 400 }
      );
    }
    
    // Check total storage usage for the chapter
    const storageUsed = await prisma.file.aggregate({
      where: { chapterId: chapter.id },
      _sum: { size: true },
    });
    
    const totalStorageUsed = storageUsed._sum.size || 0;
    
    // Use centralized storage limit
    const storageLimit = getStorageLimit(planType as PlanType);
    
    if (totalStorageUsed + file.size > storageLimit) {
      return NextResponse.json(
        { error: "Storage limit exceeded for your subscription tier" },
        { status: 400 }
      );
    }
    
    // Validate folder path format
    if (!folderPath.startsWith('/')) {
      return NextResponse.json(
        { error: "Folder path must start with /" },
        { status: 400 }
      );
    }
    
    // Normalize folder path to ensure it ends with a slash if not root
    const normalizedPath = folderPath === '/' ? '/' : 
      folderPath.endsWith('/') ? folderPath : `${folderPath}/`;
    
    // Generate a unique ID for the file
    const fileId = crypto.randomUUID();
    const fileName = file instanceof File ? file.name : 'unnamed-file';
    const fileExtension = fileName.split('.').pop() || '';
    
    // Store file in filesystem or cloud storage (placeholder)
    // The physical path is different from the display path (logical organization)
    const filePath = `files/${chapterSlug}/${fileId}.${fileExtension}`;
    
    // In a real implementation, you would save the file to storage here
    // For example:
    // const buffer = Buffer.from(await file.arrayBuffer());
    // await fs.writeFile(filePath, buffer);
    
    // Create file record in the database
    const fileRecord = await prisma.file.create({
      data: {
        name: fileName,
        displayPath: normalizedPath,
        path: filePath,
        mimeType: file.type,
        size: file.size,
        chapterId: chapter.id,
        uploaderId: session.user.id,
      },
    });
    
    // Create audit log for file upload
    await prisma.auditLog.create({
      data: {
        action: 'UPLOAD_FILE',
        targetType: 'FILE',
        targetId: fileRecord.id,
        userId: session.user.id,
        chapterId: chapter.id,
        metadata: { 
          fileName: fileName, 
          path: normalizedPath,
          fileSize: file.size 
        },
      },
    });
    
    return NextResponse.json(fileRecord, { status: 201 });
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
  }
}

/**
 * DELETE handler for removing files
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ chapterSlug: string }> }
) {
  try {
    const { chapterSlug } = await params;
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get('id');
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    if (!fileId) {
      return NextResponse.json({ error: "File ID is required" }, { status: 400 });
    }
    
    // Find chapter by slug
    const chapter = await prisma.chapter.findUnique({
      where: { slug: chapterSlug },
    });
    
    if (!chapter) {
      return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
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
        { error: "You do not have access to this chapter" },
        { status: 403 }
      );
    }
    
    // Get file to check ownership
    const file = await prisma.file.findUnique({
      where: { id: fileId },
    });
    
    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }
    
    // Check if file belongs to this chapter
    if (file.chapterId !== chapter.id) {
      return NextResponse.json(
        { error: "File does not belong to this chapter" },
        { status: 403 }
      );
    }
    
    // Check permissions (admin can delete any file, regular members only their own)
    const isAdmin = membership.role === MembershipRole.ADMIN || 
                  membership.role === MembershipRole.OWNER;
                  
    if (!isAdmin && file.uploaderId !== session.user.id) {
      return NextResponse.json(
        { error: "You don't have permission to delete this file" },
        { status: 403 }
      );
    }
    
    // Delete file from storage (placeholder)
    // In a real implementation, you would delete the file from your storage here
    // For example:
    // await fs.unlink(file.path);
    
    // Delete file record from database
    await prisma.file.delete({
      where: { id: fileId },
    });
    
    // Create audit log for file deletion
    await prisma.auditLog.create({
      data: {
        action: 'DELETE_FILE',
        targetType: 'FILE',
        targetId: file.id,
        userId: session.user.id,
        chapterId: chapter.id,
        metadata: { 
          fileName: file.name, 
          path: file.displayPath 
        },
      },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting file:", error);
    return NextResponse.json({ error: "Failed to delete file" }, { status: 500 });
  }
}
