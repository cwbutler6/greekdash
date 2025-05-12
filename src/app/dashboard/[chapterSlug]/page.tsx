import { requireChapterAccess } from "@/lib/auth";
import prisma from "@/lib/prisma";

interface ChapterDashboardPageProps {
  params: {
    chapterSlug: string;
  };
}

export default async function ChapterDashboardPage({
  params,
}: ChapterDashboardPageProps) {
  // This will redirect if user isn't authenticated or doesn't have access to this chapter
  const { membership } = await requireChapterAccess(params.chapterSlug);

  // Get chapter details with subscription info (demonstrating multi-tenant data access)
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
          <h1 className="text-2xl font-bold">{chapter.name} Dashboard</h1>
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
              <p className="text-sm text-gray-500">Subscription Status</p>
              <p className="font-medium">{chapter.subscription?.status || "INACTIVE"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Member Since</p>
              <p className="font-medium">
                {new Date(membership?.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Features available based on subscription tier */}
        <div className="space-y-4">
          <h2 className="font-medium">Available Features</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Basic feature available to all plans */}
            <div className="rounded-md border border-gray-200 p-4">
              <h3 className="mb-2 font-medium">Member Directory</h3>
              <p className="text-sm text-gray-500">
                View and manage chapter members
              </p>
            </div>

            {/* Pro plan feature */}
            <div className={`rounded-md border p-4 ${chapter.subscription?.plan === "PRO" ? "border-gray-200" : "border-gray-100 bg-gray-50 opacity-60"}`}>
              <div className="flex items-center justify-between">
                <h3 className="mb-2 font-medium">Event Analytics</h3>
                {chapter.subscription?.plan !== "PRO" && (
                  <span className="rounded bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800">
                    Pro Plan
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500">
                Advanced analytics for chapter events
              </p>
            </div>

            {/* Basic or Pro plan feature */}
            <div className={`rounded-md border p-4 ${chapter.subscription?.plan !== "FREE" ? "border-gray-200" : "border-gray-100 bg-gray-50 opacity-60"}`}>
              <div className="flex items-center justify-between">
                <h3 className="mb-2 font-medium">Payment Collections</h3>
                {chapter.subscription?.plan === "FREE" && (
                  <span className="rounded bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800">
                    Basic Plan
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500">
                Collect dues and payments
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
