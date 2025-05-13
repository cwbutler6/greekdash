"use client";

import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useState } from "react";

export default function RedirectTestPage() {
  const { data: session, status } = useSession();
  const [error, setError] = useState<string | null>(null);
  const [chapterSlug, setChapterSlug] = useState<string>("");
  
  const fetchAndRedirect = async () => {
    try {
      // Get memberships to find a valid chapter
      const response = await fetch('/api/user/memberships');
      console.log('Memberships response:', response.status);
      
      if (!response.ok) {
        setError(`Failed to fetch memberships: ${response.status}`);
        return;
      }
      
      const data = await response.json();
      console.log('Membership data:', data);
      
      if (!data.memberships || data.memberships.length === 0) {
        setError('No memberships found');
        return;
      }
      
      // Get the first available chapter
      const firstChapter = data.memberships[0].chapterSlug;
      setChapterSlug(firstChapter);
      
      console.log(`Found chapter: ${firstChapter}`);
    } catch (err) {
      console.error('Error:', err);
      setError('An error occurred while trying to redirect');
    }
  };
  
  const goToPortal = () => {
    if (chapterSlug) {
      window.location.href = `/${chapterSlug}/portal`;
    } else {
      setError('No chapter slug available');
    }
  };
  
  const goToAdmin = () => {
    if (chapterSlug) {
      window.location.href = `/${chapterSlug}/admin`;
    } else {
      setError('No chapter slug available');
    }
  };
  
  return (
    <div className="container py-10 max-w-md">
      <Card>
        <CardHeader>
          <CardTitle>Manual Redirect Test</CardTitle>
          <CardDescription>
            Test redirecting to member and admin pages
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-3 rounded-md bg-slate-100">
            <p><strong>Auth Status:</strong> {status}</p>
            {session?.user?.email && (
              <p><strong>User:</strong> {session.user.email}</p>
            )}
          </div>
          
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-2">
            <Button onClick={fetchAndRedirect} className="w-full">
              Step 1: Find Your Chapter
            </Button>
            
            {chapterSlug && (
              <div className="p-3 rounded-md bg-green-50 text-green-800">
                <p><strong>Chapter Slug:</strong> {chapterSlug}</p>
                <div className="flex space-x-2 mt-2">
                  <Button onClick={goToPortal} variant="outline" className="flex-1">
                    Go to Portal
                  </Button>
                  <Button onClick={goToAdmin} variant="outline" className="flex-1">
                    Go to Admin
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
