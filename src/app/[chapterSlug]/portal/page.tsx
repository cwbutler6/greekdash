import { requireChapterAccess } from '@/lib/auth';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { UpgradeButton } from '@/components/subscription/upgrade-button';

interface PortalPageProps {
  params: {
    chapterSlug: string;
  };
}

export default async function PortalPage({ params }: PortalPageProps) {
  // This will redirect if user isn't authenticated or doesn't have access to this chapter
  const { membership } = await requireChapterAccess(params.chapterSlug);
  const isAdmin = membership.role === 'ADMIN' || membership.role === 'OWNER';
  
  // Get current user for display
  const currentUser = await getCurrentUser();

  // Get chapter details with subscription info
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

  const planFeatures = {
    FREE: ['Member Directory', 'Basic Event Management', 'Limited Communication Tools'],
    BASIC: ['Member Directory', 'Calendar Integration', 'Payment Collections', 'File Sharing', 'Polls & Voting'],
    PRO: ['Member Directory', 'Calendar Integration', 'Payment Collections', 'File Sharing', 'Polls & Voting', 'Event Analytics', 'Custom Branding', 'Advanced Reports']
  };

  const currentPlan = chapter.subscription?.plan || 'FREE';
  const availableFeatures = planFeatures[currentPlan as keyof typeof planFeatures];

  return (
    <div className="space-y-8">
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Member Portal - {chapter.name}</h1>
          <div className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
            {currentPlan}
          </div>
        </div>

        <div className="mb-8 rounded-md bg-gray-50 p-4">
          <h2 className="mb-2 font-medium">Welcome, {currentUser?.name || 'Member'}</h2>
          <p className="text-gray-600">
            This is your chapter portal where you can access all resources and features available to your chapter.
          </p>
        </div>

        {/* Display feature access based on subscription tier */}
        <div className="mb-8">
          <h2 className="mb-4 text-xl font-semibold">Chapter Features</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {availableFeatures.map((feature) => (
              <div key={feature} className="rounded-md border border-gray-200 p-4 shadow-sm">
                <h3 className="mb-2 font-medium">{feature}</h3>
                <p className="text-sm text-gray-500">
                  Access this feature as part of your {currentPlan} plan.
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* For administrators, show subscription management options */}
        {isAdmin && (
          <div className="mt-8 rounded-md border border-gray-200 p-4">
            <h2 className="mb-2 text-lg font-semibold">Subscription Information</h2>
            <p className="mb-4 text-gray-600">
              Your chapter is currently on the {currentPlan} plan.
              {currentPlan === 'FREE' && " Upgrade to unlock more features."}
            </p>

            {currentPlan === 'FREE' && (
              <div className="space-y-3">
                <p className="text-sm text-gray-600">
                  As an admin, you can upgrade your chapter&apos;s subscription to access more features.
                </p>
                <div className="flex space-x-2">
                  <UpgradeButton
                    chapterSlug={params.chapterSlug}
                    planId="basic"
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Upgrade to Basic
                  </UpgradeButton>
                  <UpgradeButton
                    chapterSlug={params.chapterSlug}
                    planId="pro"
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    Upgrade to Pro
                  </UpgradeButton>
                </div>
              </div>
            )}
            
            {currentPlan !== 'FREE' && (
              <div>
                <p className="text-sm text-gray-600">
                  You can manage your chapter&apos;s subscription settings from the admin dashboard.
                </p>
                <div className="mt-2">
                  <a 
                    href={`/${params.chapterSlug}/admin`}
                    className="inline-flex items-center rounded-md border border-transparent bg-gray-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                  >
                    Go to Admin Dashboard
                  </a>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
