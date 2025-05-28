import { Metadata } from 'next';
import { requireChapterAccess } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { MemberSearch } from '@/components/members/member-search';

export const metadata: Metadata = {
  title: 'Member Directory',
  description: 'Search and communicate with members of your chapter',
};

export default async function MembersPage({
  params,
}: {
  params: Promise<{ chapterSlug: string }>
}) {
  const { chapterSlug } = await params;
  
  // This will redirect if user isn't authenticated or doesn't have access to this chapter
  await requireChapterAccess(chapterSlug);
  
  // Get chapter details
  const chapter = await prisma.chapter.findUnique({
    where: {
      slug: chapterSlug,
    },
  });
  
  if (!chapter) {
    throw new Error('Chapter not found');
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Chapter Directory</h1>
        <p className="text-muted-foreground">
          Search for and communicate with other members of {chapter.name}
        </p>
      </div>

      <div className="bg-card rounded-lg border shadow-sm p-6">
        <MemberSearch chapterSlug={chapterSlug} />
      </div>
    </div>
  );
}
