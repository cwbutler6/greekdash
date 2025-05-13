import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Get chapter information by slug
export async function GET(
  request: Request,
  { params }: { params: { chapterSlug: string } }
) {
  try {
    const { chapterSlug } = params;
    
    const chapter = await prisma.chapter.findUnique({
      where: { slug: chapterSlug },
      select: {
        id: true,
        name: true,
        slug: true,
        createdAt: true,
        // Don't expose joinCode in this API response
      },
    });
    
    if (!chapter) {
      return NextResponse.json(
        { message: "Chapter not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(chapter);
  } catch (error) {
    console.error("Error fetching chapter:", error);
    return NextResponse.json(
      { message: "An error occurred while fetching chapter information" },
      { status: 500 }
    );
  }
}
