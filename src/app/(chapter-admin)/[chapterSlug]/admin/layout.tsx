import { ReactNode } from 'react';
import { requireChapterAccess } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { MembershipRole } from '@/generated/prisma';

export const metadata = {
  title: 'Admin Dashboard',
};

export const dynamic = 'force-dynamic';

type AdminLayoutProps = {
  children: ReactNode;
  params: Promise<{ chapterSlug: string }>;
};

export default async function AdminLayout({ children, params }: AdminLayoutProps) {
  // In Next.js 15, params is now a Promise that needs to be awaited
  const { chapterSlug } = await params;
  
  // This will redirect if user isn't authenticated or doesn't have access to this chapter
  const { membership } = await requireChapterAccess(chapterSlug);
  
  // Check if user has admin privileges
  if (membership.role !== MembershipRole.ADMIN && membership.role !== MembershipRole.OWNER) {
    redirect(`/${chapterSlug}/portal`);
  }

  // Return the children with no additional wrappers
  return children;
}
