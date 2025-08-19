import { ReactNode } from 'react';
import { requireChapterAccess } from '@/lib/auth';
import Link from 'next/link';
import { MembershipRole } from '@/generated/prisma';
import UserMenu from '@/components/user-menu';
import { prisma } from '@/lib/db';
import { MobileNavigation } from '@/components/ui/mobile-navigation';
import { getChapterColors } from '@/lib/utils/colors';

type ChapterLayoutProps = {
  children: ReactNode;
  params: Promise<{ chapterSlug: string }>;
};

export default async function ChapterLayout({ children, params }: ChapterLayoutProps) {
  const { chapterSlug } = await params;
  
  // This will redirect if user isn't authenticated or doesn't have access to this chapter
  const { membership } = await requireChapterAccess(chapterSlug);
  
  // Fetch the chapter data including both colors
  const chapter = await prisma.chapter.findUnique({
    where: { slug: chapterSlug },
    select: {
      name: true,
      primaryColor: true,
      secondaryColor: true,
    }
  });
  
  // Get intelligent color scheme
  const colors = getChapterColors(chapter?.primaryColor, chapter?.secondaryColor);
  
  // Derive user permissions from membership
  const isAdmin = membership.role === MembershipRole.ADMIN || membership.role === MembershipRole.OWNER;
  
  // Define navigation links
  const navigationLinks = [
    { href: `/${chapterSlug}/portal`, label: 'Dashboard' },
    { href: `/${chapterSlug}/portal/events`, label: 'Events' },
    { href: `/${chapterSlug}/portal/members`, label: 'Members' },
    { href: `/${chapterSlug}/portal/finance/dues`, label: 'Dues' },
    { href: `/${chapterSlug}/portal/files`, label: 'Files' },
  ];
  
  return (
    <div className="flex min-h-screen flex-col">
      {/* Top Navigation Header */}
      <header 
        className="sticky top-0 z-10 shadow-md"
        style={{
          backgroundColor: colors.primary,
          color: colors.primaryText
        }}
      >
        <div className="flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center space-x-8">
            <h1 className="text-xl font-bold">GreekDash</h1>
            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-6">
              <Link href={`/${chapterSlug}/portal`} className="font-medium">Dashboard</Link>
              <Link href={`/${chapterSlug}/portal/events`} className="text-white/70 hover:text-white transition-colors">Events</Link>
              <Link href={`/${chapterSlug}/portal/members`} className="text-white/70 hover:text-white transition-colors">Members</Link>
              <Link href={`/${chapterSlug}/portal/finance/dues`} className="text-white/70 hover:text-white transition-colors">Dues</Link>
              <Link href={`/${chapterSlug}/portal/files`} className="text-white/70 hover:text-white transition-colors">Files</Link>
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            {/* Mobile Navigation Toggle */}
            <MobileNavigation 
              chapterSlug={chapterSlug}
              navigationLinks={navigationLinks}
              isAdmin={isAdmin}
              primaryColor={colors.primary}
              secondaryColor={colors.secondary}
            />
            <Link 
              href={`/${chapterSlug}`} 
              className="hidden md:block text-sm px-3 py-1 rounded-md transition-colors"
              style={{
                backgroundColor: colors.secondary,
                color: colors.secondaryText
              }}>
              Public Website
            </Link>
            {isAdmin && (
              <Link 
                href={`/${chapterSlug}/admin`} 
                className="hidden md:block text-sm px-3 py-1 rounded-md transition-colors"
                style={{
                  backgroundColor: colors.secondary,
                  color: colors.secondaryText
                }}>
                Admin Dashboard
              </Link>
            )}
            <div className="hidden md:block">
              <UserMenu 
                primaryColor={colors.primary}
                secondaryColor={colors.secondary}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6" style={{ backgroundColor: colors.secondary }}>
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
