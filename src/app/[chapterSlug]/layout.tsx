import { ReactNode } from 'react';
import { requireChapterAccess } from '@/lib/auth';
import Link from 'next/link';

type LayoutProps = {
  children: ReactNode;
  params: Promise<{ chapterSlug: string }>;
};

export default async function ChapterLayout({ children, params }: LayoutProps) {
  // In Next.js 15, params is now a Promise that needs to be awaited
  const { chapterSlug } = await params;
  
  // Check if we're rendering an admin route
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
  const isAdminRoute = pathname.includes(`/${chapterSlug}/admin`) || 
                      // For server-side detection, we can check segment names in a more dynamic way
                      // This is a simplified check for this example
                      false;

  // If this is an admin route, we don't want to wrap it in the chapter layout UI
  // but we still need the auth check to run
  
  // This will redirect if user isn't authenticated or doesn't have access to this chapter  
  const { membership } = await requireChapterAccess(chapterSlug);
  const isAdmin = membership.role === 'ADMIN' || membership.role === 'OWNER';

  // For admin routes, skip rendering the layout UI
  if (isAdminRoute) {
    return <>{children}</>;
  }
  
  // For non-admin routes, render the full chapter layout
  return (
    <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <header className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold">{chapterSlug}</h1>
          <div className="space-x-2">
            <Link 
              href={`/dashboard/${chapterSlug}`}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
            >
              Dashboard
            </Link>
            <Link 
              href={`/${chapterSlug}/portal`}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md shadow-sm hover:bg-blue-700"
            >
              Member Portal
            </Link>
            {isAdmin && (
              <Link 
                href={`/${chapterSlug}/admin`}
                className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md shadow-sm hover:bg-purple-700"
              >
                Admin
              </Link>
            )}
          </div>
        </div>
        <nav className="flex space-x-4 border-b border-gray-200 pb-4">
          <Link
            href={`/${chapterSlug}`}
            className="text-gray-500 hover:text-gray-700 hover:border-gray-300"
          >
            Home
          </Link>
          <Link
            href={`/${chapterSlug}/portal`}
            className="text-gray-500 hover:text-gray-700 hover:border-gray-300"
          >
            Portal
          </Link>
          {isAdmin && (
            <Link
              href={`/${chapterSlug}/admin`}
              className="text-gray-500 hover:text-gray-700 hover:border-gray-300"
            >
              Admin
            </Link>
          )}
        </nav>
      </header>
      <main className="max-w-7xl mx-auto">
        {children}
      </main>
    </div>
  );
}
