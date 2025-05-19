"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { format } from "date-fns";

// UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertTriangle, Clock, LogOut } from "lucide-react";

type ChapterInfo = {
  id: string;
  name: string;
  slug: string;
};

type MembershipInfo = {
  id: string;
  role: string;
  createdAt: string;
};

export default function PendingApprovalClient({ chapterSlug }: { chapterSlug: string }) {
  const { status } = useSession();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chapter, setChapter] = useState<ChapterInfo | null>(null);
  const [membership, setMembership] = useState<MembershipInfo | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push(`/${chapterSlug}/join`);
      return;
    }

    if (status === "authenticated") {
      const checkMembershipStatus = async () => {
        setIsLoading(true);
        try {
          // Get the user's membership for this chapter
          const response = await fetch(`/api/chapters/${chapterSlug}/membership`);
          
          if (!response.ok) {
            if (response.status === 404) {
              // User doesn't have a membership for this chapter
              router.push(`/${chapterSlug}/join`);
              return;
            }
            throw new Error("Failed to fetch membership status");
          }
          
          const data = await response.json();
          
          // If the membership is not pending, redirect to appropriate page
          if (data.membership.role !== "PENDING_MEMBER") {
            router.push(`/${chapterSlug}/portal`);
            return;
          }
          
          setChapter(data.chapter);
          setMembership(data.membership);
        } catch (err) {
          console.error("Error checking membership status:", err);
          setError("An error occurred while checking your membership status");
        } finally {
          setIsLoading(false);
        }
      };
      
      checkMembershipStatus();
    }
  }, [status, chapterSlug, router]);

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/" });
  };

  // If loading, show spinner
  if (status === "loading" || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-[#00b894]" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-gray-50">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle className="text-center text-2xl flex items-center justify-center">
            <Clock className="mr-2 h-5 w-5 text-[#00b894]" /> Approval Pending
          </CardTitle>
          <CardDescription className="text-center">
            Your request to join {chapter?.name || "this chapter"} is under review
          </CardDescription>
        </CardHeader>
        
        {error && (
          <CardContent className="pt-0">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </CardContent>
        )}
        
        <CardContent className="space-y-6">
          <div className="text-center">
            <p className="text-gray-600 mb-2">
              Thank you for your interest in joining {chapter?.name}!
            </p>
            <p className="text-gray-600">
              An administrator will review your request and approve it soon.
              You&apos;ll receive access to the chapter once your membership is approved.
            </p>
          </div>
          
          <div className="bg-gray-50 rounded-md p-4 border border-gray-200">
            <p className="text-sm text-gray-500 mb-1">Request submitted</p>
            <p className="font-medium">
              {membership?.createdAt ? format(new Date(membership.createdAt), "PPP 'at' p") : "Recently"}
            </p>
          </div>
          
          <div className="space-y-2">
            <p className="text-sm text-gray-600">What happens next?</p>
            <ul className="list-disc pl-5 space-y-1">
              <li className="text-sm text-gray-600">Chapter administrators will review your request</li>
              <li className="text-sm text-gray-600">Once approved, you&#39;ll have full access to the chapter</li>
              <li className="text-sm text-gray-600">You&#39;ll receive an email notification when your status changes</li>
            </ul>
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={handleSignOut}
            className="flex items-center"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
          
          <Button asChild variant="link">
            <Link href="/">Return to Home</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
