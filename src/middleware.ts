import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { NextRequestWithAuth, withAuth } from "next-auth/middleware";

// This middleware handles chapter-based routing and authentication
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

    // Check if user is accessing a chapter route
    if (pathname.startsWith("/dashboard")) {
      // Check if a chapterSlug is in the URL (e.g., /dashboard/somechapter/...)
      const pathParts = pathname.split("/");
      const chapterSlugFromUrl = pathParts.length > 2 ? pathParts[2] : null;
      
      if (chapterSlugFromUrl) {
        // If there's a chapterSlug in the URL, verify user belongs to that chapter
        if (isAuthenticated && token.memberships) {
          const hasAccess = token.memberships.some(
            (m: { chapterSlug: string }) => m.chapterSlug === chapterSlugFromUrl
          );
          
          if (!hasAccess) {
            // Redirect to home if user doesn't belong to this chapter
            return NextResponse.redirect(new URL("/dashboard", request.url));
          }
        }
      } else if (isAuthenticated && token.memberships && token.memberships.length > 0) {
        // If authenticated but no chapter in URL, redirect to first available chapter
        return NextResponse.redirect(
          new URL(`/dashboard/${token.memberships[0].chapterSlug}`, request.url)
        );
      }
    }

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
    "/dashboard/:path*",
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
