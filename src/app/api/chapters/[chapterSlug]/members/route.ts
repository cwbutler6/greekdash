import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireChapterAccess } from "@/lib/auth";
import { MembershipRole } from "@/generated/prisma";

// API route to get all members of a chapter
export async function GET(
  request: Request,
  { params }: { params: Promise<{ chapterSlug: string }> }
) {
  try {
    // In Next.js 15, params is a Promise that needs to be awaited
    const { chapterSlug } = await params;

    if (!chapterSlug) {
      return NextResponse.json(
        { error: "Chapter slug is required" },
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
        { error: "You must be an admin to access this resource" },
        { status: 403 }
      );
    }

    // Find the chapter
    const chapter = await prisma.chapter.findUnique({
      where: { slug: chapterSlug },
      include: {
        memberships: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        },
      },
    });

    if (!chapter) {
      return NextResponse.json(
        { error: "Chapter not found" },
        { status: 404 }
      );
    }

    // Return the members
    return NextResponse.json({
      success: true,
      members: chapter.memberships,
    });
  } catch (error) {
    console.error("Error fetching chapter members:", error);
    return NextResponse.json(
      { error: "Failed to fetch chapter members" },
      { status: 500 }
    );
  }
}
