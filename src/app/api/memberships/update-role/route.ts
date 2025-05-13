import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireChapterAccess } from "@/lib/auth";
import { MembershipRole } from "@/generated/prisma";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const memberId = formData.get('memberId') as string;
    const role = formData.get('role') as MembershipRole;
    const chapterSlug = formData.get('chapterSlug') as string;

    if (!memberId || !role || !chapterSlug) {
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

    // Can't modify OWNER role
    if (targetMembership.role === MembershipRole.OWNER) {
      return NextResponse.json(
        { error: "Cannot modify the owner's role" },
        { status: 403 }
      );
    }

    // Update the role
    const updatedMembership = await prisma.membership.update({
      where: { id: memberId },
      data: { role }
    });

    return NextResponse.json({ success: true, membership: updatedMembership });
  } catch (error) {
    console.error("Error updating member role:", error);
    return NextResponse.json(
      { error: "Failed to update member role" },
      { status: 500 }
    );
  }
}
