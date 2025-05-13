import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET: Get current user's membership for the specified chapter
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
      select: {
        id: true,
        name: true,
        slug: true,
      },
    });
    
    if (!chapter) {
      return NextResponse.json(
        { message: "Chapter not found" },
        { status: 404 }
      );
    }
    
    // Get user's membership for this chapter
    const membership = await prisma.membership.findUnique({
      where: {
        userId_chapterId: {
          userId: session.user.id,
          chapterId: chapter.id,
        },
      },
    });
    
    if (!membership) {
      return NextResponse.json(
        { message: "You are not a member of this chapter" },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      chapter,
      membership,
    });
    
  } catch (error) {
    console.error("Error fetching membership:", error);
    return NextResponse.json(
      { message: "An error occurred while fetching membership information" },
      { status: 500 }
    );
  }
}
