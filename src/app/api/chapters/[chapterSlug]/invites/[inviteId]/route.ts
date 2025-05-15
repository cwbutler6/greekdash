import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

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

// DELETE: Delete an invite
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ chapterSlug: string; inviteId: string }> }
) {
  try {
    // Extract params in Next.js 15
    const { chapterSlug, inviteId } = await params;
    
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
    
    // Check if user is an admin of the chapter
    const isAdmin = await isChapterAdmin(session.user.id, chapter.id);
    
    if (!isAdmin) {
      return NextResponse.json(
        { message: "Not authorized to delete invites for this chapter" },
        { status: 403 }
      );
    }
    
    // Find the invite by ID
    const invite = await prisma.invite.findUnique({
      where: { id: inviteId },
    });
    
    if (!invite) {
      return NextResponse.json(
        { message: "Invite not found" },
        { status: 404 }
      );
    }
    
    // Check if invite belongs to the chapter
    if (invite.chapterId !== chapter.id) {
      return NextResponse.json(
        { message: "Invite does not belong to this chapter" },
        { status: 403 }
      );
    }
    
    // Delete the invite
    await prisma.invite.delete({
      where: { id: inviteId },
    });
    
    return NextResponse.json({
      message: "Invite deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting invite:", error);
    return NextResponse.json(
      { message: "Error deleting invite" },
      { status: 500 }
    );
  }
}
