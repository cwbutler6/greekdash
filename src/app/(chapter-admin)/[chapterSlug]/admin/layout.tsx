import { ReactNode } from 'react';
import { requireChapterAccess } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { MembershipRole } from '@/generated/prisma';
import Link from 'next/link';
import prisma from '@/lib/prisma';
import { Badge } from '@/components/ui/badge';
import { Calendar, CreditCard, FileText, Settings, Users } from 'lucide-react';
import { MobileSidebarToggle } from '@/components/ui/mobile-sidebar-toggle';
import { UserDropdown } from '@/components/ui/user-dropdown';
import { SidebarLink } from '@/components/ui/sidebar-link';

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
  const { user, membership } = await requireChapterAccess(chapterSlug);
  
  // Check if user has admin privileges
  if (membership.role !== MembershipRole.ADMIN && membership.role !== MembershipRole.OWNER) {
    redirect(`/${chapterSlug}/portal`);
  }

  // Get chapter details for the sidebar
  const chapter = await prisma.chapter.findUnique({
    where: {
      slug: chapterSlug,
    },
    include: {
      memberships: {
        where: { role: MembershipRole.PENDING_MEMBER },
      },
    },
  });

  if (!chapter) {
    return <div>Chapter not found</div>;
  }

  // Count of pending members for the badge
  const pendingMembersCount = chapter.memberships.length;

  return (
    <div className="flex min-h-screen flex-col">
      {/* Top Navigation Header - Simplified */}
      <header className="sticky top-0 z-30 bg-emerald-600 text-white shadow-md">
        <div className="flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center space-x-2">
            <MobileSidebarToggle chapterSlug={chapterSlug} />
            <Link href={`/${chapterSlug}/admin`} className="text-xl font-bold">GreekDash</Link>
          </div>
          <div className="flex items-center space-x-4">
            <Link 
              href={`/${chapterSlug}/portal`} 
              className="text-sm px-3 py-1 bg-emerald-700 hover:bg-emerald-800 rounded-md transition-colors">
              Member Portal
            </Link>
            <UserDropdown user={user} chapterSlug={chapterSlug} />
          </div>
        </div>
      </header>

      {/* Main Content with Sidebar */}
      <div className="flex flex-1">
        {/* Sidebar Navigation - Hidden by default on mobile, visible on desktop */}
        <aside id={`mobile-sidebar-${chapterSlug}`} className="hidden md:block w-64 bg-slate-50 border-r border-slate-200 p-4 space-y-3 absolute md:relative z-20 top-16 md:top-0 h-[calc(100vh-4rem)] md:h-auto overflow-y-auto">
          <SidebarLink
            href={`/${chapterSlug}/admin`}
            exactMatch
          >
            <Settings size={18} className="flex-shrink-0" />
            <span>Chapter Overview</span>
          </SidebarLink>
          
          {/* Members Section */}
          <div className="pt-2 pb-1">
            <p className="text-xs font-semibold text-slate-500 uppercase px-3 mb-2">Members</p>
          </div>
          
          <SidebarLink 
            href={`/${chapterSlug}/admin/invites`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0"><path d="M22 13V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12c0 1.1.9 2 2 2h8"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/><path d="M16 19h6"/><path d="M19 16v6"/></svg>
            <span>Invite Members</span>
          </SidebarLink>
          
          <SidebarLink 
            href={`/${chapterSlug}/admin/pending`}
            badge={pendingMembersCount > 0 && (
              <Badge variant="secondary">{pendingMembersCount}</Badge>
            )}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/></svg>
            <span>Pending Members</span>
          </SidebarLink>
          
          <SidebarLink 
            href={`/${chapterSlug}/admin/members`}
          >
            <Users size={18} className="flex-shrink-0" />
            <span>Members List</span>
          </SidebarLink>
          
          {/* Chapter Management Section */}
          <div className="pt-2 pb-1">
            <p className="text-xs font-semibold text-slate-500 uppercase px-3 mb-2">Management</p>
          </div>
          
          <SidebarLink 
            href={`/${chapterSlug}/admin/events`}
          >
            <Calendar size={18} className="flex-shrink-0" />
            <span>Events</span>
          </SidebarLink>
          
          <SidebarLink 
            href={`/${chapterSlug}/admin/files`}
          >
            <FileText size={18} className="flex-shrink-0" />
            <span>Documents</span>
          </SidebarLink>
          
          <SidebarLink 
            href={`/${chapterSlug}/admin/audit-logs`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0"><path d="M12 13V7"/><path d="M15.45 11h-8.9"/><path d="M7 19l1-4"/><path d="M17 5l-1 4"/><path d="M17 19l-1-4"/><path d="M7 5l1 4"/><path d="M17.28 3.5A10 10 0 0 0 7.72 3.5"/><path d="M20.5 16.28A10 10 0 0 0 20.5 6.72"/><path d="M3.5 16.28A10 10 0 0 0 3.5 6.72"/><path d="M7.72 20.5a10 10 0 0 0 9.56 0"/></svg>
            <span>Audit Logs</span>
          </SidebarLink>
          
          {/* Admin Settings Section */}
          <div className="pt-2 pb-1">
            <p className="text-xs font-semibold text-slate-500 uppercase px-3 mb-2">Settings</p>
          </div>
          
          <SidebarLink 
            href={`/${chapterSlug}/admin/settings`}
          >
            <Settings size={18} className="flex-shrink-0" />
            <span>Chapter Settings</span>
          </SidebarLink>
          
          <SidebarLink 
            href={`/${chapterSlug}/admin/billing`}
          >
            <CreditCard size={18} className="flex-shrink-0" />
            <span>Billing</span>
          </SidebarLink>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-6 bg-slate-50">
          <div className="space-y-6 max-w-5xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
