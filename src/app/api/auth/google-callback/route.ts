import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

/**
 * Custom handler for Google OAuth callback to ensure proper redirection
 * This API route handles redirection after Google authentication
 */
export async function GET(request: Request) {
  try {
    // Get the authenticated session
    const session = await getSession();
    
    // If no session is found, redirect to login
    if (!session || !session.user) {
      console.log('Google callback: No session found, redirecting to login');
      return NextResponse.redirect(new URL('/login', request.url));
    }
    
    console.log('Google callback: Processing session', { 
      userId: session.user.id,
      isNewUser: session.user.isNewUser,
      membershipCount: session.user.memberships?.length || 0
    });

    // Check if this is a new user who needs to create a chapter
    if (session.user.isNewUser) {
      console.log('Google callback: New Google user detected, redirecting to signup');
      return NextResponse.redirect(new URL('/signup?google=true', request.url));
    }

    // Get memberships from session
    const memberships = session.user.memberships || [];
    
    // If user has no memberships, redirect to signup
    if (memberships.length === 0) {
      console.log('Google callback: User has no memberships, redirecting to signup');
      return NextResponse.redirect(new URL('/signup', request.url));
    }
    
    // Find the first active (non-pending) membership
    const activeMembership = memberships.find(
      (m: { role: string }) => m.role !== 'PENDING_MEMBER'
    );
    
    if (activeMembership) {
      // If user has an active membership and is an admin/owner, redirect to admin
      if (activeMembership.role === 'ADMIN' || activeMembership.role === 'OWNER') {
        const redirectUrl = `/${activeMembership.chapterSlug}/admin`;
        console.log(`Google callback: Redirecting admin to ${redirectUrl}`);
        return NextResponse.redirect(new URL(redirectUrl, request.url));
      } else {
        // Regular members go to the portal
        const redirectUrl = `/${activeMembership.chapterSlug}/portal`;
        console.log(`Google callback: Redirecting member to ${redirectUrl}`);
        return NextResponse.redirect(new URL(redirectUrl, request.url));
      }
    } else if (memberships.length > 0) {
      // If user only has pending memberships, redirect to their pending page
      const redirectUrl = `/${memberships[0].chapterSlug}/pending`;
      console.log(`Google callback: Redirecting pending member to ${redirectUrl}`);
      return NextResponse.redirect(new URL(redirectUrl, request.url));
    }
    
    // Fallback to signup if no clear path is determined
    return NextResponse.redirect(new URL('/signup', request.url));
  } catch (error) {
    console.error('Error in Google callback handler:', error);
    // Fallback to login in case of any errors
    return NextResponse.redirect(new URL('/login', request.url));
  }
}
