import { EventFormClient } from "../../components/event-form-client";

interface PageProps {
  params: Promise<{
    chapterSlug: string;
    eventId: string;
  }>;
}

// Server component for Next.js 15 App Router
export default async function EditEventPage({ params }: PageProps) {
  // Next.js 15: params is a Promise that needs to be awaited
  const { chapterSlug, eventId } = await params;
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Edit Event</h1>
      <p className="text-muted-foreground">
        Update the details of your event
      </p>
      
      <EventFormClient 
        chapterSlug={chapterSlug} 
        mode="edit"
        eventId={eventId}
      />
    </div>
  );
}
