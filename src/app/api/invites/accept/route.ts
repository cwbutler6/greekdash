import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { hash } from "bcrypt";
import { z } from "zod";

// Validation schema for accepting an invite
const acceptInviteSchema = z.object({
  inviteToken: z.string().min(1, "Invite token is required"),
  fullName: z.string().min(3, "Full name must be at least 3 characters"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  email: z.string().email("Please enter a valid email address"),
});

export async function POST(request: Request) {
  try {
    // Parse request body
    const body = await request.json();
    const validationResult = acceptInviteSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { message: "Invalid input data", errors: validationResult.error.format() },
        { status: 400 }
      );
    }
    
    const { inviteToken, fullName, email, password } = validationResult.data;
    
    // Find the invite
    const invite = await prisma.invite.findUnique({
      where: { token: inviteToken },
      include: {
        chapter: true,
      },
    });
    
    // Validate invite
    if (!invite) {
      return NextResponse.json(
        { message: "Invite not found" },
        { status: 404 }
      );
    }
    
    if (invite.expiresAt < new Date()) {
      return NextResponse.json(
        { message: "Invite has expired" },
        { status: 400 }
      );
    }
    
    if (invite.accepted) {
      return NextResponse.json(
        { message: "Invite has already been used" },
        { status: 400 }
      );
    }
    
    // Ensure the email matches the invited email
    if (invite.email.toLowerCase() !== email.toLowerCase()) {
      return NextResponse.json(
        { message: "Email does not match the invited email address" },
        { status: 400 }
      );
    }
    
    // Hash password
    const hashedPassword = await hash(password, 12);
    
    // Check if user with this email already exists
    let user = await prisma.user.findUnique({
      where: { email },
      include: {
        memberships: {
          where: {
            chapterId: invite.chapterId,
          },
        },
      },
    });
    
    // If the user already has a membership in this chapter, return error
    if (user && user.memberships.length > 0) {
      return NextResponse.json(
        { message: "You are already a member of this chapter" },
        { status: 400 }
      );
    }
    
    // Start transaction to create user (if needed), membership, and mark invite as accepted
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // If user doesn't exist, create a new one
      if (!user) {
        user = await tx.user.create({
          data: {
            name: fullName,
            email,
            password: hashedPassword,
          },
        });
      } else {
        // Update existing user if they don't have a name or password
        if (!user.name || !user.password) {
          user = await tx.user.update({
            where: { id: user.id },
            data: {
              name: fullName || user.name,
              password: user.password || hashedPassword,
            },
          });
        }
      }
      
      // Create membership with the role specified in the invite
      const membership = await tx.membership.create({
        data: {
          userId: user!.id,
          chapterId: invite.chapterId,
          role: invite.role, // Use the role specified in the invite (MEMBER or ADMIN)
        },
      });
      
      // Mark invite as accepted
      const updatedInvite = await tx.invite.update({
        where: { id: invite.id },
        data: {
          accepted: true,
          acceptedAt: new Date(),
          acceptedById: user!.id,
        },
      });
      
      return { user, membership, updatedInvite };
    });
    
    // The user object must exist at this point due to the transaction logic
    if (!result.user) {
      return NextResponse.json(
        { message: "User creation failed during invite acceptance" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Invite successfully accepted",
      userId: result.user.id,
      chapterSlug: invite.chapter.slug,
      role: result.membership.role,
    });
    
  } catch (error) {
    console.error("Error accepting invite:", error);
    return NextResponse.json(
      { message: "An error occurred while accepting the invite" },
      { status: 500 }
    );
  }
}
