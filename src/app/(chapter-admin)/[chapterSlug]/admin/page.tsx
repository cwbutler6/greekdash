import { requireChapterAccess } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { MembershipRole } from '@/generated/prisma';
import { UpgradeButton } from '@/components/subscription/upgrade-button';
import { ManageBillingButton } from '@/components/subscription/manage-billing-button';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { getAuditLogs } from '@/lib/audit';
import { formatDistanceToNow } from 'date-fns';

export default async function AdminPage(props: { params: Promise<{ chapterSlug: string }> }) {
  // In Next.js 15, params is now a Promise that needs to be awaited
  const { chapterSlug } = await props.params;
  
  // This will redirect if user isn't authenticated or doesn't have access to this chapter
  const { membership } = await requireChapterAccess(chapterSlug);
  
  // Check if user has admin privileges
  if (membership.role !== 'ADMIN' && membership.role !== 'OWNER') {
    redirect(`/${chapterSlug}/portal`);
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
  
  // Get membership counts
  const memberCount = chapter.memberships.filter(m => 
    m.role !== MembershipRole.PENDING_MEMBER
  ).length;
  
  // Fetch upcoming events from the database
  const upcomingEvents = await prisma.event.findMany({
    where: {
      chapterId: chapter.id,
      status: 'UPCOMING',
      startDate: {
        gte: new Date(), // Events starting from now
      },
    },
    include: {
      _count: {
        select: {
          rsvps: {
            where: {
              status: 'GOING',
            },
          },
        },
      },
    },
    orderBy: {
      startDate: 'asc',
    },
    take: 4, // Limit to 4 upcoming events for the dashboard
  });
  
  // Fetch recent audit logs for chapter activity
  const recentLogsResult = await getAuditLogs({
    chapterId: chapter.id,
    page: 1,
    limit: 5, // Limit to 5 most recent activities
  });
  
  // Format the audit logs for display
  const recentActivity = recentLogsResult.data.map(log => ({
    id: log.id,
    user: {
      name: log.user.name || 'Unknown User',
      image: log.user.image || '',
      initials: log.user.name 
        ? log.user.name.split(' ').map(n => n[0]).join('').toUpperCase()
        : '??'
    },
    action: formatAuditAction(log.action, log.targetType),
    timestamp: log.createdAt
  }));

  // Format a date in a nice way
  const formatEventDate = (date: Date) => {
    return `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} • ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
  };

  // Format a timestamp as relative time using date-fns
  const formatRelativeTime = (date: Date) => {
    return formatDistanceToNow(date, { addSuffix: true });
  };
  
  // Format audit action into readable text
  const formatAuditAction = (action: string, targetType: string) => {
    const actionMap: Record<string, string> = {
      'user.login': 'Signed in',
      'user.logout': 'Signed out',
      'user.password_changed': 'Changed password',
      'user.profile_updated': 'Updated profile',
      'member.invited': 'Invited a new member',
      'member.invitation_accepted': 'Joined the chapter',
      'member.role_changed': 'Had role changed',
      'member.removed': 'Was removed from chapter',
      'chapter.settings_updated': 'Updated chapter settings',
      'chapter.subscription_changed': 'Changed subscription',
      'event.created': 'Created a new event',
      'event.updated': 'Updated an event',
      'event.deleted': 'Deleted an event',
      'event.rsvp_created': 'RSVP\'d to an event',
      'event.rsvp_updated': 'Updated event RSVP'
    };
    
    return actionMap[action] || `${action.split('.').pop()?.replace(/_/g, ' ')} ${targetType}`;
  };

  return (
    <div className="space-y-6">
            {/* Chapter Stats Section */}
            <Card className="bg-white shadow-sm border-slate-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-xl font-bold text-slate-800">Chapter Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                  <div className="p-4 border border-slate-200 rounded-md">
                    <h3 className="text-sm font-medium text-slate-500">Active Members</h3>
                    <p className="text-2xl font-bold text-emerald-600 mt-1">{memberCount}</p>
                  </div>
                  <div className="p-4 border border-slate-200 rounded-md">
                    <h3 className="text-sm font-medium text-slate-500">Subscription</h3>
                    <p className="text-2xl font-bold text-emerald-600 mt-1">{
                      chapter.subscription?.plan || "Free"
                    }</p>
                  </div>
                  <div className="p-4 border border-slate-200 rounded-md">
                    <h3 className="text-sm font-medium text-slate-500">Chapter Created</h3>
                    <p className="text-2xl font-bold text-emerald-600 mt-1">{
                      new Date(chapter.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                    }</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Upcoming Events Section */}
            <Card className="bg-white shadow-sm border-slate-200">
              <CardHeader className="flex flex-row justify-between items-center pb-2">
                <CardTitle className="text-xl font-bold text-slate-800">Upcoming Events</CardTitle>
                <Button variant="link" className="text-emerald-600 font-medium p-0" asChild>
                  <a href={`/${chapterSlug}/admin/events`}>View All →</a>
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                  {upcomingEvents.length > 0 ? (
                    upcomingEvents.map(event => (
                      <Card key={event.id} className="overflow-hidden border border-slate-200">
                        <CardHeader className="p-4 bg-emerald-50 border-b border-emerald-100">
                          <CardTitle className="text-sm font-semibold text-emerald-600">{event.title}</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 space-y-3">
                          <div className="text-sm text-slate-500">{formatEventDate(event.startDate)}</div>
                          <div className="text-sm text-slate-500">{event.location}</div>
                          <div className="text-sm text-slate-500">{event._count.rsvps} attendees confirmed</div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="col-span-2 p-6 text-center text-slate-500">
                      <p>No upcoming events scheduled.</p>
                      <Button 
                        variant="link" 
                        className="text-emerald-600 mt-2"
                        asChild
                      >
                        <a href={`/${chapterSlug}/admin/events/new`}>Schedule your first event</a>
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Recent Member Activity */}
            <Card className="bg-white shadow-sm border-slate-200">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-xl font-bold text-slate-800">Recent Member Activity</CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-sm text-emerald-600 hover:text-emerald-700"
                  asChild
                >
                  <a href={`/${chapterSlug}/admin/audit-logs`}>View All</a>
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 mt-2">
                  {recentActivity.length > 0 ? (
                    recentActivity.map(activity => (
                      <div key={activity.id} className="flex items-center gap-4 p-4 border border-slate-200 rounded-md">
                        <Avatar className="bg-emerald-100 text-emerald-600">
                          <AvatarImage src={activity.user.image} />
                          <AvatarFallback>{activity.user.initials}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="font-semibold text-slate-800">{activity.user.name}</div>
                          <div className="text-sm text-slate-500">
                            {activity.action} - {formatRelativeTime(activity.timestamp)}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center p-6 text-slate-500">
                      No recent activity recorded
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            {/* Chapter Info and Subscription */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Chapter Information */}
              <Card className="bg-white shadow-sm border-slate-200">
                <CardHeader>
                  <CardTitle>Chapter Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="space-y-2">
                    <div className="flex justify-between">
                      <dt className="text-sm font-medium text-slate-500">Name</dt>
                      <dd className="text-sm text-slate-900">{chapter.name}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm font-medium text-slate-500">Slug</dt>
                      <dd className="text-sm text-slate-900">{chapter.slug}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm font-medium text-slate-500">Created</dt>
                      <dd className="text-sm text-slate-900">{new Date(chapter.createdAt).toLocaleDateString()}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm font-medium text-slate-500">Member Count</dt>
                      <dd className="text-sm text-slate-900">{chapter.memberships.length}</dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>
              
              {/* Subscription Information */}
              <Card className="bg-white shadow-sm border-slate-200">
                <CardHeader>
                  <CardTitle>Subscription</CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="space-y-2">
                    <div className="flex justify-between">
                      <dt className="text-sm font-medium text-slate-500">Current Plan</dt>
                      <dd className="text-sm text-slate-900">
                        <Badge variant={chapter.subscription?.plan === "PRO" ? "default" : "secondary"} className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 hover:text-emerald-800">
                          {chapter.subscription?.plan || "FREE"}
                        </Badge>
                      </dd>
                    </div>
                    {chapter.subscription && (
                      <>
                        <div className="flex justify-between">
                          <dt className="text-sm font-medium text-slate-500">Status</dt>
                          <dd className="text-sm text-slate-900">{chapter.subscription.status}</dd>
                        </div>
                      </>
                    )}
                  </dl>
                  
                  <div className="mt-6 space-y-3">
                    <h3 className="text-md font-medium">Plan Management</h3>
                    {(!chapter.subscription || chapter.subscription.plan === "FREE") && (
                      <div className="space-y-3">
                        <p className="text-sm text-slate-600">
                          Upgrade your plan to access more features and capabilities.
                        </p>
                        <div className="flex space-x-2">
                          <UpgradeButton
                            chapterSlug={chapterSlug}
                            planId="basic"
                            className="bg-emerald-600 hover:bg-emerald-700"
                          >
                            Upgrade to Basic
                          </UpgradeButton>
                          <UpgradeButton
                            chapterSlug={chapterSlug}
                            planId="pro"
                            className="bg-emerald-700 hover:bg-emerald-800"
                          >
                            Upgrade to Pro
                          </UpgradeButton>
                        </div>
                      </div>
                    )}
                    
                    {chapter.subscription && chapter.subscription.plan !== "FREE" && (
                      <div>
                        <p className="text-sm text-slate-600">
                          Manage your subscription settings or update your billing information.
                        </p>
                        <div className="mt-2 flex space-x-2">
                          <ManageBillingButton
                            chapterSlug={chapterSlug}
                            variant="default"
                            className="bg-slate-600 hover:bg-slate-700"
                          >
                            Manage Billing
                          </ManageBillingButton>
                          {chapter.subscription.plan === "BASIC" && (
                            <UpgradeButton
                              chapterSlug={chapterSlug}
                              planId="pro"
                              className="bg-emerald-700 hover:bg-emerald-800"
                            >
                              Upgrade to Pro
                            </UpgradeButton>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
    </div>
  );
}
