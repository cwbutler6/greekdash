import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/mail";

// Schema for resending an invite
const resendInviteSchema = z.object({
  inviteId: z.string().min(1, "Invite ID is required"),
});

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

// POST: Resend an invitation email
export async function POST(request: Request) {
  try {
    // Get current authenticated user
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Parse request body
    const body = await request.json();
    const validatedData = resendInviteSchema.safeParse(body);
    
    if (!validatedData.success) {
      return NextResponse.json(
        { message: "Invalid invite data", errors: validatedData.error.errors },
        { status: 400 }
      );
    }
    
    const { inviteId } = validatedData.data;
    
    // Find the invite
    const invite = await prisma.invite.findUnique({
      where: { id: inviteId },
      include: {
        chapter: true,
        createdBy: {
          select: {
            name: true,
          },
        },
      },
    });
    
    if (!invite) {
      return NextResponse.json(
        { message: "Invite not found" },
        { status: 404 }
      );
    }
    
    // Check if invite is still valid
    if (invite.expiresAt < new Date()) {
      return NextResponse.json(
        { message: "This invite has expired" },
        { status: 400 }
      );
    }
    
    if (invite.accepted) {
      return NextResponse.json(
        { message: "This invite has already been accepted" },
        { status: 400 }
      );
    }
    
    // Check if user is an admin of the chapter
    const isAdmin = await isChapterAdmin(session.user.id, invite.chapterId);
    
    if (!isAdmin) {
      return NextResponse.json(
        { message: "Not authorized to resend invites for this chapter" },
        { status: 403 }
      );
    }
    
    // Get the current user for the invite email
    const inviter = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true },
    });
    
    // Generate the invite link
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const inviteLink = `${baseUrl}/invites/accept?token=${invite.token}`;
    
    // Send the invite email
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
        chapterId: invite.chapterId,
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
      message: "Invitation email resent successfully",
    });
  } catch (error) {
    console.error("Error resending invite:", error);
    return NextResponse.json(
      { message: "Error resending invite" },
      { status: 500 }
    );
  }
}
