import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { prisma } from "@/lib/db";
import { MembershipRole, Prisma, EventStatus } from "@/generated/prisma";
import { requireChapterAccess, authOptions } from "@/lib/auth";

// GET handler - get all events for a chapter
export async function GET(
  request: Request,
  { params }: { params: Promise<{ chapterSlug: string }> }
) {
  try {
    // In Next.js 15, params is a Promise that needs to be awaited
    const { chapterSlug } = await params;
    
    // Check if authenticated with try/catch to provide better error handling
    let session;
    try {
      session = await getServerSession(authOptions);
      if (!session?.user) {
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
      }
    } catch (authError) {
      console.error("Authentication error:", authError);
      return NextResponse.json({ error: "Authentication failed" }, { status: 401 });
    }

    // Get chapter ID from slug
    let chapter;
    try {
      chapter = await prisma.chapter.findUnique({
        where: { slug: chapterSlug },
        select: { id: true }
      });

      if (!chapter) {
        return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
      }
    } catch (chapterError) {
      console.error("Chapter lookup error:", chapterError);
      return NextResponse.json({ error: "Failed to find chapter" }, { status: 500 });
    }

    // Parse URL search params
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit') as string) : 50;
    const page = searchParams.get('page') ? parseInt(searchParams.get('page') as string) : 1;
    const skip = (page - 1) * limit;

    // Build query filters
    const filters: Prisma.EventWhereInput = {
      chapterId: chapter.id,
    };

    if (status) {
      // Only add valid status values
      const validStatuses = ['UPCOMING', 'ONGOING', 'COMPLETED', 'CANCELED'];
      if (validStatuses.includes(status)) {
        filters.status = status as EventStatus;
      }
    }

    // Fetch events with pagination in a try/catch block
    let events;
    let totalEvents;
    try {
      // Execute queries in parallel for better performance
      [events, totalEvents] = await Promise.all([
        prisma.event.findMany({
          where: filters,
          include: {
            createdBy: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
            _count: {
              select: {
                rsvps: {
                  where: {
                    status: "GOING",
                  },
                },
              },
            },
          },
          orderBy: {
            startDate: 'asc',
          },
          skip,
          take: limit,
        }),
        prisma.event.count({
          where: filters,
        })
      ]);
    } catch (dbError) {
      console.error("Database query error:", dbError);
      return NextResponse.json(
        { error: "Failed to fetch events from database" },
        { status: 500 }
      );
    }

    // Return the successfully fetched events
    return NextResponse.json({
      events,
      pagination: {
        total: totalEvents,
        pages: Math.ceil(totalEvents / limit),
        page,
        limit,
      },
    });
  } catch (error) {
    // Detailed error logging for uncaught errors
    console.error("Uncaught error in events API:", error);
    
    // Return a more specific error message based on the error type
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch events";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

// POST handler - create a new event
export async function POST(
  request: Request,
  { params }: { params: Promise<{ chapterSlug: string }> }
) {
  try {
    // In Next.js 15, params is a Promise that needs to be awaited
    const { chapterSlug } = await params;
    
    // Get the authenticated user and validate chapter access
    const { user, membership } = await requireChapterAccess(chapterSlug);
    
    // Check if user has admin or owner role required to create events
    if (membership.role !== MembershipRole.ADMIN && membership.role !== MembershipRole.OWNER) {
      return NextResponse.json(
        { error: "You must be an admin to create events" },
        { status: 403 }
      );
    }

    // Parse the request body
    const data = await request.json();
    
    // Validate required fields
    if (!data.title || !data.startDate || !data.endDate || !data.location) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get chapter ID from slug
    const chapter = await prisma.chapter.findUnique({
      where: { slug: chapterSlug },
      select: { id: true }
    });

    if (!chapter) {
      return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
    }

    // Create the event
    const event = await prisma.event.create({
      data: {
        title: data.title,
        description: data.description || "",
        location: data.location,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        capacity: data.capacity ? parseInt(data.capacity) : null,
        isPublic: data.isPublic !== undefined ? data.isPublic : true,
        chapterId: chapter.id,
        createdById: user.id,
      },
    });

    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    console.error("Error creating event:", error);
    return NextResponse.json(
      { error: "Failed to create event" },
      { status: 500 }
    );
  }
}
