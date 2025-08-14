'use client';

import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshAttempts, setRefreshAttempts] = useState(0);
  const [lastRefreshTime, setLastRefreshTime] = useState<number | null>(null);

  useEffect(() => {
    console.log('AuthGuard - Session status:', status);
    console.log('AuthGuard - Current path:', pathname);
    console.log('AuthGuard - Session data:', session);

    if (status === 'loading') return;

    // If not authenticated, redirect to login
    if (status === 'unauthenticated') {
      console.log('AuthGuard - User not authenticated, redirecting to login');
      router.push('/login');
      return;
    }

    // If authenticated but no session data, wait
    if (!session?.user) {
      console.log('AuthGuard - No session user data available');
      return;
    }

    const memberships = session.user.memberships || [];
    const hasValidMemberships = memberships.length > 0;
    
    console.log('AuthGuard - User memberships:', memberships);
    console.log('AuthGuard - Has valid memberships:', hasValidMemberships);

    // If user has memberships but is on auth pages, redirect them to their dashboard
    if (hasValidMemberships && (pathname === '/signup' || pathname === '/social-signup')) {
      console.log('AuthGuard - User has memberships but is on auth page, redirecting to dashboard');
      const firstMembership = memberships[0];
      const targetPath = firstMembership.role === 'ADMIN' || firstMembership.role === 'OWNER' 
        ? `/${firstMembership.chapterSlug}/admin`
        : `/${firstMembership.chapterSlug}/portal`;
      
      console.log('AuthGuard - Redirecting to:', targetPath);
      router.push(targetPath);
      return;
    }

    // If user has no memberships and is on a chapter-specific route, try refreshing session first
    if (!hasValidMemberships && (pathname.includes('/admin') || pathname.includes('/portal'))) {
      if (!isRefreshing) {
        console.log('AuthGuard - No memberships found on chapter route, attempting session refresh');
        setIsRefreshing(true);
        update().then(() => {
          console.log('AuthGuard - Session refresh completed');
          setIsRefreshing(false);
        }).catch((error) => {
          console.error('AuthGuard - Session refresh failed:', error);
          setIsRefreshing(false);
        });
        return;
      } else {
        // After refresh attempt, if still no memberships, redirect to signup
        console.log('AuthGuard - Still no memberships after refresh, redirecting to signup');
        router.push('/signup');
        return;
      }
    }

    // Enhanced logic for users without memberships on auth pages
    if (!hasValidMemberships && (pathname === '/signup' || pathname === '/social-signup')) {
      // Check if we recently came from a chapter creation flow
      const now = Date.now();
      const timeSinceLastRefresh = lastRefreshTime ? now - lastRefreshTime : Infinity;
      
      // If we're on social-signup and haven't refreshed recently, try refreshing the session
      // This handles the case where a user just created a chapter but the session hasn't updated yet
      if (pathname === '/social-signup' && refreshAttempts < 3 && timeSinceLastRefresh > 2000) {
        console.log('AuthGuard - On social-signup without memberships, attempting session refresh (attempt', refreshAttempts + 1, ')');
        setIsRefreshing(true);
        setRefreshAttempts(prev => prev + 1);
        setLastRefreshTime(now);
        
        update().then(() => {
          console.log('AuthGuard - Session refresh completed');
          setIsRefreshing(false);
        }).catch((error) => {
          console.error('AuthGuard - Session refresh failed:', error);
          setIsRefreshing(false);
        });
        return;
      }
    }

    // If user has no memberships and is not on signup/social-signup or chapter routes, redirect appropriately
    if (!hasValidMemberships && pathname !== '/signup' && pathname !== '/social-signup' && !pathname.includes('/admin') && !pathname.includes('/portal')) {
      console.log('AuthGuard - No memberships, determining redirect target');
      
      // Check if this is a social user (Google, etc.)
      const isSocialUser = session.user.isNewUser === true || 
        session.user.image?.includes('googleusercontent.com') ||
        (session.user.email && session.user.name && session.user.image && !session.user.isNewUser);
      
      const redirectTarget = isSocialUser ? '/social-signup' : '/signup';
      console.log('AuthGuard - Redirecting to:', redirectTarget, { isSocialUser, isNewUser: session.user.isNewUser });
      router.push(redirectTarget);
      return;
    }

    // If user has memberships, handle role-based redirects for chapter routes
    if (hasValidMemberships) {
      const currentChapterSlug = pathname.split('/')[1];
      const currentMembership = memberships.find(m => m.chapterSlug === currentChapterSlug);
      
      if (currentMembership) {
        // User is on their chapter's route
        if (pathname.includes('/admin') && currentMembership.role !== 'ADMIN' && currentMembership.role !== 'OWNER') {
          console.log('AuthGuard - Non-admin trying to access admin, redirecting to portal');
          router.push(`/${currentChapterSlug}/portal`);
          return;
        }
        
        if (pathname.includes('/portal') && (currentMembership.role === 'ADMIN' || currentMembership.role === 'OWNER')) {
          console.log('AuthGuard - Admin trying to access portal, redirecting to admin');
          router.push(`/${currentChapterSlug}/admin`);
          return;
        }
        
        // Note: Removed status check as the session membership type doesn't include status
        // This should be handled at the API level if needed
      }
    }

    console.log('AuthGuard - All checks passed, rendering children');
  }, [session, status, pathname, router, update, isRefreshing, refreshAttempts, lastRefreshTime]);

  // Show loading state
  if (status === 'loading' || isRefreshing) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Show loading if we're in the middle of a redirect
  if (status === 'unauthenticated' || !session?.user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
