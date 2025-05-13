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

// DELETE: Delete an invite
export async function DELETE(
  request: Request,
  { params }: { params: { chapterSlug: string; inviteId: string } }
) {
  try {
    const { chapterSlug, inviteId } = params;
    
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
        { message: "You do not have permission to delete invites" },
        { status: 403 }
      );
    }
    
    // Find the invite
    const invite = await prisma.invite.findUnique({
      where: { 
        id: inviteId,
      },
    });
    
    if (!invite) {
      return NextResponse.json(
        { message: "Invite not found" },
        { status: 404 }
      );
    }
    
    // Ensure the invite belongs to the specified chapter
    if (invite.chapterId !== chapter.id) {
      return NextResponse.json(
        { message: "Invite not found in this chapter" },
        { status: 404 }
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
      { message: "An error occurred while deleting the invite" },
      { status: 500 }
    );
  }
}
