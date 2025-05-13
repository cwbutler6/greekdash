import { EventFormClient } from "@/app/(chapter-admin)/[chapterSlug]/admin/events/components/event-form-client";

interface PageProps {
  params: Promise<{
    chapterSlug: string;
  }>;
}

// Server component for Next.js 15 App Router
export default async function CreateEventPage({ params }: PageProps) {
  // Next.js 15: params is a Promise that needs to be awaited
  const { chapterSlug } = await params;
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Create New Event</h1>
      <p className="text-muted-foreground">
        Fill in the details below to create a new event for your chapter
      </p>
      
      <EventFormClient 
        chapterSlug={chapterSlug} 
        mode="create"
      />
    </div>
  );
}
