import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireChapterAdmin } from "@/lib/auth";
import { withApiLogging } from "@/lib/api-logger";

// API route to get all members of a chapter
export const GET = withApiLogging(async (
  request: Request,
  { params }: { params: Promise<{ chapterSlug: string }> }
) => {
  const { chapterSlug } = await params;
  const url = new URL(request.url);
  const includeInactive = url.searchParams.get('includeInactive') === 'true';
  
  // Check if user has admin access to the chapter
  await requireChapterAdmin(chapterSlug);

  // Get all members of the chapter
  const members = await prisma.membership.findMany({
    where: {
      chapter: { slug: chapterSlug },
      ...(includeInactive ? {} : { isActive: true }),
    },
    include: {
      user: true,
      profile: true,
      deactivatedByUser: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: [
      { isActive: 'desc' }, // Active members first
      { user: { name: 'asc' } },
    ],
  });

  return NextResponse.json({ members });
}, 'chapters/[chapterSlug]/members');
