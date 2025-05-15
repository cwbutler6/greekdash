import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { logAuditEntry } from '@/lib/audit';

// This is an example of how to integrate audit logging in an API route
// You can follow this pattern in other API routes throughout the application

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ chapterSlug: string }> }
) {
  try {
    const { chapterSlug } = await params;
    
    // Get current user
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get chapter from slug
    const chapter = await prisma.chapter.findUnique({
      where: { slug: chapterSlug },
    });
    
    if (!chapter) {
      return NextResponse.json({ error: 'Chapter not found' }, { status: 404 });
    }
    
    // Check if user has access to this chapter (verify membership)
    const membership = await prisma.membership.findUnique({
      where: {
        userId_chapterId: {
          userId: currentUser.id,
          chapterId: chapter.id,
        },
      },
    });
    
    if (!membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    // Parse request body
    const data = await request.json();
    
    // Perform your API action here
    // For example, creating a new event
    const newEvent = await prisma.event.create({
      data: {
        title: data.title,
        description: data.description,
        location: data.location,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        capacity: data.capacity,
        isPublic: data.isPublic,
        chapterId: chapter.id,
        createdById: currentUser.id,
      },
    });
    
    // Log the audit entry for the event creation
    await logAuditEntry({
      userId: currentUser.id,
      chapterId: chapter.id,
      action: 'event.created',
      targetType: 'event',
      targetId: newEvent.id,
      metadata: {
        eventTitle: newEvent.title,
        eventLocation: newEvent.location,
        eventStartDate: newEvent.startDate.toISOString(),
        eventEndDate: newEvent.endDate.toISOString(),
      },
    });
    
    return NextResponse.json({ success: true, event: newEvent });
  } catch (error) {
    console.error('Error in API route:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
