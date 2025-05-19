'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';

interface AuthGuardProps {
  children: React.ReactNode;
}

/**
 * AuthGuard component - Redirects authenticated users away from auth pages 
 * to their appropriate dashboard based on role and membership
 */
export default function AuthGuard({ children }: AuthGuardProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Only check if the session is fully loaded
    if (status === 'loading') return;

    const handleAuthRedirect = async () => {
      // Allow access to the root path and login page for everyone
      // This ensures both the homepage and login page are accessible to everyone, even when authenticated
      if (pathname === '/' || pathname === '/login') {
        setIsLoading(false);
        return;
      }
      
      // If user is authenticated, redirect them away from auth pages
      if (session && session.user) {
        const memberships = session.user.memberships || [];
        
        if (memberships.length > 0) {
          // Find first active membership (non-pending)
          const activeMembership = memberships.find(
            (m) => m.role !== 'PENDING_MEMBER'
          );

          if (activeMembership) {
            // If user is an admin or owner, send them to admin dashboard
            if (activeMembership.role === 'ADMIN' || activeMembership.role === 'OWNER') {
              console.log(`Auth Guard: Redirecting admin to /${activeMembership.chapterSlug}/admin`);
              router.replace(`/${activeMembership.chapterSlug}/admin`);
              return;
            } else {
              // Regular members go to the portal
              console.log(`Auth Guard: Redirecting member to /${activeMembership.chapterSlug}/portal`);
              router.replace(`/${activeMembership.chapterSlug}/portal`);
              return;
            }
          } else if (memberships.length > 0) {
            // Handle pending members
            console.log(`Auth Guard: Redirecting pending member to /${memberships[0].chapterSlug}/pending`);
            router.replace(`/${memberships[0].chapterSlug}/pending`);
            return;
          }
        }
        
        // If user is authenticated but has no memberships, allow them to continue to signup
        // This handles the edge case of OAuth users who need to create/join a chapter
        if (pathname !== '/signup') {
          console.log('Auth Guard: User has no memberships, redirecting to signup');
          router.replace('/signup');
          return;
        }
      }
      
      setIsLoading(false);
    };

    handleAuthRedirect();
  }, [session, status, router, pathname]);

  // Show loading state while checking authentication
  if (isLoading && status !== 'unauthenticated') {
    return (
      <div className="flex justify-center items-center h-60">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  // If user is not authenticated or we've determined they should stay on this page, show children
  return <>{children}</>;
}
