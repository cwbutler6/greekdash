import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { redirect } from 'next/navigation';
import { PhoneSettingsForm } from '@/components/user/phone-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default async function PhoneSettingsPage({
  params,
}: {
  params: Promise<{ chapterSlug: string }>;
}) {
  const { chapterSlug } = await params;
  const session = await getSession();
  
  if (!session?.user?.id) {
    return redirect(`/${chapterSlug}/login?callbackUrl=/${chapterSlug}/profile/phone`);
  }

  // Get the user's membership and profile for this chapter
  const membership = await prisma.membership.findFirst({
    where: {
      userId: session.user.id,
      chapter: {
        slug: chapterSlug,
      },
    },
    include: {
      profile: true,
    },
  });

  if (!membership) {
    return redirect(`/${chapterSlug}`);
  }

  const phoneSettings = {
    phone: membership.profile?.phone || '',
    smsEnabled: membership.profile?.smsEnabled || false,
  };

  return (
    <div className="container max-w-3xl py-6">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Phone Settings</h1>
          <p className="text-muted-foreground">
            Manage your phone number and SMS notification preferences
          </p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Phone Number</CardTitle>
            <CardDescription>
              Add or update your phone number to receive SMS notifications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PhoneSettingsForm 
              initialData={phoneSettings} 
              chapterSlug={chapterSlug} 
            />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>About SMS Notifications</CardTitle>
            <CardDescription>
              Important information about SMS notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              SMS notifications are used for important announcements and updates from your chapter.
              Standard messaging rates may apply.
            </p>
            <p>
              Your phone number will only be used for GreekDash communications and will never be shared with third parties.
            </p>
            <p>
              You can opt out of SMS notifications at any time by updating your preferences above.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
