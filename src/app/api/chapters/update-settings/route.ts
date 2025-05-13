import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireChapterAccess } from "@/lib/auth";
import { MembershipRole } from "@/generated/prisma";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const name = formData.get('name') as string;
    const primaryColor = formData.get('primaryColor') as string;
    const chapterSlug = formData.get('chapterSlug') as string;

    if (!name || !chapterSlug) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate color format if provided
    if (primaryColor && !/^#([0-9A-F]{6})$/i.test(primaryColor)) {
      return NextResponse.json(
        { error: "Invalid color format. Please use hex format (e.g. #123ABC)" },
        { status: 400 }
      );
    }

    // Get the authenticated user and membership with access check
    const { membership } = await requireChapterAccess(chapterSlug);

    // Check if the user has admin privileges
    if (
      membership.role !== MembershipRole.ADMIN &&
      membership.role !== MembershipRole.OWNER
    ) {
      return NextResponse.json(
        { error: "You must be an admin to perform this action" },
        { status: 403 }
      );
    }

    // Find the chapter to update
    const chapter = await prisma.chapter.findUnique({
      where: { slug: chapterSlug }
    });

    if (!chapter) {
      return NextResponse.json(
        { error: "Chapter not found" },
        { status: 404 }
      );
    }

    // Update the chapter settings
    const updatedChapter = await prisma.chapter.update({
      where: { slug: chapterSlug },
      data: { 
        name,
        // Add primaryColor to the data object if it's been updated in the client
        ...(primaryColor && { primaryColor })
      }
    });

    return NextResponse.json({ 
      success: true, 
      chapter: updatedChapter 
    });
  } catch (error) {
    console.error("Error updating chapter settings:", error);
    return NextResponse.json(
      { error: "Failed to update chapter settings" },
      { status: 500 }
    );
  }
}
