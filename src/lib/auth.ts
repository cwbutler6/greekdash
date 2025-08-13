import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";

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
    throw new Error("REDIRECT"); // This ensures the function throws after redirect
  }

  return user;
}

// Check if user has access to a specific chapter - use in server components
export async function requireChapterAccess(chapterSlug: string) {
  const user = await requireAuth();
  
  // Handle case where user.memberships might be undefined or not an array
  if (!user.memberships || !Array.isArray(user.memberships)) {
    redirect("/");
    throw new Error("REDIRECT");
  }
  
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
      throw new Error("REDIRECT");
    } else {
      redirect("/");
      throw new Error("REDIRECT");
    }
  }

  // Get the membership from the session
  const sessionMembership = user.memberships.find((m) => m.chapterSlug === chapterSlug);
  
  if (!sessionMembership) {
    redirect('/');
    throw new Error("REDIRECT");
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
      chapterSlug: sessionMembership.chapterSlug,
      userId: user.id,
      // Add any other required fields from the session data
    },
  };
}

// Check if user has admin access to a specific chapter - use in server components
export async function requireChapterAdmin(chapterSlug: string) {
  const user = await requireAuth();
  
  // Check if chapter exists first, before doing access checks
  const chapter = await prisma.chapter.findUnique({
    where: { slug: chapterSlug },
  });
  
  if (!chapter) {
    redirect('/');
    throw new Error("REDIRECT");
  }
  
  // Now check chapter access
  const { membership } = await requireChapterAccess(chapterSlug);
  
  // Check if user has admin or owner role for this chapter
  if (membership.role !== 'ADMIN' && membership.role !== 'OWNER') {
    redirect(`/${chapterSlug}/portal`);
    throw new Error("REDIRECT");
  }
  
  return { user, membership, chapter };
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
