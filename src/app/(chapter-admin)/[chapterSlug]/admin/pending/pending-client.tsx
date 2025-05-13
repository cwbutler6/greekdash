"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";

// UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, AlertTriangle, CheckCircle, XCircle, UserPlus } from "lucide-react";

type PendingMember = {
  id: string;
  user: {
    id: string;
    name: string;
    email: string;
    createdAt: string;
  };
  createdAt: string;
};

export default function AdminPendingRequestsClient({ chapterSlug }: { chapterSlug: string }) {
  const { status } = useSession();
  const router = useRouter();
  
  const [pendingMembers, setPendingMembers] = useState<PendingMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Function to check admin access
  const checkAdminAccess = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/chapters/${chapterSlug}/admin/check`);
      
      if (!response.ok) {
        if (response.status === 401) {
          // User is not authenticated
          router.push("/login");
        } else if (response.status === 403) {
          // User doesn't have admin access
          router.push(`/${chapterSlug}/dashboard`);
        } else {
          throw new Error("Error checking admin access");
        }
      }
    } catch (err: unknown) {
      console.error("Failed to check admin access:", err);
      setError("Failed to verify your admin permissions");
    }
  }, [chapterSlug, router]);

  // Fetch pending membership requests
  const fetchPendingRequests = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/chapters/${chapterSlug}/admin/pending`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch pending requests");
      }
      
      const data = await response.json();
      setPendingMembers(data.pendingMembers);
    } catch (err: unknown) {
      console.error("Error fetching pending requests:", err);
      setError("Failed to load pending membership requests. Please try again.");
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [chapterSlug]);

  // Initial data load
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status === "authenticated") {
      checkAdminAccess();
      fetchPendingRequests();
    }
  }, [status, router, checkAdminAccess, fetchPendingRequests]);

  // Handle approval of a pending request
  const approveMember = async (memberId: string) => {
    setSelectedMemberId(memberId);
    setError(null);
    setSuccess(null);
    
    try {
      const response = await fetch(`/api/chapters/${chapterSlug}/admin/pending/${memberId}/approve`, {
        method: "POST",
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || "Failed to approve membership request");
      }
      
      setSuccess("Membership request approved successfully");
      fetchPendingRequests();
    } catch (err: unknown) {
      console.error("Error approving membership:", err);
      setError(
        err instanceof Error 
          ? err.message 
          : "Failed to approve membership request"
      );
    } finally {
      setSelectedMemberId(null);
    }
  };

  // Handle rejection of a pending request
  const rejectMember = async (memberId: string) => {
    setSelectedMemberId(memberId);
    setError(null);
    setSuccess(null);
    
    try {
      const response = await fetch(`/api/chapters/${chapterSlug}/admin/pending/${memberId}/reject`, {
        method: "POST",
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || "Failed to reject membership request");
      }
      
      setSuccess("Membership request rejected successfully");
      fetchPendingRequests();
    } catch (err: unknown) {
      console.error("Error rejecting membership:", err);
      setError(
        err instanceof Error 
          ? err.message 
          : "Failed to reject membership request"
      );
    } finally {
      setSelectedMemberId(null);
    }
  };

  // Handle manual refresh
  const handleRefresh = () => {
    setRefreshing(true);
    fetchPendingRequests();
  };

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-700">{success}</AlertDescription>
        </Alert>
      )}
      
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Pending Membership Requests</h1>
        <Button onClick={handleRefresh} variant="outline" disabled={refreshing}>
          {refreshing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pending Requests</CardTitle>
          <CardDescription>
            Review and manage membership requests awaiting approval.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : pendingMembers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No pending membership requests found.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Requested</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingMembers.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">{member.user.name}</TableCell>
                    <TableCell>{member.user.email}</TableCell>
                    <TableCell>
                      {formatDistanceToNow(new Date(member.createdAt), { addSuffix: true })}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          onClick={() => approveMember(member.id)}
                          disabled={selectedMemberId === member.id}
                          title="Approve member"
                        >
                          {selectedMemberId === member.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <UserPlus className="h-4 w-4 mr-1" />
                          )}
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => rejectMember(member.id)}
                          disabled={selectedMemberId === member.id}
                          title="Reject member"
                        >
                          {selectedMemberId === member.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <XCircle className="h-4 w-4 mr-1" />
                          )}
                          Reject
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
