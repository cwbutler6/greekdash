import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireChapterAccess } from "@/lib/auth";
import { MembershipRole } from "@/generated/prisma";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const memberId = formData.get('memberId') as string;
    const chapterSlug = formData.get('chapterSlug') as string;

    if (!memberId || !chapterSlug) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get the authenticated user and membership with access check
    const { membership: adminMembership } = await requireChapterAccess(chapterSlug);

    // Check if the user has admin privileges
    if (
      adminMembership.role !== MembershipRole.ADMIN &&
      adminMembership.role !== MembershipRole.OWNER
    ) {
      return NextResponse.json(
        { error: "You must be an admin to perform this action" },
        { status: 403 }
      );
    }

    // Verify the target member belongs to the same chapter
    const targetMembership = await prisma.membership.findUnique({
      where: { id: memberId },
      include: { chapter: true }
    });

    if (!targetMembership) {
      return NextResponse.json(
        { error: "Membership not found" },
        { status: 404 }
      );
    }

    // Check if the membership is in the correct chapter
    if (targetMembership.chapter.slug !== chapterSlug) {
      return NextResponse.json(
        { error: "Member not found in this chapter" },
        { status: 404 }
      );
    }

    // Can't remove OWNER
    if (targetMembership.role === MembershipRole.OWNER) {
      return NextResponse.json(
        { error: "Cannot remove the chapter owner" },
        { status: 403 }
      );
    }

    // Can't remove yourself
    if (targetMembership.id === adminMembership.id) {
      return NextResponse.json(
        { error: "Cannot remove yourself from the chapter" },
        { status: 403 }
      );
    }

    // Delete the membership
    await prisma.membership.delete({
      where: { id: memberId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing member:", error);
    return NextResponse.json(
      { error: "Failed to remove member" },
      { status: 500 }
    );
  }
}
