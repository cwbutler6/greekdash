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
    // to dashboard if they have other chapters, or to home if none
    if (user.memberships.length > 0) {
      redirect(`/dashboard/${user.memberships[0].chapterSlug}`);
    } else {
      redirect("/");
    }
  }

  // Get the membership from the session
  const sessionMembership = user.memberships.find((m) => m.chapterSlug === chapterSlug);
  
  if (!sessionMembership) {
    redirect('/');
  }
  
  // Fetch the full membership details from the database
  const prisma = (await import('@/lib/prisma')).default;
  const fullMembership = await prisma.membership.findUnique({
    where: {
      id: sessionMembership.id
    }
  });
  
  if (!fullMembership) {
    redirect('/');
  }

  // Return both user and the full membership for convenience
  return {
    user,
    membership: fullMembership,
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
