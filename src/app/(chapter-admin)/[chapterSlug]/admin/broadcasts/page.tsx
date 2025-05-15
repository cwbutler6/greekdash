import { Metadata } from "next";
import { prisma } from "@/lib/db";
import { requireChapterAccess } from "@/lib/auth";
import { BroadcastForm } from "./broadcast-form";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Send Chapter Broadcast | GreekDash",
  description: "Send an email to all members of your chapter",
};

export default async function BroadcastPage({
  params,
}: {
  params: Promise<{ chapterSlug: string }>;
}) {
  const { chapterSlug } = await params;
  const { membership } = await requireChapterAccess(chapterSlug);
  
  // Check if user has admin privileges
  if (membership.role !== "ADMIN" && membership.role !== "OWNER") {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] p-4">
        <h1 className="text-2xl font-bold text-red-600 mb-2">Access Denied</h1>
        <p className="text-gray-700 dark:text-gray-300 mb-4">
          You need administrator privileges to access this page.
        </p>
        <Button asChild>
          <Link href={`/${chapterSlug}/dashboard`}>
            Return to Dashboard
          </Link>
        </Button>
      </div>
    );
  }
  
  // Get chapter details
  const chapter = await prisma.chapter.findUnique({
    where: { slug: chapterSlug },
    select: {
      id: true,
      name: true,
      _count: {
        select: {
          memberships: {
            where: {
              role: {
                in: ["MEMBER", "ADMIN", "OWNER"],
              },
            },
          },
        },
      },
    },
  });
  
  if (!chapter) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold text-red-600 mb-2">Chapter Not Found</h1>
        <p className="text-gray-700 dark:text-gray-300">
          The requested chapter could not be found.
        </p>
      </div>
    );
  }
  
  // Get broadcast history (recent broadcasts)
  const recentBroadcasts = await prisma.auditLog.findMany({
    where: {
      chapterId: chapter.id,
      action: "CHAPTER_BROADCAST",
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 5,
    select: {
      id: true,
      createdAt: true,
      user: {
        select: {
          name: true,
        },
      },
      metadata: true,
    },
  });

  const memberCount = chapter._count.memberships;
  
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <Button variant="ghost" asChild className="mb-2">
          <Link href={`/${chapterSlug}/admin`} className="flex items-center">
            <ChevronLeft className="mr-1 h-4 w-4" />
            Back to Admin
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Send Chapter Broadcast</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Compose an email to send to all {memberCount} members of {chapter.name}
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <BroadcastForm chapterSlug={chapterSlug} memberCount={memberCount} />
          </div>
        </div>
        
        <div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Recent Broadcasts</h2>
            
            {recentBroadcasts.length > 0 ? (
              <div className="space-y-4">
                {recentBroadcasts.map((broadcast) => {
                  const metadata = broadcast.metadata as {
                    subject: string;
                    recipientCount: number;
                    recipientFilter: string;
                    timestamp: string;
                  };
                  
                  return (
                    <div key={broadcast.id} className="border-b border-gray-200 dark:border-gray-700 pb-3 last:border-0">
                      <p className="font-medium">{metadata.subject}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Sent by {broadcast.user?.name || "Unknown"} to {metadata.recipientCount} recipients
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        {new Date(broadcast.createdAt).toLocaleString()}
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-600 dark:text-gray-400">
                No broadcasts have been sent yet.
              </p>
            )}
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mt-6">
            <h2 className="text-xl font-semibold mb-2">Tips</h2>
            <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-2">
              <li>Keep subjects clear and concise</li>
              <li>Format your message with paragraphs for better readability</li>
              <li>Consider segmenting your audience for targeted communications</li>
              <li>Preview your message before sending</li>
              <li>Avoid sending too many emails to prevent member fatigue</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
