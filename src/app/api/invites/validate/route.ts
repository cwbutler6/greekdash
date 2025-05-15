import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * Validates an invite token
 * This endpoint checks if an invite is valid, not expired, and not already accepted
 */
export async function GET(request: Request) {
  try {
    // Get token and optional chapter slug from query params
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");
    const chapterSlug = searchParams.get("chapterSlug");
    
    if (!token) {
      return NextResponse.json(
        { message: "Invite token is required" },
        { status: 400 }
      );
    }
    
    // Find invite by token
    const invite = await prisma.invite.findUnique({
      where: { token },
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
    
    // Check if invite is expired
    if (invite.expiresAt < new Date()) {
      return NextResponse.json(
        { message: "Invite has expired" },
        { status: 400 }
      );
    }
    
    // Check if invite has already been used
    if (invite.accepted) {
      return NextResponse.json(
        { message: "Invite has already been used" },
        { status: 400 }
      );
    }
    
    // If chapter slug is provided, validate that it matches the invite's chapter
    if (chapterSlug && invite.chapter.slug !== chapterSlug) {
      return NextResponse.json(
        { message: "Invite is not valid for this chapter" },
        { status: 400 }
      );
    }
    
    // Return invite info (without token for security)
    return NextResponse.json({
      id: invite.id,
      email: invite.email,
      chapterName: invite.chapter.name,
      chapterSlug: invite.chapter.slug,
      role: invite.role,
      expiresAt: invite.expiresAt,
    });
    
  } catch (error) {
    console.error("Error validating invite:", error);
    return NextResponse.json(
      { message: "An error occurred while validating the invite" },
      { status: 500 }
    );
  }
}
