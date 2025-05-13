import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireChapterAccess } from "@/lib/auth";
import { MembershipRole } from "@/generated/prisma";

// API route to get billing information for a chapter
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

    // Find the chapter with its subscription
    const chapter = await prisma.chapter.findUnique({
      where: { slug: chapterSlug },
      include: {
        subscription: true,
      },
    });

    if (!chapter) {
      return NextResponse.json(
        { error: "Chapter not found" },
        { status: 404 }
      );
    }

    // Return the chapter with billing information
    return NextResponse.json({
      success: true,
      chapter: {
        id: chapter.id,
        name: chapter.name,
        slug: chapter.slug,
        stripeCustomerId: chapter.stripeCustomerId,
        subscription: chapter.subscription,
      },
    });
  } catch (error) {
    console.error("Error fetching chapter billing information:", error);
    return NextResponse.json(
      { error: "Failed to fetch billing information" },
      { status: 500 }
    );
  }
}
