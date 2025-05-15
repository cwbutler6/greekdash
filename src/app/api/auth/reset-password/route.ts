import { NextResponse } from "next/server";
import { z } from "zod";
import { hash } from "bcrypt";
import { prisma } from "@/lib/db";

// Schema validation for request body
const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token is required"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password is too long")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

export async function POST(request: Request) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validationResult = resetPasswordSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { message: "Invalid request", errors: validationResult.error.format() },
        { status: 400 }
      );
    }

    const { token, password } = validationResult.data;
    
    // Find the token in the database - token is stored with pwd_reset_ prefix
    const resetToken = await prisma.verificationToken.findFirst({
      where: {
        token: `pwd_reset_${token}`,
        expires: {
          gt: new Date(),
        },
      },
    });
    
    // If token not found with prefix, we should return an error
    if (!resetToken) {
      // Check if there's a token without the prefix (which would be incorrect format)
      // This provides a more helpful error message for debugging purposes
      const hasLegacyToken = await prisma.verificationToken.count({
        where: {
          token: token,
          expires: {
            gt: new Date(),
          },
        },
      }) > 0;
      
      // Provide a more specific error message if we find a legacy token format
      const errorMessage = hasLegacyToken
        ? "Token format mismatch. Please request a new password reset."
        : "Invalid or expired token. Please request a new password reset.";
        
      return NextResponse.json(
        { message: errorMessage },
        { status: 400 }
      );
    }
    
    // Find the user associated with this token and include their chapter memberships
    const user = await prisma.user.findUnique({
      where: {
        email: resetToken.identifier,
      },
      include: {
        memberships: {
          select: {
            chapterId: true,
          },
          take: 1,
        },
      },
    });
    
    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }
    
    // Hash the new password
    const hashedPassword = await hash(password, 12);
    
    // Update the user's password
    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        password: hashedPassword,
      },
    });
    
    // Delete all verification tokens for this user to prevent reuse
    await prisma.verificationToken.deleteMany({
      where: {
        identifier: user.email as string,
      },
    });
    
    // Create an audit log entry only if the user belongs to at least one chapter
    if (user.memberships.length > 0) {
      // Use the first chapter the user belongs to for the audit log
      const chapterId = user.memberships[0].chapterId;
      
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          chapterId, // Use a valid chapter ID from the user's memberships
          action: "PASSWORD_RESET_COMPLETED",
          targetType: "USER",
          targetId: user.id,
          metadata: { timestamp: new Date().toISOString() },
        },
      });
    } else {
      // If user has no chapters, just log the password reset action to console instead
      console.log(`Password reset completed for user ${user.id} with no chapter memberships`);
    }
    
    return NextResponse.json(
      { message: "Password has been reset successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error resetting password:", error);
    return NextResponse.json(
      { message: "An error occurred while resetting your password" },
      { status: 500 }
    );
  }
}
