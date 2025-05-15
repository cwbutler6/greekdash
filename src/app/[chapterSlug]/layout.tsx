import { ReactNode } from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/db';

type LayoutProps = {
  children: ReactNode;
  params: Promise<{ chapterSlug: string }>;
};

export default async function PublicChapterLayout({ children, params }: LayoutProps) {
  // In Next.js 15, params is now a Promise that needs to be awaited
  const { chapterSlug } = await params;
  
  // Get basic chapter info for the header
  const chapter = await prisma.chapter.findUnique({
    where: { slug: chapterSlug },
    select: { name: true }
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto py-4 px-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {chapter?.name || chapterSlug}
              </h1>
              <p className="text-sm text-gray-500">Chapter Public Page</p>
            </div>
            <div className="space-x-3">
              <Link
                href="/"
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
              >
                GreekDash Home
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md shadow-sm hover:bg-blue-700"
              >
                Member Login
              </Link>
            </div>
          </div>
        </div>
      </header>
      
      <main>
        {children}
      </main>
      
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="container mx-auto py-8 px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase mb-4">
                {chapter?.name || 'Chapter'}
              </h3>
              <p className="text-gray-500 text-sm">
                A proud chapter on the GreekDash platform.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase mb-4">
                Quick Links
              </h3>
              <ul className="space-y-2">
                <li>
                  <Link href={`/${chapterSlug}`} className="text-blue-600 hover:text-blue-800 text-sm">
                    Chapter Home
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="text-blue-600 hover:text-blue-800 text-sm">
                    Member Login
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase mb-4">
                GreekDash
              </h3>
              <p className="text-gray-500 text-sm">
                GreekDash is a platform for fraternity and sorority chapter management.
              </p>
            </div>
          </div>
          <div className="mt-8 border-t border-gray-200 pt-8">
            <p className="text-sm text-gray-500 text-center">
              &copy; {new Date().getFullYear()} GreekDash. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
