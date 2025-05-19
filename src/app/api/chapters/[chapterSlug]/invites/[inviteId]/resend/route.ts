import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { addDays } from "date-fns";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/mail";

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
  { params }: { params: Promise<{ chapterSlug: string; inviteId: string }> }
) {
  try {
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
        { message: "Not authorized to resend invites for this chapter" },
        { status: 403 }
      );
    }
    
    // Find the invite by ID
    const invite = await prisma.invite.findUnique({
      where: { id: inviteId },
      include: {
        chapter: true,
      },
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
    
    // Check if the invite has already been accepted
    if (invite.accepted) {
      return NextResponse.json(
        { message: "This invite has already been accepted" },
        { status: 400 }
      );
    }
    
    // Get the current user's name for the invite email
    const inviter = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true },
    });

    // Update invite with new expiration date
    const updatedInvite = await prisma.invite.update({
      where: { id: inviteId },
      data: {
        expiresAt: addDays(new Date(), 7), // Reset expiration to 7 days from now
      },
    });
    
    // Generate the invite link to the chapter join page
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const inviteLink = `${baseUrl}/${invite.chapter.slug}/join?token=${invite.token}`;
    
    // Send the invite email
    try {
      await sendEmail(invite.email, "chapterInvite", {
        inviteLink,
        chapterName: invite.chapter.name,
        inviterName: inviter?.name || "A chapter administrator",
        roleName: invite.role === "ADMIN" ? "Administrator" : "Member",
      });
      
      // Create an audit log entry
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          chapterId: chapter.id,
          action: "INVITE_RESENT",
          targetType: "INVITE",
          targetId: invite.id,
          metadata: {
            email: invite.email,
            role: invite.role,
            timestamp: new Date().toISOString(),
          },
        },
      });
      
      return NextResponse.json({
        message: "Invite resent successfully",
        invite: {
          id: updatedInvite.id,
          email: updatedInvite.email,
          expiresAt: updatedInvite.expiresAt,
        },
      });
    } catch (emailError) {
      console.error("Error sending invitation email:", emailError);
      return NextResponse.json(
        { message: "Invite updated but failed to send email" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error resending invite:", error);
    return NextResponse.json(
      { message: "Error resending invite" },
      { status: 500 }
    );
  }
}
