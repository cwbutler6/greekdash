import { requireChapterAccess } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { redirect } from 'next/navigation';
import { MembershipRole, type Membership, type AuditLog } from '@/generated/prisma';
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
  const memberCount = chapter.memberships.filter((m: Membership) => 
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
  // Define a type for the activity object to fix the TypeScript error
interface ActivityItem {
  id: string;
  user: {
    name: string;
    image: string;
    initials: string;
  };
  action: string;
  timestamp: Date;
}

  // Format a date in a nice way
  const formatEventDate = (date: Date) => {
    return `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} • ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
  };

  // Format a timestamp as relative time using date-fns
  const formatRelativeTime = (date: Date) => {
    return formatDistanceToNow(date, { addSuffix: true });
  };
  
  // Format audit action into readable text - define this BEFORE it's used
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
      'CHAPTER_BROADCAST': 'Sent a broadcast message',
      'PASSWORD_RESET_REQUESTED': 'Requested password reset',
      'PASSWORD_RESET_COMPLETED': 'Reset password',
      'INVITE_CREATED': 'Created invitation',
      'event.created': 'Created a new event',
      'event.updated': 'Updated an event',
      'event.deleted': 'Deleted an event',
      'event.rsvp_created': 'RSVP\'d to an event',
      'event.rsvp_updated': 'Updated event RSVP'
    };
    
    return actionMap[action] || `${action.split('.').pop()?.replace(/_/g, ' ')} ${targetType}`;
  };
  
  // Now we can safely use formatAuditAction since it's defined above
  const recentActivity = recentLogsResult.data.map((log: AuditLog & { user: { id: string; name: string | null; email: string | null; image: string | null; } }) => ({
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
                    upcomingEvents.map((event: typeof upcomingEvents[number]) => (
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
                    recentActivity.map((activity: ActivityItem) => (
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
            
            {/* Administrative Tools */}
            <Card className="bg-white shadow-sm border-slate-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-xl font-bold text-slate-800">Administrative Tools</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                  <a 
                    href={`/${chapterSlug}/admin/broadcasts`}
                    className="flex flex-col items-center p-4 border border-slate-200 rounded-md hover:border-emerald-300 hover:bg-emerald-50 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-emerald-600 mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21.5 6.5c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2z"></path>
                      <line x1="4" y1="6.5" x2="10" y2="6.5"></line>
                      <line x1="4" y1="17.5" x2="16" y2="17.5"></line>
                      <path d="M12 6.5v5s3.5 0 4 3v1"></path>
                    </svg>
                    <h3 className="font-medium text-slate-800">Send Broadcast</h3>
                    <p className="text-xs text-slate-500 text-center">Email all chapter members</p>
                  </a>
                  
                  <a 
                    href={`/${chapterSlug}/admin/members`}
                    className="flex flex-col items-center p-4 border border-slate-200 rounded-md hover:border-emerald-300 hover:bg-emerald-50 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-emerald-600 mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                      <circle cx="9" cy="7" r="4"></circle>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                    </svg>
                    <h3 className="font-medium text-slate-800">Manage Members</h3>
                    <p className="text-xs text-slate-500 text-center">Invite and manage members</p>
                  </a>
                  
                  <a 
                    href={`/${chapterSlug}/admin/events`}
                    className="flex flex-col items-center p-4 border border-slate-200 rounded-md hover:border-emerald-300 hover:bg-emerald-50 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-emerald-600 mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                      <line x1="16" y1="2" x2="16" y2="6"></line>
                      <line x1="8" y1="2" x2="8" y2="6"></line>
                      <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                    <h3 className="font-medium text-slate-800">Manage Events</h3>
                    <p className="text-xs text-slate-500 text-center">Create and schedule events</p>
                  </a>
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
