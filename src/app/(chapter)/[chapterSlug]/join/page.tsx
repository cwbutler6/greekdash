import JoinForm from './join-form';

interface PageProps {
  params: Promise<{
    chapterSlug: string;
  }>;
}

// Server component for Next.js 15 App Router
export default async function Page({ params }: PageProps) {
  // Next.js 15: params is a Promise that needs to be awaited
  const { chapterSlug } = await params;
  
  // Pass the chapter slug to the client component
  return <JoinForm chapterSlug={chapterSlug} />;
}
