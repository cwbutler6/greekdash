import { NextResponse } from "next/server";
import { z } from "zod";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/mail";

// Schema validation for request body
const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export async function POST(request: Request) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validationResult = forgotPasswordSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { message: "Invalid request" },
        { status: 400 }
      );
    }

    const { email } = validationResult.data;
    
    // Check if the user exists and get their chapter memberships
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        memberships: {
          select: {
            chapterId: true,
          },
          take: 1,
        },
      },
    });
    
    // We don't want to reveal whether a user exists or not for security reasons
    // So we'll always return a success message even if the user doesn't exist
    if (!user) {
      return NextResponse.json(
        { message: "If an account with that email exists, we've sent password reset instructions." },
        { status: 200 }
      );
    }
    
    // Generate a secure token
    const token = randomBytes(32).toString("hex");
    
    // Create a password reset record - expires in 1 hour
    const expires = new Date();
    expires.setHours(expires.getHours() + 1);
    
    // Delete any existing reset tokens for this user
    await prisma.verificationToken.deleteMany({
      where: {
        identifier: user.email as string,
        token: {
          startsWith: "pwd_reset_",
        },
      },
    });
    
    // Add the prefix to the token for database storage
    const dbToken = `pwd_reset_${token}`;
    
    // Create a new reset token
    await prisma.verificationToken.create({
      data: {
        identifier: user.email as string,
        token: dbToken,
        expires,
      },
    });
    
    // Create the reset link - pass the same prefixed token to ensure consistency
    const resetLink = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`;
    
    // Send the password reset email
    await sendEmail(email, "passwordReset", {
      link: resetLink,
      name: user.name || "",
    });
    
    // Audit log for security monitoring (only if user has at least one chapter)
    if (user.memberships.length > 0) {
      // Use the first chapter the user belongs to for the audit log
      const chapterId = user.memberships[0].chapterId;
      
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          chapterId,
          action: "PASSWORD_RESET_REQUESTED",
          targetType: "USER",
          targetId: user.id,
          metadata: { timestamp: new Date().toISOString() },
        },
      });
    } else {
      // If user has no chapters, just log to console instead of creating an audit log
      console.log(`Password reset requested for user ${user.id} with no chapter memberships`);
    }
    
    return NextResponse.json(
      { message: "If an account with that email exists, we've sent password reset instructions." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in password reset request:", error);
    return NextResponse.json(
      { message: "An error occurred while processing your request" },
      { status: 500 }
    );
  }
}
