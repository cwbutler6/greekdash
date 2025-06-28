import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { MembershipRole } from '@/generated/prisma';
import { redirect } from 'next/navigation';
import GalleryClient from './gallery-client';

interface GalleryPageProps {
  params: Promise<{ chapterSlug: string }>;
}

export default async function GalleryPage({ params }: GalleryPageProps) {
  const { chapterSlug } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/auth/signin');
  }

  // Find chapter by slug
  const chapter = await prisma.chapter.findUnique({
    where: { slug: chapterSlug },
  });

  if (!chapter) {
    redirect('/dashboard');
  }

  // Check membership and admin permissions
  const membership = await prisma.membership.findFirst({
    where: {
      userId: session.user.id,
      chapterId: chapter.id,
    },
  });

  if (!membership || (membership.role !== MembershipRole.ADMIN && membership.role !== MembershipRole.OWNER)) {
    redirect(`/${chapterSlug}/portal`);
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Gallery Management</h1>
        <p className="text-muted-foreground mt-2">
          Upload and manage images for your chapter&apos;s public gallery.
        </p>
      </div>
      <GalleryClient chapterSlug={chapterSlug} />
    </div>
  );
}