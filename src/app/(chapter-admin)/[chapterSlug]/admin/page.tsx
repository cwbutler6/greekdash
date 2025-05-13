import { requireChapterAccess } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { MembershipRole } from '@/generated/prisma';
import { UpgradeButton } from '@/components/subscription/upgrade-button';
import { ManageBillingButton } from '@/components/subscription/manage-billing-button';
import { Calendar, CreditCard, FileText, Settings, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

export default async function AdminPage(props: { params: Promise<{ chapterSlug: string }> }) {
  // In Next.js 15, params is now a Promise that needs to be awaited
  const { chapterSlug } = await props.params;
  
  // This will redirect if user isn't authenticated or doesn't have access to this chapter
  const { user, membership } = await requireChapterAccess(chapterSlug);
  
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
  
  // Get pending members for quick access
  const pendingMembers = chapter.memberships.filter(m => 
    m.role === MembershipRole.PENDING_MEMBER
  );
  
  // Get upcoming "events" - this would be replaced with real events data
  const upcomingEvents = [
    {
      id: 1,
      title: 'Chapter Meeting',
      date: new Date('2025-05-15T19:00:00'),
      location: 'Student Union, Room 305',
      attendees: 24
    },
    {
      id: 2,
      title: 'Philanthropy Event',
      date: new Date('2025-05-22T10:00:00'),
      location: 'City Park',
      attendees: 48
    }
  ];
  
  // Member activity (for demo purposes)
  const recentActivity = [
    {
      id: 1,
      user: {
        name: 'John Doe',
        image: '',
        initials: 'JD'
      },
      action: 'Submitted dues payment ($250)',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
    },
    {
      id: 2,
      user: {
        name: 'Sarah Miller',
        image: '',
        initials: 'SM'
      },
      action: 'RSVP\'d to Philanthropy Event',
      timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000) // 3 hours ago
    },
    {
      id: 3,
      user: {
        name: 'Mike Johnson',
        image: '',
        initials: 'MJ'
      },
      action: 'Uploaded meeting minutes',
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000) // 5 hours ago
    }
  ];

  // Format a date in a nice way
  const formatEventDate = (date: Date) => {
    return `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} • ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
  };

  // Format a timestamp as relative time
  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 60) return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
    if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
    return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
  };

  return (
    <div className="flex min-h-screen flex-col">
      {/* Top Navigation Header */}
      <header className="sticky top-0 z-10 bg-emerald-600 text-white shadow-md">
        <div className="flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center space-x-8">
            <h1 className="text-xl font-bold">GreekDash</h1>
            <nav className="hidden md:flex space-x-6">
              <Link href={`/${chapterSlug}/admin`} className="font-medium">Dashboard</Link>
              <Link href={`/${chapterSlug}/admin/events`} className="text-emerald-100 hover:text-white transition-colors">Events</Link>
              <Link href={`/${chapterSlug}/admin/members`} className="text-emerald-100 hover:text-white transition-colors">Members</Link>
              <Link href={`/${chapterSlug}/admin/finance`} className="text-emerald-100 hover:text-white transition-colors">Finance</Link>
              <Link href={`/${chapterSlug}/admin/files`} className="text-emerald-100 hover:text-white transition-colors">Files</Link>
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            <Link 
              href={`/${chapterSlug}/portal`} 
              className="text-sm px-3 py-1 bg-emerald-700 hover:bg-emerald-800 rounded-md transition-colors">
              Member Portal
            </Link>
            <Avatar className="h-8 w-8 bg-emerald-700">
              <AvatarImage src={user?.image || undefined} alt={user?.name || 'User'} />
              <AvatarFallback className="bg-white text-emerald-600">
                {user?.name?.split(' ').map(n => n[0]).join('') || 'U'}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      {/* Main Content with Sidebar */}
      <div className="flex flex-1">
        {/* Sidebar Navigation */}
        <aside className="hidden md:block w-64 bg-slate-50 border-r border-slate-200 p-4 space-y-3">
          <Link 
            href={`/${chapterSlug}/admin`} 
            className="flex items-center gap-3 rounded-md px-3 py-2 bg-white hover:bg-slate-100 text-slate-800 font-semibold">
            <Settings size={18} />Chapter Overview
          </Link>
          <Link 
            href={`/${chapterSlug}/admin/events`} 
            className="flex items-center gap-3 rounded-md px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 font-semibold">
            <Calendar size={18} />Events
          </Link>
          <Link 
            href={`/${chapterSlug}/admin/members`} 
            className="flex items-center gap-3 rounded-md px-3 py-2 bg-white hover:bg-slate-100 text-slate-800">
            <Users size={18} />Members
            {pendingMembers.length > 0 && (
              <Badge variant="secondary" className="ml-auto">{pendingMembers.length}</Badge>
            )}
          </Link>
          <Link 
            href={`/${chapterSlug}/admin/finance`} 
            className="flex items-center gap-3 rounded-md px-3 py-2 bg-white hover:bg-slate-100 text-slate-800">
            <CreditCard size={18} />Finances
          </Link>
          <Link 
            href={`/${chapterSlug}/admin/files`} 
            className="flex items-center gap-3 rounded-md px-3 py-2 bg-white hover:bg-slate-100 text-slate-800">
            <FileText size={18} />Documents
          </Link>
          <Link 
            href={`/${chapterSlug}/admin/settings`} 
            className="flex items-center gap-3 rounded-md px-3 py-2 bg-white hover:bg-slate-100 text-slate-800">
            <Settings size={18} />Settings
          </Link>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-6 bg-slate-50">
          <div className="space-y-6 max-w-5xl mx-auto">
            {/* Upcoming Events Section */}
            <Card className="bg-white shadow-sm border-slate-200">
              <CardHeader className="flex flex-row justify-between items-center pb-2">
                <CardTitle className="text-xl font-bold text-slate-800">Upcoming Events</CardTitle>
                <Button variant="link" className="text-emerald-600 font-medium p-0">View All →</Button>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                  {upcomingEvents.map(event => (
                    <Card key={event.id} className="overflow-hidden border border-slate-200">
                      <CardHeader className="p-4 bg-emerald-50 border-b border-emerald-100">
                        <CardTitle className="text-sm font-semibold text-emerald-600">{event.title}</CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 space-y-3">
                        <div className="text-sm text-slate-500">{formatEventDate(event.date)}</div>
                        <div className="text-sm text-slate-500">{event.location}</div>
                        <div className="text-sm text-slate-500">{event.attendees} attendees confirmed</div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Member Activity */}
            <Card className="bg-white shadow-sm border-slate-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-xl font-bold text-slate-800">Recent Member Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 mt-2">
                  {recentActivity.map(activity => (
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
                  ))}
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
        </main>
      </div>
    </div>
  );
}
