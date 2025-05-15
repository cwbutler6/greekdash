import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { MembershipRole } from "@/generated/prisma";
import { requireChapterAccess } from "@/lib/auth";

// GET handler - get a specific event
export async function GET(
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

    // Get event details with RSVP count
    const event = await prisma.event.findUnique({
      where: { 
        id: eventId,
        chapterId: chapter.id // Ensure event belongs to this chapter for multi-tenant security
      },
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
            rsvps: true,
          },
        },
        // Include the current user's RSVP status if they have one
        rsvps: {
          where: {
            userId: user.id,
          },
          select: {
            id: true,
            status: true,
          },
        },
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Get the count of attendees by status
    const rsvpCounts = await prisma.eventRSVP.groupBy({
      by: ['status'],
      where: {
        eventId: eventId,
      },
      _count: {
        status: true,
      },
    });

    // Format RSVP counts
    const counts = {
      going: 0,
      notGoing: 0,
      maybe: 0,
    };

    rsvpCounts.forEach((item: { status: string; _count: { status: number } }) => {
      if (item.status === 'GOING') counts.going = item._count.status;
      if (item.status === 'NOT_GOING') counts.notGoing = item._count.status;
      if (item.status === 'MAYBE') counts.maybe = item._count.status;
    });

    // Get the user's RSVP status if they have one
    const userRsvp = event.rsvps.length > 0 ? event.rsvps[0] : null;
    
    // Clean up response data by only keeping what we need
    const eventData = {
      ...event,
      rsvps: undefined // Exclude rsvps from the response
    };

    return NextResponse.json({ 
      event: eventData, 
      rsvpCounts: counts,
      userRsvp,
    });
  } catch (error) {
    console.error("Error fetching event:", error);
    return NextResponse.json(
      { error: "Failed to fetch event" },
      { status: 500 }
    );
  }
}

// PATCH handler - update an event
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ chapterSlug: string; eventId: string }> }
) {
  try {
    // In Next.js 15, params is a Promise that needs to be awaited
    const { chapterSlug, eventId } = await params;
    
    // Authenticate user and check chapter access with admin privileges
    const { membership } = await requireChapterAccess(chapterSlug);
    
    // Only admin or owner can update events
    if (membership.role !== MembershipRole.ADMIN && membership.role !== MembershipRole.OWNER) {
      return NextResponse.json(
        { error: "You must be an admin to update events" },
        { status: 403 }
      );
    }

    // Parse the request body
    const data = await request.json();

    // Get chapter ID from slug for validation
    const chapter = await prisma.chapter.findUnique({
      where: { slug: chapterSlug },
      select: { id: true }
    });

    if (!chapter) {
      return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
    }

    // Check if event exists and belongs to this chapter
    const existingEvent = await prisma.event.findUnique({
      where: {
        id: eventId,
        chapterId: chapter.id
      },
    });

    if (!existingEvent) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Update the event
    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: {
        title: data.title !== undefined ? data.title : undefined,
        description: data.description !== undefined ? data.description : undefined,
        location: data.location !== undefined ? data.location : undefined,
        startDate: data.startDate !== undefined ? new Date(data.startDate) : undefined,
        endDate: data.endDate !== undefined ? new Date(data.endDate) : undefined,
        capacity: data.capacity !== undefined ? parseInt(data.capacity) : undefined,
        isPublic: data.isPublic !== undefined ? data.isPublic : undefined,
        status: data.status !== undefined ? data.status : undefined,
      },
    });

    return NextResponse.json({ event: updatedEvent });
  } catch (error) {
    console.error("Error updating event:", error);
    return NextResponse.json(
      { error: "Failed to update event" },
      { status: 500 }
    );
  }
}

// DELETE handler - delete an event
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ chapterSlug: string; eventId: string }> }
) {
  try {
    // In Next.js 15, params is a Promise that needs to be awaited
    const { chapterSlug, eventId } = await params;
    
    // Authenticate user and check chapter access with admin privileges
    const { membership } = await requireChapterAccess(chapterSlug);
    
    // Only admin or owner can delete events
    if (membership.role !== MembershipRole.ADMIN && membership.role !== MembershipRole.OWNER) {
      return NextResponse.json(
        { error: "You must be an admin to delete events" },
        { status: 403 }
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
    const existingEvent = await prisma.event.findUnique({
      where: {
        id: eventId,
        chapterId: chapter.id
      },
    });

    if (!existingEvent) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Delete the event (will also cascade delete RSVPs)
    await prisma.event.delete({
      where: { id: eventId },
    });

    return NextResponse.json({ 
      message: "Event deleted successfully" 
    }, { status: 200 });
  } catch (error) {
    console.error("Error deleting event:", error);
    return NextResponse.json(
      { error: "Failed to delete event" },
      { status: 500 }
    );
  }
}
