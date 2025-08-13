import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireChapterAdmin } from "@/lib/auth";
import { MembershipRole } from "@/generated/prisma";
import { logAuditEntry } from "@/lib/audit";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const memberId = formData.get('memberId') as string;
    const chapterSlug = formData.get('chapterSlug') as string;
    const action = formData.get('action') as 'deactivate' | 'reactivate';

    if (!memberId || !chapterSlug || !action) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if user has admin access to the chapter
    const { user: adminUser, membership: adminMembership } = await requireChapterAdmin(chapterSlug);

    // Find the target membership
    const targetMembership = await prisma.membership.findFirst({
      where: {
        id: memberId,
        chapter: { slug: chapterSlug },
      },
      include: {
        user: true,
        chapter: true,
      },
    });

    if (!targetMembership) {
      return NextResponse.json(
        { error: "Membership not found" },
        { status: 404 }
      );
    }

    // Prevent deactivating the chapter owner
    if (targetMembership.role === MembershipRole.OWNER) {
      return NextResponse.json(
        { error: "Cannot deactivate the chapter owner" },
        { status: 403 }
      );
    }

    // Prevent self-deactivation
    if (targetMembership.id === adminMembership.id) {
      return NextResponse.json(
        { error: "Cannot deactivate yourself" },
        { status: 403 }
      );
    }

    // Update membership status
    const updatedMembership = await prisma.membership.update({
      where: { id: memberId },
      data: {
        isActive: action === 'reactivate',
        deactivatedAt: action === 'deactivate' ? new Date() : null,
        deactivatedBy: action === 'deactivate' ? adminUser.id : null,
      },
      include: {
        user: true,
        profile: true,
      },
    });

    // Create audit log
    await logAuditEntry({
      userId: adminUser.id,
      chapterId: targetMembership.chapterId,
      action: action === 'deactivate' ? 'member.deactivated' : 'member.reactivated',
      targetType: 'membership',
      targetId: memberId,
      metadata: {
        targetUserId: targetMembership.userId,
        targetUserName: targetMembership.user.name,
        targetUserEmail: targetMembership.user.email,
      },
    });

    return NextResponse.json({
      message: `Member ${action === 'deactivate' ? 'deactivated' : 'reactivated'} successfully`,
      membership: updatedMembership,
    });
  } catch (error) {
    console.error('Error updating membership status:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}