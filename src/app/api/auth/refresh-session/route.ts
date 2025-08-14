import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getToken } from 'next-auth/jwt';
import { encode } from 'next-auth/jwt';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const callbackUrl = searchParams.get('callbackUrl') || '/';
  
  try {
    // Get the current session to verify user is authenticated
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Get the current JWT token
    const token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET 
    });
    
    if (token && authOptions.callbacks?.jwt) {
      // Force a fresh JWT token generation by calling the jwt callback
      // This will fetch the latest membership data from the database
      const refreshedToken = await authOptions.callbacks.jwt({ 
        token, 
        user: { id: session.user.id }, 
        account: null, 
        profile: undefined,
        isNewUser: false,
        trigger: 'update'
      });
      
      if (refreshedToken) {
        // Create a new JWT with the refreshed data
        const newJwt = await encode({
          token: refreshedToken,
          secret: process.env.NEXTAUTH_SECRET!,
          maxAge: 30 * 24 * 60 * 60 // 30 days
        });
        
        // Set the new JWT as a cookie
        const response = NextResponse.redirect(new URL(callbackUrl, request.url));
        
        // Set the session token cookie with the new JWT
        const cookieName = process.env.NODE_ENV === 'production' 
          ? '__Secure-next-auth.session-token' 
          : 'next-auth.session-token';
          
        response.cookies.set(cookieName, newJwt, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 30 * 24 * 60 * 60,
          path: '/'
        });
        
        console.log('Session refreshed successfully, redirecting to:', callbackUrl);
        return response;
      }
    }
    
    // Fallback: redirect without token refresh
    console.log('Token refresh failed, redirecting anyway to:', callbackUrl);
    return NextResponse.redirect(new URL(callbackUrl, request.url));
    
  } catch (error) {
    console.error('Error refreshing session:', error);
    return NextResponse.redirect(new URL('/login', request.url));
  }
}