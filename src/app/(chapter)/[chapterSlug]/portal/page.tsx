import { requireChapterAccess } from '@/lib/auth';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { UpgradeButton } from '@/components/subscription/upgrade-button';
import Link from 'next/link';
import { format } from 'date-fns';
import { ArrowRight, CalendarDays, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

interface EventWithRSVP {
  id: string;
  title: string;
  description?: string;
  location?: string;
  startDate: Date | string;
  endDate?: Date | string;
  status: string;
  isPublic: boolean;
  chapterId: string;
  rsvps: Array<{
    id: string;
    status: string;
    userId: string;
  }>;
}

export default async function PortalPage(props: { params: Promise<{ chapterSlug: string }> }) {
  // In Next.js 15, params is now a Promise that needs to be awaited
  const { chapterSlug } = await props.params;
  
  // This will redirect if user isn't authenticated or doesn't have access to this chapter
  const { membership } = await requireChapterAccess(chapterSlug);
  const isAdmin = membership.role === 'ADMIN' || membership.role === 'OWNER';
  
  // Get current user for display
  const currentUser = await getCurrentUser();

  // Get chapter details with subscription info
  const chapter = await prisma.chapter.findUnique({
    where: {
      slug: chapterSlug,
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

  // Fetch upcoming events (limited to 3)
  const now = new Date();
  const upcomingEvents = await prisma.event.findMany({
    where: {
      chapterId: chapter.id,
      isPublic: true,
      startDate: {
        gte: now,
      },
      status: {
        in: ['UPCOMING', 'ONGOING'],
      },
    },
    include: {
      rsvps: {
        where: {
          userId: currentUser?.id,
        },
        take: 1,
      },
    },
    orderBy: {
      startDate: 'asc',
    },
    take: 3,
  });

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
        
        {/* Upcoming Events Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Upcoming Events</h2>
            <Link href={`/${chapterSlug}/portal/events`}>
              <Button variant="ghost" className="text-blue-600 p-0 h-auto font-medium">
                View all <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
          
          {upcomingEvents.length === 0 ? (
            <div className="text-center py-8 border rounded-lg">
              <p className="text-gray-500">No upcoming events at this time.</p>
              <p className="text-gray-500 text-sm mt-1">Check back later for new events.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {upcomingEvents.map((event: EventWithRSVP) => (
                <Card key={event.id} className="border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{event.title}</CardTitle>
                    <CardDescription>
                      <div className="flex items-center mt-1">
                        <CalendarDays className="h-3.5 w-3.5 mr-1" />
                        <span>{format(new Date(event.startDate), 'EEE, MMM d, yyyy')}</span>
                      </div>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="flex items-center text-sm text-gray-500">
                      <MapPin className="h-3.5 w-3.5 mr-1" />
                      <span className="truncate">{event.location}</span>
                    </div>
                    <div className="flex items-center mt-2">
                      {event.rsvps.length > 0 && (
                        <Badge variant="outline" className="mr-2">
                          {event.rsvps[0].status === 'GOING' 
                            ? 'You\'re going'
                            : event.rsvps[0].status === 'MAYBE'
                              ? 'You might go'
                              : 'You declined'}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Link href={`/${chapterSlug}/portal/events`} className="w-full">
                      <Button className="w-full" variant="outline">
                        {event.rsvps.length > 0 ? 'Update RSVP' : 'RSVP Now'}
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
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
            
            {currentPlan !== 'FREE' && (
              <div>
                <p className="text-sm text-gray-600">
                  You can manage your chapter&apos;s subscription settings from the admin dashboard.
                </p>
                <div className="mt-2">
                  <Link 
                    href={`/${chapterSlug}/admin`}
                    className="inline-flex items-center rounded-md border border-transparent bg-gray-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                  >
                    Go to Admin Dashboard
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
