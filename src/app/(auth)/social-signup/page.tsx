"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import LogoImage from "../../greekdash-icon.svg";
import { SocialChapterForm } from "@/components/auth/social-chapter-form";

export default function SocialSignupPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const provider = searchParams?.get('provider') || 'social';
  
  // Add debug logging to help troubleshoot
  console.log('Social signup page loaded:', { 
    status, 
    provider,
    isAuthenticated: status === 'authenticated',
    userId: session?.user?.id,
    userEmail: session?.user?.email,
    isNewUser: session?.user?.isNewUser,
    hasMemberships: session?.user?.memberships && session.user.memberships.length > 0,
    membershipCount: session?.user?.memberships?.length || 0
  });

  // If the user is not authenticated or has memberships, redirect
  useEffect(() => {
    if (status === 'loading') return;

    // If not authenticated, redirect to login
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    // If user already has memberships, redirect to their first chapter
    if (session?.user?.memberships && session.user.memberships.length > 0) {
      const firstChapter = session.user.memberships[0];
      router.push(`/${firstChapter.chapterSlug}/admin`);
    }
  }, [session, status, router]);

  // If still loading or redirecting, show loading state
  if (status === 'loading' || status === 'unauthenticated') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8 text-center">
          <div className="flex flex-col items-center justify-center">
            <Image src={LogoImage} alt="GreekDash Logo" width={56} height={56} />
            <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">
              Loading...
            </h2>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center justify-center">
          <Link href="/">
            <Image src={LogoImage} alt="GreekDash Logo" width={56} height={56} />
          </Link>
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">
            Complete Your {provider.charAt(0).toUpperCase() + provider.slice(1)} Signup
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            You&apos;re almost there! Just create your chapter to get started.
          </p>
        </div>

        <SocialChapterForm />
      </div>
    </div>
  );
}
