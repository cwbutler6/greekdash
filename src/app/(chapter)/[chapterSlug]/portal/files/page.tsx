import { getServerSession } from 'next-auth';
import { PlanType } from '@/generated/prisma';
import { authOptions } from '@/lib/auth';
import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getStorageLimit } from '@/lib/storage-limits';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info } from 'lucide-react';
import { formatBytes } from '@/lib/utils/formatters';

import { FileUploadButton } from '@/components/files/FileUploadButton';
import { FileList } from '@/components/files/FileList';

export default async function FilesPage({
  params,
}: {
  params: Promise<{ chapterSlug: string }>
}) {
  const { chapterSlug } = await params;
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect(`/${chapterSlug}/login?callbackUrl=/${chapterSlug}/portal/files`);
  }
  
  // Get chapter details
  const chapter = await prisma.chapter.findUnique({
    where: { slug: chapterSlug },
    include: {
      subscription: true,
    },
  });
  
  if (!chapter) {
    notFound();
  }
  
  // Check user membership
  const membership = await prisma.membership.findFirst({
    where: {
      userId: session.user.id,
      chapterId: chapter.id,
    },
  });
  
  if (!membership) {
    redirect(`/${chapterSlug}/join`);
  }
  
  // Get storage usage
  const storageUsage = await prisma.file.aggregate({
    where: { chapterId: chapter.id },
    _sum: { size: true },
  });
  
  const usedStorage = storageUsage._sum.size || 0;
  const planType = chapter.subscription?.plan || PlanType.FREE;
  const storageLimit = getStorageLimit(planType);
  const usagePercentage = Math.min(100, Math.round((usedStorage / storageLimit) * 100));
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Files</h1>
        <p className="text-muted-foreground mt-2">
          Upload and share files with your chapter members
        </p>
      </div>
      
      <Separator />
      
      <div className="grid gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Storage Usage</CardTitle>
            <CardDescription>
              {formatBytes(usedStorage)} used of {formatBytes(storageLimit)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
              <div 
                className={`h-full ${usagePercentage > 90 ? 'bg-destructive' : 'bg-primary'}`}
                style={{ width: `${usagePercentage}%` }}
              />
            </div>
            
            {usagePercentage > 90 && (
              <Alert className="mt-4">
                <Info className="h-4 w-4" />
                <AlertTitle>Storage almost full</AlertTitle>
                <AlertDescription>
                  {planType !== PlanType.PRO ? (
                    <>
                      Consider upgrading your subscription plan for more storage space.
                      <a href={`/${chapterSlug}/admin/upgrade`} className="underline ml-1">
                        Upgrade now
                      </a>
                    </>
                  ) : (
                    <>
                      You&apos;re approaching your storage limit. Consider deleting unused files.
                    </>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Upload Files</CardTitle>
            <CardDescription>
              Upload files to share with your chapter (max 10MB per file)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FileUploadButton chapterSlug={chapterSlug} />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="space-y-1">
              <CardTitle>Chapter Files</CardTitle>
              <CardDescription>
                Files uploaded by you and other chapter members
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <FileList chapterSlug={chapterSlug} userId={session.user.id} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
