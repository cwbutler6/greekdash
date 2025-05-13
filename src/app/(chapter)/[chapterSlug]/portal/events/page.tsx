// Using relative import for the client component
import PortalEventsClient from "./events-client";
import { requireChapterAccess } from "@/lib/auth";

interface PageProps {
  params: Promise<{
    chapterSlug: string;
  }>;
}

// Server component for Next.js 15 App Router
export default async function PortalEventsPage({ params }: PageProps) {
  // Next.js 15: params is a Promise that needs to be awaited
  const { chapterSlug } = await params;
  
  // This will redirect if user isn't authenticated or doesn't have access to this chapter
  await requireChapterAccess(chapterSlug);
  
  return <PortalEventsClient chapterSlug={chapterSlug} />;
}
