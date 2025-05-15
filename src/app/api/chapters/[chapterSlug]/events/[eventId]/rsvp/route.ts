import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireChapterAccess } from "@/lib/auth";
import { RSVPStatus } from "@/generated/prisma";

// POST handler - create or update an RSVP for an event
export async function POST(
  request: Request,
  { params }: { params: Promise<{ chapterSlug: string; eventId: string }> }
) {
  try {
    // In Next.js 15, params is a Promise that needs to be awaited
    const { chapterSlug, eventId } = await params;
    
    // Authenticate user and check chapter access
    const { user } = await requireChapterAccess(chapterSlug);

    // Parse the request body
    const data = await request.json();
    
    // Validate RSVP status
    if (!data.status || !Object.values(RSVPStatus).includes(data.status)) {
      return NextResponse.json(
        { error: "Invalid RSVP status" },
        { status: 400 }
      );
    }

    // Get chapter ID from slug for validation
    const chapter = await prisma.chapter.findUnique({
      where: { slug: chapterSlug },
      select: { id: true }
    });

    if (!chapter) {
      return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
    }

    // Check if event exists and belongs to this chapter
    const event = await prisma.event.findUnique({
      where: {
        id: eventId,
        chapterId: chapter.id
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Check if event has capacity limits for "GOING" RSVPs
    if (data.status === "GOING" && event.capacity !== null) {
      // Count current "GOING" RSVPs
      const goingCount = await prisma.eventRSVP.count({
        where: {
          eventId,
          status: "GOING",
        },
      });

      // Check if the event has reached capacity
      if (goingCount >= event.capacity) {
        // Check if the user already has a "GOING" RSVP (they're updating to "GOING" again)
        const existingRsvp = await prisma.eventRSVP.findUnique({
          where: {
            userId_eventId: {
              userId: user.id,
              eventId,
            },
          },
        });

        // If they don't already have a "GOING" RSVP, the event is full
        if (!existingRsvp || existingRsvp.status !== "GOING") {
          return NextResponse.json(
            { error: "Event has reached capacity" },
            { status: 400 }
          );
        }
      }
    }

    // Create or update the RSVP
    const rsvp = await prisma.eventRSVP.upsert({
      where: {
        userId_eventId: {
          userId: user.id,
          eventId,
        },
      },
      update: {
        status: data.status,
      },
      create: {
        status: data.status,
        userId: user.id,
        eventId,
      },
    });

    return NextResponse.json({ rsvp }, { status: 200 });
  } catch (error) {
    console.error("Error updating RSVP:", error);
    return NextResponse.json(
      { error: "Failed to update RSVP" },
      { status: 500 }
    );
  }
}

// GET handler - get all RSVPs for an event
export async function GET(
  request: Request,
  { params }: { params: Promise<{ chapterSlug: string; eventId: string }> }
) {
  try {
    // In Next.js 15, params is a Promise that needs to be awaited
    const { chapterSlug, eventId } = await params;
    
    // Authenticate user and check chapter access
    await requireChapterAccess(chapterSlug);

    // Get chapter ID from slug for validation
    const chapter = await prisma.chapter.findUnique({
      where: { slug: chapterSlug },
      select: { id: true }
    });

    if (!chapter) {
      return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
    }

    // Check if event exists and belongs to this chapter
    const event = await prisma.event.findUnique({
      where: {
        id: eventId,
        chapterId: chapter.id
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Parse URL search params for filtering
    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get('status');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit') as string) : 50;
    const page = searchParams.get('page') ? parseInt(searchParams.get('page') as string) : 1;
    const skip = (page - 1) * limit;

    // Build filters
    const filters: {
      eventId: string;
      status?: RSVPStatus;
      userId?: string;
    } = {
      eventId,
    };

    // Only add status filter if it's a valid RSVPStatus value
    if (statusParam && ['GOING', 'NOT_GOING', 'MAYBE'].includes(statusParam)) {
      filters.status = statusParam as RSVPStatus;
    }

    // Get RSVPs with pagination
    const rsvps = await prisma.eventRSVP.findMany({
      where: filters,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
    });

    // Count total RSVPs for pagination
    const totalRsvps = await prisma.eventRSVP.count({
      where: filters,
    });

    // Group RSVPs by status for stats
    const rsvpCounts = await prisma.eventRSVP.groupBy({
      by: ['status'],
      where: {
        eventId,
      },
      _count: {
        status: true,
      },
    });

    // Format counts
    const counts = {
      going: 0,
      notGoing: 0,
      maybe: 0,
    };

    rsvpCounts.forEach((item: { status: RSVPStatus; _count: { status: number } }) => {
      if (item.status === 'GOING') counts.going = item._count.status;
      if (item.status === 'NOT_GOING') counts.notGoing = item._count.status;
      if (item.status === 'MAYBE') counts.maybe = item._count.status;
    });

    return NextResponse.json({
      rsvps,
      counts,
      pagination: {
        total: totalRsvps,
        pages: Math.ceil(totalRsvps / limit),
        page,
        limit,
      },
    });
  } catch (error) {
    console.error("Error fetching RSVPs:", error);
    return NextResponse.json(
      { error: "Failed to fetch RSVPs" },
      { status: 500 }
    );
  }
}

// DELETE handler - delete a user's RSVP
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ chapterSlug: string; eventId: string }> }
) {
  try {
    // In Next.js 15, params is a Promise that needs to be awaited
    const { chapterSlug, eventId } = await params;
    
    // Authenticate user and check chapter access
    const { user } = await requireChapterAccess(chapterSlug);

    // Get chapter ID from slug for validation
    const chapter = await prisma.chapter.findUnique({
      where: { slug: chapterSlug },
      select: { id: true }
    });

    if (!chapter) {
      return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
    }

    // Check if event exists and belongs to this chapter
    const event = await prisma.event.findUnique({
      where: {
        id: eventId,
        chapterId: chapter.id
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Delete the RSVP
    await prisma.eventRSVP.delete({
      where: {
        userId_eventId: {
          userId: user.id,
          eventId,
        },
      },
    });

    return NextResponse.json({ 
      message: "RSVP removed successfully" 
    }, { status: 200 });
  } catch (error) {
    console.error("Error deleting RSVP:", error);
    return NextResponse.json(
      { error: "Failed to delete RSVP" },
      { status: 500 }
    );
  }
}
