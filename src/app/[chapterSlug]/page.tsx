import { prisma } from '@/lib/db';
import { ChapterHeader } from '@/components/chapters/ChapterHeader';
import { EventsList } from '@/components/chapters/EventsList';
import { Gallery } from '@/components/chapters/Gallery';
import { ContactForm } from '@/components/chapters/ContactForm';
import { EventStatus } from '@/generated/prisma';
import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';

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
      title: `Start Your Chapter's Digital Journey | GreekDash`,
      description: 'GreekDash helps fraternity and sorority chapters streamline operations, manage members, and organize events with our easy-to-use platform.'
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
  
  // If chapter doesn't exist, show marketing content instead of 404
  if (!chapter) {
    return (
      <div className="container mx-auto py-12 px-4 max-w-6xl">
        <div className="flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1 space-y-6">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-primary">
              Streamline Your Chapter&apos;s Operations with GreekDash
            </h1>
            
            <p className="text-xl text-muted-foreground">
              The all-in-one platform designed for fraternity and sorority chapters.
              Manage members, organize events, handle finances, and more - all in one place.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button asChild size="lg" className="gap-2">
                <Link href="/signup">
                  Get Started
                </Link>
              </Button>
              
              <Button asChild variant="outline" size="lg">
                <Link href="/">
                  Learn More
                </Link>
              </Button>
            </div>
            
            <div className="pt-8 space-y-4">
              <h3 className="text-2xl font-semibold">Key Features</h3>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <li className="flex items-start gap-2">
                  <div className="rounded-full p-1 bg-primary/10 text-primary mt-1">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </div>
                  <span>Member Management</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="rounded-full p-1 bg-primary/10 text-primary mt-1">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </div>
                  <span>Event Planning</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="rounded-full p-1 bg-primary/10 text-primary mt-1">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </div>
                  <span>Financial Management</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="rounded-full p-1 bg-primary/10 text-primary mt-1">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </div>
                  <span>Communication Tools</span>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="flex-1">
            <div className="relative w-full aspect-video rounded-xl overflow-hidden shadow-xl">
              <Image 
                src="/dashboard-preview.png" 
                alt="GreekDash Dashboard" 
                fill
                className="object-cover"
                priority
              />
            </div>
          </div>
        </div>
      </div>
    );
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
