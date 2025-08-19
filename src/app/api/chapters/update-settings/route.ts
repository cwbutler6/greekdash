import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireChapterAccess } from "@/lib/auth";
import { MembershipRole } from "@/generated/prisma";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const name = formData.get('name') as string;
    const primaryColor = formData.get('primaryColor') as string;
    const secondaryColor = formData.get('secondaryColor') as string;
    const publicInfo = formData.get('publicInfo') as string;
    const chapterSlug = formData.get('chapterSlug') as string;

    if (!name || !chapterSlug) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate both color formats if provided
    const colorRegex = /^#([0-9A-F]{6})$/i;
    if (primaryColor && !colorRegex.test(primaryColor)) {
      return NextResponse.json(
        { error: "Invalid primary color format. Please use hex format (e.g. #123ABC)" },
        { status: 400 }
      );
    }
    if (secondaryColor && !colorRegex.test(secondaryColor)) {
      return NextResponse.json(
        { error: "Invalid secondary color format. Please use hex format (e.g. #123ABC)" },
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
        // Include fields if they are provided
        ...(primaryColor && { primaryColor }),
        ...(secondaryColor && { secondaryColor }),
        ...(publicInfo !== undefined && { publicInfo })
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
