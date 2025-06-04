import { requireChapterAccess } from '@/lib/auth';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { ArrowLeft, Phone } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import ProfileForm from './profile-form';

// Disable caching for this page to ensure we always get fresh data
export const revalidate = 0;

export default async function ProfilePage(props: { params: Promise<{ chapterSlug: string }> }) {
  // In Next.js 15, params is now a Promise that needs to be awaited
  const { chapterSlug } = await props.params;
  
  // This will redirect if user isn't authenticated or doesn't have access to this chapter
  // We don't need the returned membership object since we're fetching fresh data below
  await requireChapterAccess(chapterSlug);
  
  // Get current user data for the profile form
  const currentUser = await getCurrentUser();
  
  if (!currentUser) {
    // User isn't authenticated - this shouldn't happen if requireChapterAccess did its job,
    // but we need to check for TypeScript type safety
    return <div>Not authenticated</div>;
  }
  
  // Get chapter details for UI customization
  const chapter = await prisma.chapter.findUnique({
    where: {
      slug: chapterSlug,
    },
    select: {
      id: true,
      name: true,
      primaryColor: true,
    }
  });
  
  if (!chapter) {
    return <div>Chapter not found</div>;
  }
  
  // Directly fetch the membership and profile separately for better control
  // Step 1: Get the membership data with user data included
  const membershipData = await prisma.membership.findUnique({
    where: {
      userId_chapterId: {
        userId: currentUser.id,
        chapterId: chapter.id,
      }
    },
    include: {
      user: {
        select: {
          name: true,
          email: true,
          image: true,
        }
      }
    }
  });
  
  if (!membershipData) return null;
  
  // Step 2: Explicitly fetch the latest profile data
  const profile = await prisma.profile.findUnique({
    where: { membershipId: membershipData.id }
  });
  
  console.log('Fetched membership data:', JSON.stringify(membershipData, null, 2));
  console.log('Fetched profile data:', JSON.stringify(profile, null, 2));
  
  // Step 3: Combine and transform the data to match expected types for the ProfileForm component
  // Convert any Date objects to strings to match the component's expected types
  const transformedProfile = profile ? {
    ...profile,
    // Convert Date fields to strings for component compatibility
    createdAt: profile.createdAt.toISOString(),
    updatedAt: profile.updatedAt.toISOString(),
    crossingDate: profile.crossingDate ? profile.crossingDate.toISOString() : null
  } : undefined;
  
  const userMembership = {
    ...membershipData,
    profile: transformedProfile
  };
  
  // Additional log to verify the combined data
  console.log('Combined userMembership data:', 
    JSON.stringify({
      id: userMembership.id,
      role: userMembership.role,
      profileId: userMembership.profile?.id,
      profileImage: userMembership.profile?.profileImage
    }, null, 2)
  );

  // Fallback if membership data isn't available
  if (!userMembership) {
    return (
      <div className="py-8 text-center">
        <p className="text-red-500">Membership information not found</p>
        <p className="mt-2">
          <Link href={`/${chapterSlug}/portal`} className="text-blue-600 hover:underline">
            Return to portal
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link 
          href={`/${chapterSlug}/portal`}
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Portal
        </Link>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div 
          className="px-6 py-4 border-b border-gray-200"
          style={{ backgroundColor: chapter.primaryColor || '#1d4ed8', color: 'white' }}
        >
          <h1 className="text-xl font-semibold">Your Profile — {chapter.name}</h1>
          <p className="text-sm opacity-90 mt-1">
            Update your personal information for this chapter
          </p>
        </div>
        
        <div className="p-6 space-y-8">
          <div className="flex justify-between items-center border-b pb-4 mb-4">
            <h2 className="text-lg font-medium">Profile Information</h2>
            <div className="flex gap-2">
              <Link href={`/${chapterSlug}/profile/phone`}>
                <Button variant="outline" size="sm" className="flex items-center gap-1">
                  <Phone className="h-4 w-4" />
                  <span>Phone Settings</span>
                </Button>
              </Link>
            </div>
          </div>
          
          <ProfileForm 
            user={userMembership.user} 
            membership={{
              role: userMembership.role,
              profile: userMembership.profile
            }}
            chapterSlug={chapterSlug}
            primaryColor={chapter.primaryColor || '#1d4ed8'}
          />
        </div>
      </div>
    </div>
  );
}
