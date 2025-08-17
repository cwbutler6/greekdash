import { ReactNode } from 'react';
import { requireChapterAccess } from '@/lib/auth';
import Link from 'next/link';
import { MembershipRole } from '@/generated/prisma';
import UserMenu from '@/components/user-menu';
import { prisma } from '@/lib/db';
import { MobileNavigation } from '@/components/ui/mobile-navigation';

type ChapterLayoutProps = {
  children: ReactNode;
  params: Promise<{ chapterSlug: string }>;
};

export default async function ChapterLayout({ children, params }: ChapterLayoutProps) {
  // In Next.js 15, params is now a Promise that needs to be awaited
  const { chapterSlug } = await params;
  
  // This will redirect if user isn't authenticated or doesn't have access to this chapter
  const { membership } = await requireChapterAccess(chapterSlug);
  
  // Fetch the chapter data including primary color
  const chapter = await prisma.chapter.findUnique({
    where: { slug: chapterSlug },
    select: {
      name: true,
      primaryColor: true,
    }
  });
  
  // Default color if not set (blue)
  const primaryColor = chapter?.primaryColor || '#1d4ed8';
  // Secondary color (usually white or a light shade)
  const secondaryColor = '#ffffff';
  
  // Check if user has admin privileges for conditional UI elements
  const isAdmin = membership.role === MembershipRole.ADMIN || membership.role === MembershipRole.OWNER;

  const navigationLinks = [
    { href: `/${chapterSlug}/portal`, label: 'Dashboard', isActive: true },
    { href: `/${chapterSlug}/portal/events`, label: 'Events' },
    { href: `/${chapterSlug}/portal/members`, label: 'Members' },
    { href: `/${chapterSlug}/portal/finance/dues`, label: 'Dues' },
    { href: `/${chapterSlug}/portal/files`, label: 'Files' },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      {/* Top Navigation Header */}
      <header 
        className="sticky top-0 z-10 text-white shadow-md"
        style={{ backgroundColor: primaryColor }}
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
              primaryColor={primaryColor}
              secondaryColor={secondaryColor}
            />
            <Link 
              href={`/${chapterSlug}`} 
              className="hidden md:block text-sm px-3 py-1 rounded-md transition-colors"
              style={{
                backgroundColor: `${primaryColor}dd`, // Slightly darker than primary
                color: secondaryColor
              }}>
              Public Website
            </Link>
            {isAdmin && (
              <Link 
                href={`/${chapterSlug}/admin`} 
                className="hidden md:block text-sm px-3 py-1 rounded-md transition-colors"
                style={{
                  backgroundColor: `${primaryColor}dd`, // Slightly darker than primary
                  color: secondaryColor
                }}>
                Admin Dashboard
              </Link>
            )}
            <div className="hidden md:block">
              <UserMenu 
                primaryColor={primaryColor}
                secondaryColor={secondaryColor}
              />
            </div>
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
