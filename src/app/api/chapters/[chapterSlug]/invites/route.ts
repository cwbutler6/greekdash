import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { addDays } from "date-fns";
import { MembershipRole } from "@/generated/prisma";
import prisma from "@/lib/prisma";

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
  { params }: { params: { chapterSlug: string } }
) {
  try {
    const { chapterSlug } = params;
    
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
        { message: "You do not have permission to access this resource" },
        { status: 403 }
      );
    }
    
    // Fetch all invites for this chapter
    const invites = await prisma.invite.findMany({
      where: {
        chapterId: chapter.id,
      },
      include: {
        acceptedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    
    return NextResponse.json(invites);
    
  } catch (error) {
    console.error("Error fetching invites:", error);
    return NextResponse.json(
      { message: "An error occurred while fetching invites" },
      { status: 500 }
    );
  }
}

// POST: Create a new invite
export async function POST(
  request: Request,
  { params }: { params: { chapterSlug: string } }
) {
  try {
    const { chapterSlug } = params;
    
    // Get current authenticated user
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Parse and validate request body
    const body = await request.json();
    const validationResult = createInviteSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { message: "Invalid input data", errors: validationResult.error.format() },
        { status: 400 }
      );
    }
    
    const { email, role } = validationResult.data;
    
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
        { message: "You do not have permission to create invites" },
        { status: 403 }
      );
    }
    
    // Check if the email is already a member of this chapter
    const existingUser = await prisma.user.findUnique({
      where: { email },
      include: {
        memberships: {
          where: {
            chapterId: chapter.id,
          },
        },
      },
    });
    
    if (existingUser && existingUser.memberships.length > 0) {
      return NextResponse.json(
        { message: "This user is already a member of your chapter" },
        { status: 400 }
      );
    }
    
    // Check if there's an active (not expired, not accepted) invite for this email
    const activeInvite = await prisma.invite.findFirst({
      where: {
        email,
        chapterId: chapter.id,
        accepted: false,
        expiresAt: {
          gt: new Date(),
        },
      },
    });
    
    if (activeInvite) {
      return NextResponse.json(
        { message: "An invite has already been sent to this email address" },
        { status: 400 }
      );
    }
    
    // Create the invite
    const invite = await prisma.invite.create({
      data: {
        email,
        role: role as MembershipRole,
        chapterId: chapter.id,
        expiresAt: addDays(new Date(), 7), // Expire after 7 days
      },
    });
    
    // In a real implementation, you would send an email here
    // For the scaffold, we'll just return the invite with the token
    
    return NextResponse.json({
      id: invite.id,
      email: invite.email,
      token: invite.token, // This would normally not be exposed directly
      expiresAt: invite.expiresAt,
    });
    
  } catch (error) {
    console.error("Error creating invite:", error);
    return NextResponse.json(
      { message: "An error occurred while creating the invite" },
      { status: 500 }
    );
  }
}
