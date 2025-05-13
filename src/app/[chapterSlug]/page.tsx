import prisma from '@/lib/prisma';
import { ChapterHeader } from '@/components/chapters/ChapterHeader';
import { EventsList } from '@/components/chapters/EventsList';
import { Gallery } from '@/components/chapters/Gallery';
import { ContactForm } from '@/components/chapters/ContactForm';
import { EventStatus } from '@/generated/prisma';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';

export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ chapterSlug: string }> 
}): Promise<Metadata> {
  const { chapterSlug } = await params;
  
  // Get chapter details for metadata
  const chapter = await prisma.chapter.findUnique({
    where: { slug: chapterSlug },
    select: { name: true }
  });
  
  if (!chapter) {
    return {
      title: 'Chapter Not Found',
      description: 'The requested chapter does not exist.'
    };
  }
  
  return {
    title: chapter.name,
    description: `Welcome to the ${chapter.name} chapter page. Learn about our chapter, upcoming events, and get in touch with us.`
  };
}

export default async function PublicChapterPage({ 
  params 
}: { 
  params: Promise<{ chapterSlug: string }> 
}) {
  const { chapterSlug } = await params;
  
  // Get chapter details including public information
  const chapter = await prisma.chapter.findUnique({
    where: { slug: chapterSlug },
    select: {
      id: true,
      name: true,
      publicInfo: true
    }
  });
  
  if (!chapter) {
    notFound();
  }
  
  // Get upcoming public events for this chapter
  const upcomingEvents = await prisma.event.findMany({
    where: {
      chapterId: chapter.id,
      isPublic: true,
      status: EventStatus.UPCOMING,
      startDate: {
        gte: new Date()
      }
    },
    select: {
      id: true,
      title: true,
      description: true,
      location: true,
      startDate: true,
      endDate: true,
      status: true
    },
    orderBy: {
      startDate: 'asc'
    },
    take: 3 // Limit to the next 3 upcoming events
  });
  
  // Get gallery images for this chapter
  const galleryImages = await prisma.galleryImage.findMany({
    where: {
      chapterId: chapter.id
    },
    select: {
      id: true,
      url: true,
      caption: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  });
  
  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl space-y-8">
      <ChapterHeader chapter={chapter} />
      <EventsList events={upcomingEvents} />
      <Gallery images={galleryImages} />
      <ContactForm chapterSlug={chapterSlug} />
    </div>
  );
}
