import { getServerSession } from 'next-auth';
import { PlanType, MembershipRole } from '@/generated/prisma';
import { authOptions } from '@/lib/auth';
import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getStorageLimit } from '@/lib/storage-limits';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { formatBytes } from '@/lib/utils/formatters';
import { FileUploadButton } from '@/components/files/FileUploadButton';
import { AdminFileList } from '@/components/files/AdminFileList';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default async function AdminFilesPage({
  params,
}: {
  params: Promise<{ chapterSlug: string }>
}) {
  const { chapterSlug } = await params;
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect(`/${chapterSlug}/login?callbackUrl=/${chapterSlug}/admin/files`);
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
  
  // Check if user is admin of this chapter
  const membership = await prisma.membership.findFirst({
    where: {
      userId: session.user.id,
      chapterId: chapter.id,
      role: {
        in: [MembershipRole.ADMIN, MembershipRole.OWNER],
      },
    },
  });
  
  if (!membership) {
    redirect(`/${chapterSlug}/portal`);
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
  
  // Get recent upload activity
  const recentUploads = await prisma.file.findMany({
    where: { chapterId: chapter.id },
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: {
      uploader: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  // Get user upload stats
  const userStats = await prisma.$queryRaw`
    SELECT 
      u."id", 
      u."name", 
      COUNT(f."id") as "fileCount",
      SUM(f."size") as "totalSize"
    FROM "User" u
    JOIN "File" f ON u."id" = f."uploaderId"
    WHERE f."chapterId" = ${chapter.id}
    GROUP BY u."id", u."name"
    ORDER BY "totalSize" DESC
    LIMIT 10
  `;
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">File Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage chapter files and storage
          </p>
        </div>
        
        <Button asChild>
          <Link href={`/${chapterSlug}/portal/files`}>
            Member File View
          </Link>
        </Button>
      </div>
      
      <Separator />
      
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Storage Overview</CardTitle>
            <CardDescription>
              {formatBytes(usedStorage)} used of {formatBytes(storageLimit)}
              {usagePercentage > 80 && (
                <span className="ml-2 text-amber-500 font-medium">
                  ({usagePercentage}%)
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Progress 
              value={usagePercentage} 
              className="h-3"
              // Using inline style instead of indicatorClassName
              style={{
                '--progress-indicator-color': usagePercentage > 90 ? 'var(--destructive)' : 
                                         usagePercentage > 75 ? '#f59e0b' : 
                                         'var(--primary)'
              } as React.CSSProperties}
            />
            
            {usagePercentage > 90 && (
              <Alert className="mt-4" variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Storage almost full</AlertTitle>
                <AlertDescription>
                  {planType !== PlanType.PRO ? (
                    <>
                      Consider upgrading your subscription plan for more storage.
                      <Button variant="outline" size="sm" className="ml-2" asChild>
                        <Link href={`/${chapterSlug}/admin/upgrade`}>Upgrade Plan</Link>
                      </Button>
                    </>
                  ) : (
                    <>
                      You&apos;re approaching your storage limit. Ask members to delete unused files.
                    </>
                  )}
                </AlertDescription>
              </Alert>
            )}
            
            <div className="mt-6 space-y-1">
              <h4 className="text-sm font-medium">Plan Details</h4>
              <p className="text-sm text-muted-foreground">
                Current plan: <span className="font-medium">{planType}</span>
              </p>
              <p className="text-sm text-muted-foreground">
                Storage limit: {formatBytes(storageLimit)}
              </p>
              {planType !== PlanType.PRO && (
                <p className="text-sm text-muted-foreground">
                  Upgrade to {planType === PlanType.FREE ? "BASIC (3GB)" : "PRO (20GB)"} for more storage
                </p>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Upload New File</CardTitle>
            <CardDescription>
              Files will be available to all chapter members
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FileUploadButton chapterSlug={chapterSlug} />
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>All Chapter Files</CardTitle>
          <CardDescription>
            View and manage all files uploaded by chapter members
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AdminFileList chapterSlug={chapterSlug} userId={session.user.id} />
        </CardContent>
      </Card>
      
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Recent file uploads in your chapter
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentUploads.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent uploads</p>
            ) : (
              <ul className="space-y-3">
                {recentUploads.map((file) => (
                  <li key={file.id} className="flex items-center justify-between text-sm">
                    <div className="flex-1 truncate">
                      <span className="font-medium">{file.name}</span>
                      <span className="text-muted-foreground ml-2">
                        by {file.uploader.name}
                      </span>
                    </div>
                    <div className="flex items-center text-muted-foreground text-xs">
                      <span>{formatBytes(file.size)}</span>
                      <span className="mx-2">•</span>
                      <span>
                        {new Date(file.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Storage by Member</CardTitle>
            <CardDescription>
              Members using the most storage space
            </CardDescription>
          </CardHeader>
          <CardContent>
            {Array.isArray(userStats) && userStats.length > 0 ? (
              <ul className="space-y-3">
                {userStats.map((user: { id: string; name: string; fileCount: number; totalSize: string | number }) => (
                  <li key={user.id} className="flex items-center justify-between text-sm">
                    <span className="font-medium">{user.name}</span>
                    <div className="flex items-center text-muted-foreground text-xs">
                      <span>{user.fileCount} files</span>
                      <span className="mx-2">•</span>
                      <span>{formatBytes(Number(user.totalSize))}</span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No user data available</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
