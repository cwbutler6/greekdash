import { Metadata } from 'next';
import { AuditLogsList } from './components';
import { PageHeader } from '@/components/ui/page-header';
import { getAuditLogs } from '@/lib/audit';
import { redirect } from 'next/navigation';
import { getChapterFromSlug } from '@/lib/chapters';
import { getCurrentMembership } from '@/lib/memberships';
import { MembershipRole, AuditLog, User } from '@/generated/prisma';

export const metadata: Metadata = {
  title: 'Audit Logs - GreekDash',
  description: 'View activity logs for your chapter',
};

export default async function AuditLogsPage({
  params,
  searchParams,
}: {
  params: Promise<{ chapterSlug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { chapterSlug } = await params;
  const { page = '1', userId, action, targetType, from, to } = await searchParams;

  // Check if the chapter exists
  const chapter = await getChapterFromSlug(chapterSlug);
  if (!chapter) {
    redirect('/dashboard');
  }

  // Get the current membership and check if user has admin privileges
  const membership = await getCurrentMembership(chapter.id);
  if (!membership || (membership.role !== MembershipRole.ADMIN && membership.role !== MembershipRole.OWNER)) {
    redirect(`/${chapterSlug}/dashboard`);
  }

  // Parse query parameters
  const currentPage = typeof page === 'string' ? parseInt(page, 10) : 1;
  
  // Parse date parameters if provided
  let fromDate: Date | undefined;
  let toDate: Date | undefined;
  
  if (from && typeof from === 'string') {
    fromDate = new Date(from);
  }
  
  if (to && typeof to === 'string') {
    toDate = new Date(to);
  }
  
  // Fetch audit logs with pagination and filtering
  const logsResult = await getAuditLogs({
    chapterId: chapter.id,
    userId: userId as string | undefined,
    action: action as string | undefined,
    targetType: targetType as string | undefined,
    page: currentPage,
    limit: 25,
    fromDate,
    toDate,
  });
  
  // Map the data to ensure type compatibility (especially for metadata)
  type AuditLogWithUser = AuditLog & {
    user: Pick<User, 'id' | 'name' | 'email' | 'image'>;
  };

  const auditLogsData = {
    data: logsResult.data.map((log: AuditLogWithUser) => ({
      ...log,
      // Ensure metadata is a Record<string, unknown> or null/undefined
      metadata: log.metadata ? log.metadata as Record<string, unknown> : {},
    })),
    pagination: logsResult.pagination
  };

  return (
    <div className="container py-6 space-y-6">
      <PageHeader
        title="Audit Logs"
        description="Monitor activity within your chapter"
      />
      
      <AuditLogsList
        auditLogsData={auditLogsData}
        chapterSlug={chapterSlug}
      />
    </div>
  );
}
