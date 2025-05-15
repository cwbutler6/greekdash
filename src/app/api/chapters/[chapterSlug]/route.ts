import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireChapterAccess } from "@/lib/auth";
import { MembershipRole } from "@/generated/prisma";

// Get chapter information by slug
export async function GET(
  request: Request,
  { params }: { params: Promise<{ chapterSlug: string }> }
) {
  try {
    // In Next.js 15, params is a Promise that needs to be awaited
    const { chapterSlug } = await params;
    
    // Check if the request URL includes auth token (for admin access)
    const url = new URL(request.url);
    const requireAuth = url.searchParams.get('auth') === 'true';
    
    // For admin routes, verify authentication and admin access
    if (requireAuth) {
      // Get the authenticated user and membership with access check
      const { membership } = await requireChapterAccess(chapterSlug);

      // Check if the user has admin privileges
      if (
        membership.role !== MembershipRole.ADMIN &&
        membership.role !== MembershipRole.OWNER
      ) {
        return NextResponse.json(
          { error: "You must be an admin to access this resource" },
          { status: 403 }
        );
      }
      
      // Admin can see all chapter details including sensitive fields
      const chapter = await prisma.chapter.findUnique({
        where: { slug: chapterSlug },
        include: {}, // Get all fields
      });
      
      if (!chapter) {
        return NextResponse.json(
          { message: "Chapter not found" },
          { status: 404 }
        );
      }
      
      return NextResponse.json({ chapter });
    }
    
    // For public access, only return non-sensitive information
    const chapter = await prisma.chapter.findUnique({
      where: { slug: chapterSlug },
      select: {
        id: true,
        name: true,
        slug: true,
        createdAt: true,
        // Don't expose joinCode in public API response
      },
    });
    
    if (!chapter) {
      return NextResponse.json(
        { message: "Chapter not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ chapter });
  } catch (error) {
    console.error("Error fetching chapter:", error);
    return NextResponse.json(
      { message: "An error occurred while fetching chapter information" },
      { status: 500 }
    );
  }
}
