import { ReactNode } from 'react';
import { requireChapterAccess } from '@/lib/auth';
import Link from 'next/link';
import { MembershipRole } from '@/generated/prisma';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

type ChapterLayoutProps = {
  children: ReactNode;
  params: Promise<{ chapterSlug: string }>;
};

export default async function ChapterLayout({ children, params }: ChapterLayoutProps) {
  // In Next.js 15, params is now a Promise that needs to be awaited
  const { chapterSlug } = await params;
  
  // This will redirect if user isn't authenticated or doesn't have access to this chapter
  const { user, membership } = await requireChapterAccess(chapterSlug);
  
  // Check if user has admin privileges for conditional UI elements
  const isAdmin = membership.role === MembershipRole.ADMIN || membership.role === MembershipRole.OWNER;

  return (
    <div className="flex min-h-screen flex-col">
      {/* Top Navigation Header */}
      <header className="sticky top-0 z-10 bg-blue-600 text-white shadow-md">
        <div className="flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center space-x-8">
            <h1 className="text-xl font-bold">GreekDash</h1>
            <nav className="hidden md:flex space-x-6">
              <Link href={`/${chapterSlug}/portal`} className="font-medium">Dashboard</Link>
              <Link href={`/${chapterSlug}/portal/events`} className="text-blue-100 hover:text-white transition-colors">Events</Link>
              <Link href={`/${chapterSlug}/portal/members`} className="text-blue-100 hover:text-white transition-colors">Members</Link>
              <Link href={`/${chapterSlug}/portal/files`} className="text-blue-100 hover:text-white transition-colors">Files</Link>
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            {isAdmin && (
              <Link 
                href={`/${chapterSlug}/admin`} 
                className="text-sm px-3 py-1 bg-blue-700 hover:bg-blue-800 rounded-md transition-colors">
                Admin Dashboard
              </Link>
            )}
            <Avatar className="h-8 w-8 bg-blue-700">
              <AvatarImage src={user?.image || undefined} alt={user?.name || 'User'} />
              <AvatarFallback className="bg-white text-blue-600">
                {user?.name?.split(' ').map(n => n[0]).join('') || 'U'}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
