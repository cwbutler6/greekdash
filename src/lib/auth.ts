import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { redirect } from "next/navigation";

// Re-export authOptions for use in API routes
export { authOptions };

// Get session on the server side
export async function getSession() {
  return await getServerSession(authOptions);
}

// Get current user on the server side
export async function getCurrentUser() {
  const session = await getSession();
  
  return session?.user;
}

// Check if user is authenticated - use in server components
export async function requireAuth() {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect("/login");
  }

  return user;
}

// Check if user has access to a specific chapter - use in server components
export async function requireChapterAccess(chapterSlug: string) {
  const user = await requireAuth();
  
  // Check if user has access to this chapter
  const hasAccess = user.memberships.some((m) => m.chapterSlug === chapterSlug);
  
  if (!hasAccess) {
    // If user doesn't have access to this specific chapter, redirect
    // to their appropriate chapter/role page or home if none
    if (user.memberships.length > 0) {
      const membership = user.memberships[0];
      // Direct user to admin or portal based on their role
      const redirectPath = membership.role === 'ADMIN' || membership.role === 'OWNER'
        ? `/${membership.chapterSlug}/admin`
        : `/${membership.chapterSlug}/portal`;
      redirect(redirectPath);
    } else {
      redirect("/");
    }
  }

  // Get the membership from the session
  const sessionMembership = user.memberships.find((m) => m.chapterSlug === chapterSlug);
  
  if (!sessionMembership) {
    redirect('/');
  }
  
  // Return both user and the membership for convenience
  // We'll use the session membership data directly instead of making a database query
  // This avoids database connection issues in server components
  return {
    user,
    membership: {
      id: sessionMembership.id,
      role: sessionMembership.role,
      chapterId: sessionMembership.chapterId,
      userId: user.id,
      // Add any other required fields from the session data
    },
  };
}

// Get the current chapter context from route params
export function getChapterContext(params: { chapterSlug?: string }) {
  if (!params.chapterSlug) {
    throw new Error("Chapter slug is required");
  }
  
  return {
    chapterSlug: params.chapterSlug,
  };
}
