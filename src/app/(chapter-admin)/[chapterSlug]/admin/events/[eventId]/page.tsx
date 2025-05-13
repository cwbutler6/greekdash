import { EventDetailClient } from "./event-detail-client";

interface PageProps {
  params: Promise<{
    chapterSlug: string;
    eventId: string;
  }>;
}

// Server component for Next.js 15 App Router
export default async function EventDetailPage({ params }: PageProps) {
  // Next.js 15: params is a Promise that needs to be awaited
  const { chapterSlug, eventId } = await params;
  
  return <EventDetailClient chapterSlug={chapterSlug} eventId={eventId} />;
}
