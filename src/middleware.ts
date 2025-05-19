import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { NextRequestWithAuth, withAuth } from "next-auth/middleware";

// This middleware handles chapter-based routing and authentication
// IMPORTANT: Don't use Prisma or direct database access in Edge Middleware
export default withAuth(
  async function middleware(request: NextRequestWithAuth) {
    const token = await getToken({ req: request });
    const isAuthenticated = !!token;
    
    // Get the pathname from the URL
    const { pathname } = request.nextUrl;

    // Allow public routes
    // Check if the path is just a chapterSlug (e.g., /alpha-beta-gamma) - this should be public
    const isChapterPublicPage = /^\/[a-zA-Z0-9-]+$/.test(pathname) && !pathname.startsWith("/api/");
    
    const isPublicRoute = 
      pathname === "/" || 
      pathname === "/login" || 
      pathname === "/signup" || 
      pathname === "/forgot-password" ||
      pathname === "/reset-password" ||
      pathname === "/api/auth" ||
      isChapterPublicPage;
    
    if (!isAuthenticated && !isPublicRoute) {
      // Redirect to login if trying to access protected route without authentication
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // Extract chapterSlug from URL for any chapter-specific routes
    const chapterRouteRegex = /^\/([a-zA-Z0-9-]+)\/(admin|portal|join|pending)/;
    
    let chapterSlugFromUrl: string | null = null;
    
    // Check if path matches a chapter-specific route pattern (e.g., /theta-iota/admin)
    const chapterRouteMatch = pathname.match(chapterRouteRegex);
    if (chapterRouteMatch && chapterRouteMatch[1]) {
      chapterSlugFromUrl = chapterRouteMatch[1];
    }
    
    // If we have a chapter slug in the URL, verify user belongs to that chapter
    // All membership data should be included in the JWT token
    if (chapterSlugFromUrl && isAuthenticated && token.memberships) {
      // Check access using the memberships data from the token
      // No database queries here - only use data from JWT token
      const hasAccess = token.memberships.some(
        (m: { chapterSlug: string }) => m.chapterSlug === chapterSlugFromUrl
      );
      
      if (!hasAccess) {
        // If user doesn't have access to this specific chapter, redirect to their first available chapter
        if (token.memberships.length > 0) {
          const availableChapter = token.memberships[0].chapterSlug;
          // Maintain the same section (admin/portal) they were trying to access
          const section = chapterRouteMatch ? chapterRouteMatch[2] : 'admin';
          return NextResponse.redirect(new URL(`/${availableChapter}/${section}`, request.url));
        } else {
          // If user has no memberships, redirect to signup
          return NextResponse.redirect(new URL("/signup", request.url));
        }
      }
    }
    
    // We're removing the automatic redirect from the home page
    // to allow all users to access it, even when authenticated
    // Uncomment these lines if you want to redirect authenticated users away from the homepage
    /*
    if (pathname === '/' && isAuthenticated && token.memberships && token.memberships.length > 0) {
      const membership = token.memberships[0];
      const redirectPath = membership.role === 'ADMIN' || membership.role === 'OWNER' 
        ? `/${membership.chapterSlug}/admin`
        : `/${membership.chapterSlug}/portal`;
      
      return NextResponse.redirect(new URL(redirectPath, request.url));
    }
    */

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: () => {
        // This function is only used to check if user is authenticated
        // Actual authorization logic is in the middleware function above
        return true;
      },
    },
  }
);

// Configure which paths require authentication
export const config = {
  matcher: [
    // Match all paths that require authentication
    "/:chapterSlug/admin/:path*",
    "/:chapterSlug/portal/:path*",
    "/:chapterSlug/join/:path*", // Join workflow is protected
    "/:chapterSlug/pending/:path*", // Pending approval workflow is protected
    "/settings/:path*",
    
    // Skip authentication check for API routes, public routes, and static files
    // Note: We explicitly exclude the base chapterSlug route (e.g., /alpha-beta-gamma)
    // as these are public chapter pages accessible without authentication
    "/((?!login|signup|forgot-password|reset-password|api/auth|api/chapters/check-slug|api/contact|_next/static|_next/image|images|favicon.ico|[a-zA-Z0-9-]+$).*)",
  ],
};
