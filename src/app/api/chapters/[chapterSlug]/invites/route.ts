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

// GET: List all invites for a chapter
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

// POST: Create a new invite
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
    
    // Parse request body
    const body = await request.json();
    const validatedData = createInviteSchema.safeParse(body);
    
    if (!validatedData.success) {
      return NextResponse.json(
        { message: "Invalid invite data", errors: validatedData.error.errors },
        { status: 400 }
      );
    }
    
    const { email, role } = validatedData.data;
    
    // Check if email already exists as a user
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
        { message: "An invite has already been sent to this email" },
        { status: 400 }
      );
    }
    
    // Create a new invite
    const invite = await prisma.invite.create({
      data: {
        email,
        role: role as MembershipRole,
        expiresAt: addDays(new Date(), 7), // Invite expires in 7 days
        chapter: {
          connect: { id: chapter.id },
        },
      },
    });
    
    return NextResponse.json({
      message: "Invite created successfully",
      invite: {
        id: invite.id,
        email: invite.email,
        role: invite.role,
        expiresAt: invite.expiresAt,
      },
    });
  } catch (error) {
    console.error("Error creating invite:", error);
    return NextResponse.json(
      { message: "Error creating invite" },
      { status: 500 }
    );
  }
}
