import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");
    
    if (!token) {
      return NextResponse.json(
        { message: "Token is required" },
        { status: 400 }
      );
    }
    
    // Find the token in the database - token is stored with pwd_reset_ prefix
    const resetToken = await prisma.verificationToken.findFirst({
      where: {
        token: `pwd_reset_${token}`,
        expires: {
          gt: new Date(), // Token must not be expired
        },
      },
    });
    
    // If token not found with prefix, try finding it without prefix for backward compatibility
    // (in case some tokens were stored differently)
    if (!resetToken) {
      const directToken = await prisma.verificationToken.findFirst({
        where: {
          token: token,
          expires: {
            gt: new Date(),
          },
        },
      });
      
      if (directToken) {
        return NextResponse.json(
          { message: "Invalid token format. Please request a new password reset." },
          { status: 400 }
        );
      }
    }
    
    if (!resetToken) {
      return NextResponse.json(
        { message: "Invalid or expired token" },
        { status: 400 }
      );
    }
    
    // Find the associated user
    const user = await prisma.user.findUnique({
      where: {
        email: resetToken.identifier,
      },
      select: {
        id: true,
      },
    });
    
    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { 
        message: "Token is valid",
        userId: user.id
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error verifying reset token:", error);
    return NextResponse.json(
      { message: "An error occurred while verifying the token" },
      { status: 500 }
    );
  }
}
