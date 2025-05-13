import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-options";
import prisma from "@/lib/prisma";

// GET: Retrieve the current user's memberships across all chapters
export async function GET() {
  try {
    // Get the user's session
    const session = await getServerSession(authOptions);

    // If user is not authenticated, return 401
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Get the user's memberships with chapter details
    const memberships = await prisma.membership.findMany({
      where: { 
        userId: session.user.id 
      },
      include: {
        chapter: {
          select: {
            id: true,
            name: true,
            slug: true,
          }
        }
      },
      orderBy: {
        // Sort by role (to prioritize admin/owner roles) and then creation date
        role: 'asc',
        createdAt: 'desc'
      }
    });

    // Format the memberships for the client
    const formattedMemberships = memberships.map(membership => ({
      id: membership.id,
      role: membership.role,
      chapterId: membership.chapterId,
      chapterSlug: membership.chapter.slug,
      chapterName: membership.chapter.name,
    }));

    return NextResponse.json({ memberships: formattedMemberships });
  } catch (error) {
    console.error("Error fetching user memberships:", error);
    return NextResponse.json(
      { message: "An error occurred while retrieving user memberships" },
      { status: 500 }
    );
  }
}
