import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireChapterAdmin } from "@/lib/auth";
import { logAuditEntry } from "@/lib/audit";
import { MembershipRole } from "@/generated/prisma";

export async function POST(request: Request) {
  try {
    const { chapterSlug, action, memberIds, data } = await request.json();
    
    if (!chapterSlug || !action || !memberIds || !Array.isArray(memberIds)) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if user has admin access to the chapter
    const { user, membership } = await requireChapterAdmin(chapterSlug);

    let result;
    let auditAction;
    const auditMetadata = {
      memberCount: memberIds.length,
      action,
      ...data
    };

    switch (action) {
      case 'updateRole':
        if (!data?.role || !Object.values(MembershipRole).includes(data.role)) {
          return NextResponse.json(
            { error: "Invalid role specified" },
            { status: 400 }
          );
        }

        result = await prisma.membership.updateMany({
          where: {
            id: { in: memberIds },
            chapterId: membership.chapterId,
            isActive: true, // Only update active members
          },
          data: {
            role: data.role,
          },
        });
        auditAction = 'member.role_changed';
        break;

      case 'deactivate':
        result = await prisma.membership.updateMany({
          where: {
            id: { in: memberIds },
            chapterId: membership.chapterId,
            isActive: true,
          },
          data: {
            isActive: false,
            deactivatedAt: new Date(),
            deactivatedBy: user.id,
          },
        });
        auditAction = 'member.deactivated';
        break;

      case 'reactivate':
        result = await prisma.membership.updateMany({
          where: {
            id: { in: memberIds },
            chapterId: membership.chapterId,
            isActive: false,
          },
          data: {
            isActive: true,
            deactivatedAt: null,
            deactivatedBy: null,
          },
        });
        auditAction = 'member.reactivated';
        break;

      default:
        return NextResponse.json(
          { error: "Invalid action specified" },
          { status: 400 }
        );
    }

    // Log the bulk operation
    await logAuditEntry({
      action: auditAction as 'member.role_changed' | 'member.deactivated' | 'member.reactivated',
      targetType: 'chapter',
      targetId: membership.chapterId,
      userId: user.id,
      chapterId: membership.chapterId,
      metadata: auditMetadata,
    });

    return NextResponse.json({
      success: true,
      updatedCount: result.count,
      message: `Successfully ${action}d ${result.count} member(s)`,
    });
  } catch (error) {
    console.error('Error in bulk member operation:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}