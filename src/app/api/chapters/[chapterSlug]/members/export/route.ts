import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireChapterAdmin } from "@/lib/auth";
import { logAuditEntry } from "@/lib/audit";

// API route to export member data as CSV
export async function GET(
  request: Request,
  { params }: { params: Promise<{ chapterSlug: string }> }
) {
  try {
    const { chapterSlug } = await params;
    const url = new URL(request.url);
    const includeInactive = url.searchParams.get('includeInactive') === 'true';
    const format = url.searchParams.get('format') || 'csv';
    
    // Check if user has admin access to the chapter
    const { user, membership } = await requireChapterAdmin(chapterSlug);

    // Get all members of the chapter with detailed information
    const members = await prisma.membership.findMany({
      where: {
        chapter: { slug: chapterSlug },
        ...(includeInactive ? {} : { isActive: true }),
      },
      include: {
        user: true,
        profile: true,
        deactivatedByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        chapter: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [
        { isActive: 'desc' }, // Active members first
        { user: { name: 'asc' } },
      ],
    });

    // Log the export action
    await logAuditEntry({
      action: 'member.exported',
      targetType: 'chapter',
      targetId: membership.chapterId,
      userId: user.id,
      chapterId: membership.chapterId,
      metadata: {
        memberCount: members.length,
        includeInactive,
        format,
      },
    });

    if (format === 'csv') {
      // Generate CSV content
      const csvHeaders = [
        'Name',
        'Email',
        'Role',
        'Status',
        'Join Date',
        'Phone',
        'Major',
        'Graduation Year',
        'Emergency Contact',
        'Emergency Phone',
        'Deactivated Date',
        'Deactivated By',
      ];

      const csvRows = members.map(member => [
        member.user.name || '',
        member.user.email || '',
        member.role,
        member.isActive ? 'Active' : 'Inactive',
        member.createdAt ? new Date(member.createdAt).toLocaleDateString() : '',
        member.profile?.phone || '',
        member.profile?.major || '',
        member.profile?.gradYear?.toString() || '',
        member.deactivatedAt ? new Date(member.deactivatedAt).toLocaleDateString() : '',
        member.deactivatedByUser?.name || '',
      ]);

      // Escape CSV values and handle quotes
      const escapeCsvValue = (value: string) => {
        if (value.includes(',') || value.includes('"') || value.includes('\n')) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      };

      const csvContent = [
        csvHeaders.join(','),
        ...csvRows.map(row => row.map(escapeCsvValue).join(','))
      ].join('\n');

      // Set appropriate headers for file download
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `${chapterSlug}-members-${timestamp}.csv`;

      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Cache-Control': 'no-cache',
        },
      });
    }

    // For JSON format (fallback)
    return NextResponse.json({ 
      members: members.map(member => ({
        id: member.id,
        name: member.user.name,
        email: member.user.email,
        role: member.role,
        status: member.isActive ? 'Active' : 'Inactive',
        joinDate: member.createdAt,
        phone: member.profile?.phone,
        major: member.profile?.major,
        gradYear: member.profile?.gradYear,
        deactivatedDate: member.deactivatedAt,
        deactivatedBy: member.deactivatedByUser?.name,
      }))
    });
  } catch (error) {
    console.error('Error exporting members:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}