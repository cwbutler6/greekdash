import { SettingsClient } from "./index";

interface PageProps {
  params: Promise<{
    chapterSlug: string;
  }>;
}

// Server component for Next.js 15 App Router
export default async function Page({ params }: PageProps) {
  // Next.js 15: params is a Promise that needs to be awaited
  const { chapterSlug } = await params;
  
  return <SettingsClient chapterSlug={chapterSlug} />;
}
