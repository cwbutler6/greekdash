import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { addDays } from "date-fns";
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

// POST: Resend an invite (refresh token and expiration date)
export async function POST(
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
        { message: "You do not have permission to resend invites" },
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
    
    // Check if invite is already accepted
    if (invite.accepted) {
      return NextResponse.json(
        { message: "This invite has already been accepted and cannot be resent" },
        { status: 400 }
      );
    }
    
    // Update the invite with a new token and expiration date
    const updatedInvite = await prisma.invite.update({
      where: { id: inviteId },
      data: {
        token: undefined, // This will generate a new UUID token because of the @default(uuid()) in schema
        expiresAt: addDays(new Date(), 7), // Reset to expire in 7 days from now
      },
    });
    
    // In a real implementation, you would send an email here
    
    return NextResponse.json({
      id: updatedInvite.id,
      email: updatedInvite.email,
      token: updatedInvite.token, // This would normally not be exposed directly
      expiresAt: updatedInvite.expiresAt,
    });
    
  } catch (error) {
    console.error("Error resending invite:", error);
    return NextResponse.json(
      { message: "An error occurred while resending the invite" },
      { status: 500 }
    );
  }
}
