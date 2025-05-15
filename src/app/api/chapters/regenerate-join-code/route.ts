import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireChapterAccess } from "@/lib/auth";
import { MembershipRole } from "@/generated/prisma";
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const chapterSlug = formData.get('chapterSlug') as string;

    if (!chapterSlug) {
      return NextResponse.json(
        { error: "Missing required fields" },
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

    // Generate a new join code
    const newJoinCode = uuidv4();

    // Update the chapter
    const updatedChapter = await prisma.chapter.update({
      where: { slug: chapterSlug },
      data: { joinCode: newJoinCode }
    });

    return NextResponse.json({ 
      success: true, 
      joinCode: updatedChapter.joinCode 
    });
  } catch (error) {
    console.error("Error regenerating join code:", error);
    return NextResponse.json(
      { error: "Failed to regenerate join code" },
      { status: 500 }
    );
  }
}
