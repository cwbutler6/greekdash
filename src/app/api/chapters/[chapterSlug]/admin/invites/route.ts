import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { addDays } from "date-fns";
import { MembershipRole } from "@/generated/prisma";
import { prisma } from "@/lib/db";

// Schema for creating invites
const createInviteSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  role: z.enum(["MEMBER", "ADMIN"]).default("MEMBER"),
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

// GET: List all invites for a chapter via admin dashboard
export async function GET(
  request: Request,
  { params }: { params: Promise<{ chapterSlug: string }> }
) {
  try {
    const { chapterSlug } = await params;
    
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
        { message: "Not authorized to view invites for this chapter" },
        { status: 403 }
      );
    }
    
    // Get all invites for this chapter
    const invites = await prisma.invite.findMany({
      where: { chapterId: chapter.id },
      include: {
        acceptedBy: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    
    return NextResponse.json({ invites });
  } catch (error) {
    console.error("Error fetching invites:", error);
    return NextResponse.json(
      { message: "Error fetching invites" },
      { status: 500 }
    );
  }
}

// POST: Create a new invite via admin dashboard
export async function POST(
  request: Request,
  { params }: { params: Promise<{ chapterSlug: string }> }
) {
  try {
    const { chapterSlug } = await params;
    
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
        { message: "Not authorized to create invites for this chapter" },
        { status: 403 }
      );
    }
    
    // Parse and validate request body
    const body = await request.json();
    const validationResult = createInviteSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { message: "Invalid invite data", errors: validationResult.error.errors },
        { status: 400 }
      );
    }
    
    const { email, role } = validationResult.data;
    
    // Check if user is already a member
    const existingUser = await prisma.user.findUnique({
      where: { email },
      include: {
        memberships: {
          where: { chapterId: chapter.id },
        },
      },
    });
    
    if (existingUser && existingUser.memberships.length > 0) {
      return NextResponse.json(
        { message: "User is already a member of this chapter" },
        { status: 400 }
      );
    }
    
    // Check if there's already a pending invite for this email
    const existingInvite = await prisma.invite.findFirst({
      where: {
        email,
        chapterId: chapter.id,
        accepted: false,
        expiresAt: {
          gt: new Date(),
        },
      },
    });
    
    if (existingInvite) {
      return NextResponse.json(
        { message: "An active invite already exists for this email" },
        { status: 400 }
      );
    }
    
    // Create the invite
    const invite = await prisma.invite.create({
      data: {
        email,
        role: role as MembershipRole,
        chapterId: chapter.id,
        createdById: session.user.id,
        expiresAt: addDays(new Date(), 7), // Expires in 7 days
      },
    });
    
    // In a production app, you would send an email with the invite link here
    // For now, we'll just return the invite with a token
    
    return NextResponse.json({ 
      message: "Invite created successfully",
      invite: {
        id: invite.id,
        email: invite.email,
        role: invite.role,
        expiresAt: invite.expiresAt,
      }
    });
    
  } catch (error) {
    console.error("Error creating invite:", error);
    return NextResponse.json(
      { message: "Error creating invite" },
      { status: 500 }
    );
  }
}

// DELETE: Revoke an invite (used for batch operations in admin)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ chapterSlug: string }> }
) {
  try {
    const { chapterSlug } = await params;
    const { searchParams } = new URL(request.url);
    const inviteId = searchParams.get('id');

    if (!inviteId) {
      return NextResponse.json(
        { message: "Invite ID is required" },
        { status: 400 }
      );
    }
    
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
        { message: "Not authorized to revoke invites for this chapter" },
        { status: 403 }
      );
    }
    
    // Verify the invite belongs to this chapter
    const invite = await prisma.invite.findUnique({
      where: { id: inviteId },
    });
    
    if (!invite) {
      return NextResponse.json(
        { message: "Invite not found" },
        { status: 404 }
      );
    }
    
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
      message: "Invite revoked successfully" 
    });
    
  } catch (error) {
    console.error("Error revoking invite:", error);
    return NextResponse.json(
      { message: "Error revoking invite" },
      { status: 500 }
    );
  }
}
