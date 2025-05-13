import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { MembershipRole } from "@/generated/prisma";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

// Helper function to check if user is an admin of the chapter
async function isChapterAdmin(userId: string, chapterId: string) {
  const membership = await prisma.membership.findUnique({
    where: {
      userId_chapterId: {
        userId,
        chapterId,
      },
    },
  });

  return (
    membership &&
    (membership.role === MembershipRole.ADMIN || 
     membership.role === MembershipRole.OWNER)
  );
}

/**
 * GET: List all pending membership requests for a chapter
 * This is used by chapter admins to see who has requested to join
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ chapterSlug: string }> }
) {
  try {
    // Next.js 15: need to await params
    const { chapterSlug } = await params;
    
    // Get current user session
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Find the chapter
    const chapter = await prisma.chapter.findUnique({
      where: { slug: chapterSlug },
    });
    
    if (!chapter) {
      return NextResponse.json(
        { message: "Chapter not found" },
        { status: 404 }
      );
    }
    
    // Check if user is admin
    const isAdmin = await isChapterAdmin(session.user.id, chapter.id);
    
    if (!isAdmin) {
      return NextResponse.json(
        { message: "You don't have permission to view pending memberships" },
        { status: 403 }
      );
    }
    
    // Find all pending members
    const pendingMembers = await prisma.membership.findMany({
      where: {
        chapterId: chapter.id,
        role: MembershipRole.PENDING_MEMBER,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    
    return NextResponse.json({ pendingMembers });
  } catch (error) {
    console.error("Error fetching pending membership requests:", error);
    return NextResponse.json(
      { message: "Failed to fetch pending membership requests" },
      { status: 500 }
    );
  }
}

/**
 * PATCH: Approve or reject a pending membership request
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ chapterSlug: string }> }
) {
  try {
    // Next.js 15: need to await params
    const { chapterSlug } = await params;
    
    // Get current user session
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Find the chapter
    const chapter = await prisma.chapter.findUnique({
      where: { slug: chapterSlug },
    });
    
    if (!chapter) {
      return NextResponse.json(
        { message: "Chapter not found" },
        { status: 404 }
      );
    }
    
    // Check if user is admin
    const isAdmin = await isChapterAdmin(session.user.id, chapter.id);
    
    if (!isAdmin) {
      return NextResponse.json(
        { message: "You don't have permission to manage memberships" },
        { status: 403 }
      );
    }
    
    // Parse request body
    const { memberId, action } = await request.json();
    
    if (!memberId) {
      return NextResponse.json(
        { message: "Membership ID is required" },
        { status: 400 }
      );
    }
    
    if (action !== "approve" && action !== "reject") {
      return NextResponse.json(
        { message: "Invalid action. Must be 'approve' or 'reject'" },
        { status: 400 }
      );
    }
    
    // Find the membership
    const membership = await prisma.membership.findFirst({
      where: {
        id: memberId,
        chapterId: chapter.id,
        role: MembershipRole.PENDING_MEMBER,
      },
    });
    
    if (!membership) {
      return NextResponse.json(
        { message: "Pending membership request not found" },
        { status: 404 }
      );
    }
    
    if (action === "approve") {
      // Update membership role to MEMBER
      const updatedMembership = await prisma.membership.update({
        where: { id: memberId },
        data: { role: MembershipRole.MEMBER },
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      });
      
      return NextResponse.json({
        message: "Membership request approved",
        membership: updatedMembership,
      });
    } else {
      // Delete the membership request
      await prisma.membership.delete({
        where: { id: memberId },
      });
      
      return NextResponse.json({
        message: "Membership request rejected",
      });
    }
  } catch (error) {
    console.error("Error processing membership request:", error);
    return NextResponse.json(
      { message: "Failed to process membership request" },
      { status: 500 }
    );
  }
}
