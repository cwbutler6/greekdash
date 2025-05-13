"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Membership {
  id: string;
  role: string;
  chapterId: string;
  chapterSlug: string;
  chapterName: string;
}

export default function DebugAuthPage() {
  const { data: session, status } = useSession();
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMemberships = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/user/memberships');
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Membership data:', data);
      setMemberships(data.memberships || []);
    } catch (err) {
      console.error('Error fetching memberships:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const testPortalRedirect = (slug: string) => {
    window.location.href = `/${slug}/portal`;
  };

  const testAdminRedirect = (slug: string) => {
    window.location.href = `/${slug}/admin`;
  };

  return (
    <div className="container py-10 max-w-3xl">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Auth Debug Page</CardTitle>
          <CardDescription>
            Test authentication and redirection flows
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Authentication Status</h3>
              <div className="p-3 bg-slate-100 rounded-md">
                <p><strong>Status:</strong> {status}</p>
                {session && (
                  <>
                    <p><strong>User ID:</strong> {session.user?.id}</p>
                    <p><strong>Email:</strong> {session.user?.email}</p>
                  </>
                )}
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">User Memberships</h3>
              <Button 
                onClick={fetchMemberships} 
                disabled={loading} 
                className="mb-3"
              >
                {loading ? 'Loading...' : 'Fetch Memberships'}
              </Button>
              
              {error && (
                <Alert variant="destructive" className="mb-3">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              {memberships.length > 0 ? (
                <div className="space-y-3">
                  {memberships.map((membership) => (
                    <div key={membership.id} className="p-3 bg-slate-100 rounded-md flex flex-col space-y-2">
                      <p><strong>Chapter:</strong> {membership.chapterName} ({membership.chapterSlug})</p>
                      <p><strong>Role:</strong> {membership.role}</p>
                      <div className="flex space-x-2 mt-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => testPortalRedirect(membership.chapterSlug)}
                        >
                          Test Portal Redirect
                        </Button>
                        {(membership.role === "ADMIN" || membership.role === "OWNER") && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => testAdminRedirect(membership.chapterSlug)}
                          >
                            Test Admin Redirect
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 bg-slate-100 rounded-md">
                  No memberships found or not yet fetched.
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
