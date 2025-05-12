import { requireChapterAccess } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { UpgradeButton } from '@/components/subscription/upgrade-button';
import { ManageBillingButton } from '@/components/subscription/manage-billing-button';

export default async function AdminPage(props: { params: Promise<{ chapterSlug: string }> }) {
  // In Next.js 15, params is now a Promise that needs to be awaited
  const { chapterSlug } = await props.params;
  
  // This will redirect if user isn't authenticated or doesn't have access to this chapter
  const { membership } = await requireChapterAccess(chapterSlug);
  
  // Check if user has admin privileges
  if (membership.role !== 'ADMIN' && membership.role !== 'OWNER') {
    redirect(`/${chapterSlug}`);
  }

  // Get chapter details with subscription info
  const chapter = await prisma.chapter.findUnique({
    where: {
      slug: chapterSlug,
    },
    include: {
      subscription: true,
      memberships: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
      },
    },
  });

  if (!chapter) {
    return <div>Chapter not found</div>;
  }

  return (
    <div className="space-y-8">
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="mb-6 text-2xl font-bold">Admin Dashboard - {chapter.name}</h1>
        
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Chapter Information */}
          <div className="rounded-md border border-gray-200 p-4">
            <h2 className="mb-4 text-lg font-semibold">Chapter Information</h2>
            <dl className="space-y-2">
              <div className="flex justify-between">
                <dt className="text-sm font-medium text-gray-500">Name</dt>
                <dd className="text-sm text-gray-900">{chapter.name}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm font-medium text-gray-500">Slug</dt>
                <dd className="text-sm text-gray-900">{chapter.slug}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm font-medium text-gray-500">Created</dt>
                <dd className="text-sm text-gray-900">{new Date(chapter.createdAt).toLocaleDateString()}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm font-medium text-gray-500">Member Count</dt>
                <dd className="text-sm text-gray-900">{chapter.memberships.length}</dd>
              </div>
            </dl>
          </div>
          
          {/* Subscription Information */}
          <div className="rounded-md border border-gray-200 p-4">
            <h2 className="mb-4 text-lg font-semibold">Subscription</h2>
            <dl className="space-y-2">
              <div className="flex justify-between">
                <dt className="text-sm font-medium text-gray-500">Current Plan</dt>
                <dd className="text-sm text-gray-900">
                  <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
                    {chapter.subscription?.plan || "FREE"}
                  </span>
                </dd>
              </div>
              {chapter.subscription && (
                <>
                  <div className="flex justify-between">
                    <dt className="text-sm font-medium text-gray-500">Status</dt>
                    <dd className="text-sm text-gray-900">{chapter.subscription.status}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm font-medium text-gray-500">Stripe ID</dt>
                    <dd className="text-sm text-gray-900">
                      {chapter.subscription.stripeSubscriptionId || "N/A"}
                    </dd>
                  </div>
                </>
              )}
            </dl>
            
            <div className="mt-6 space-y-3">
              <h3 className="text-md font-medium">Plan Management</h3>
              {(!chapter.subscription || chapter.subscription.plan === "FREE") && (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">
                    Upgrade your plan to access more features and capabilities.
                  </p>
                  <div className="flex space-x-2">
                    <UpgradeButton
                      chapterSlug={chapterSlug}
                      planId="basic"
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Upgrade to Basic
                    </UpgradeButton>
                    <UpgradeButton
                      chapterSlug={chapterSlug}
                      planId="pro"
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      Upgrade to Pro
                    </UpgradeButton>
                  </div>
                </div>
              )}
              
              {chapter.subscription && chapter.subscription.plan !== "FREE" && (
                <div>
                  <p className="text-sm text-gray-600">
                    Manage your subscription settings or update your billing information.
                  </p>
                  <div className="mt-2 flex space-x-2">
                    <ManageBillingButton
                      chapterSlug={chapterSlug}
                      variant="default"
                      className="bg-gray-600 hover:bg-gray-700"
                    >
                      Manage Billing
                    </ManageBillingButton>
                    {chapter.subscription.plan === "BASIC" && (
                      <UpgradeButton
                        chapterSlug={chapterSlug}
                        planId="pro"
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        Upgrade to Pro
                      </UpgradeButton>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
