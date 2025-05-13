import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// Function to check if user is admin of the chapter
async function isChapterAdmin(userId: string, chapterId: string) {
  const membership = await prisma.membership.findUnique({
    where: {
      userId_chapterId: {
        userId,
        chapterId,
      },
    },
  });

  return membership?.role === "ADMIN" || membership?.role === "OWNER";
}

// POST: Deny a pending membership request
export async function POST(
  request: Request,
  { params }: { params: Promise<{ chapterSlug: string; membershipId: string }> }
) {
  try {
    const { chapterSlug, membershipId } = await params;
    
    // Get current authenticated user
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Find chapter by slug
    const chapter = await prisma.chapter.findUnique({
      where: { slug: chapterSlug },
    });
    
    if (!chapter) {
      return NextResponse.json(
        { message: "Chapter not found" },
        { status: 404 }
      );
    }
    
    // Check if user is an admin of this chapter
    const isAdmin = await isChapterAdmin(session.user.id, chapter.id);
    
    if (!isAdmin) {
      return NextResponse.json(
        { message: "You do not have permission to deny members" },
        { status: 403 }
      );
    }
    
    // Find the membership
    const membership = await prisma.membership.findUnique({
      where: { 
        id: membershipId,
      },
      include: {
        user: true,
      },
    });
    
    if (!membership) {
      return NextResponse.json(
        { message: "Membership not found" },
        { status: 404 }
      );
    }
    
    // Ensure the membership belongs to the specified chapter
    if (membership.chapterId !== chapter.id) {
      return NextResponse.json(
        { message: "Membership not found in this chapter" },
        { status: 404 }
      );
    }
    
    // Check if the membership is actually pending
    if (membership.role !== "PENDING_MEMBER") {
      return NextResponse.json(
        { message: "This membership is not pending approval" },
        { status: 400 }
      );
    }
    
    // Store user info for response before deleting
    const userInfo = {
      id: membership.user.id,
      name: membership.user.name,
      email: membership.user.email,
    };
    
    // Delete the membership record
    await prisma.membership.delete({
      where: { id: membershipId },
    });
    
    // In a real implementation, you might send an email notification to the user
    
    return NextResponse.json({
      message: "Membership request denied successfully",
      user: userInfo,
    });
    
  } catch (error) {
    console.error("Error denying membership:", error);
    return NextResponse.json(
      { message: "An error occurred while denying the membership" },
      { status: 500 }
    );
  }
}
