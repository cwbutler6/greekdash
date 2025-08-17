'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';

interface AdminLinkButtonProps {
  chapterSlug: string;
  primaryColor: string;
}

export function AdminLinkButton({ chapterSlug }: AdminLinkButtonProps) {
  const { data: session, status } = useSession();

  // Don't render anything while loading or if not authenticated
  if (status === 'loading' || status === 'unauthenticated' || !session?.user) {
    return null;
  }

  // Check if user has admin access to this specific chapter
  const hasAdminAccess = session.user.memberships?.some(
    (membership) => 
      membership.chapterSlug === chapterSlug && 
      (membership.role === 'ADMIN' || membership.role === 'OWNER')
  );

  // Only render the admin link if user has admin access
  if (!hasAdminAccess) {
    return null;
  }

  return (
    <Link
      href={`/${chapterSlug}/admin`}
      className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
    >
      Admin Dashboard
    </Link>
  );
}