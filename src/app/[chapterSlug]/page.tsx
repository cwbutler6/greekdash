import { requireChapterAccess } from '@/lib/auth';
import prisma from '@/lib/prisma';

interface ChapterPageProps {
  params: {
    chapterSlug: string;
  };
}

export default async function ChapterPage({ params }: ChapterPageProps) {
  // This will redirect if user isn't authenticated or doesn't have access to this chapter
  const { membership } = await requireChapterAccess(params.chapterSlug);

  // Get chapter details
  const chapter = await prisma.chapter.findUnique({
    where: {
      slug: params.chapterSlug,
    },
    include: {
      subscription: true,
    },
  });

  if (!chapter) {
    return <div>Chapter not found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">{chapter.name}</h1>
          <div className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
            {chapter.subscription?.plan || "FREE"}
          </div>
        </div>

        <div className="mb-6 rounded-md bg-gray-50 p-4">
          <h2 className="mb-2 font-medium">Chapter Information</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm text-gray-500">Chapter Slug</p>
              <p className="font-medium">{chapter.slug}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Your Role</p>
              <p className="font-medium">{membership?.role}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Subscription</p>
              <p className="font-medium">{chapter.subscription?.plan || "FREE"} - {chapter.subscription?.status || "ACTIVE"}</p>
            </div>
          </div>
        </div>
        
        <div className="mt-8">
          <h2 className="mb-4 text-xl font-semibold">Quick Links</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <a
              href={`/${params.chapterSlug}/portal`}
              className="flex items-center rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-all hover:shadow-md"
            >
              <div>
                <h3 className="text-lg font-medium">Member Portal</h3>
                <p className="text-sm text-gray-500">Access member resources and tools</p>
              </div>
            </a>
            
            {(membership.role === 'ADMIN' || membership.role === 'OWNER') && (
              <a
                href={`/${params.chapterSlug}/admin`}
                className="flex items-center rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-all hover:shadow-md"
              >
                <div>
                  <h3 className="text-lg font-medium">Admin Dashboard</h3>
                  <p className="text-sm text-gray-500">Manage chapter settings and members</p>
                </div>
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
