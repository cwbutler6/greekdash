"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { format, formatDistanceToNow } from "date-fns";

// UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, AlertTriangle, CheckCircle, XCircle, UserPlus } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

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

export default function AdminPendingRequestsPage({ params }: { params: { chapterSlug: string } }) {
  const { chapterSlug } = params;
  const { status } = useSession();
  const router = useRouter();
  
  const [pendingMembers, setPendingMembers] = useState<PendingMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedMember, setSelectedMember] = useState<PendingMember | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'deny' | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isActionInProgress, setIsActionInProgress] = useState(false);

  // Check if user is authenticated and has admin access
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push(`/${chapterSlug}`);
    } else if (status === "authenticated") {
      fetchPendingMembers();
    }
  }, [status, chapterSlug, router]);

  const fetchPendingMembers = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/chapters/${chapterSlug}/members/pending`);
      
      if (!response.ok) {
        if (response.status === 403) {
          // User doesn't have admin permissions
          router.push(`/${chapterSlug}`);
          return;
        }
        throw new Error("Failed to fetch pending members");
      }
      
      const data = await response.json();
      setPendingMembers(data);
    } catch (err) {
      console.error("Error fetching pending members:", err);
      setError("Failed to load pending membership requests. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = (member: PendingMember) => {
    setSelectedMember(member);
    setActionType('approve');
    setIsDialogOpen(true);
  };

  const handleDeny = (member: PendingMember) => {
    setSelectedMember(member);
    setActionType('deny');
    setIsDialogOpen(true);
  };

  const executeMembershipAction = async () => {
    if (!selectedMember || !actionType) return;
    
    setIsActionInProgress(true);
    
    try {
      const endpoint = `/api/chapters/${chapterSlug}/members/${selectedMember.id}/${actionType}`;
      const response = await fetch(endpoint, {
        method: "POST",
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to ${actionType} member`);
      }
      
      setSuccess(`Member ${actionType === 'approve' ? 'approved' : 'denied'} successfully`);
      
      // Refresh the list
      fetchPendingMembers();
      
      // Close the dialog
      setIsDialogOpen(false);
    } catch (err) {
      console.error(`Error ${actionType}ing member:`, err);
      setError(err instanceof Error ? err.message : `An error occurred while ${actionType}ing the member`);
    } finally {
      setIsActionInProgress(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
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
    <div className="container py-8 max-w-6xl">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pending Requests</h1>
          <p className="text-gray-500">Manage chapter membership requests</p>
        </div>
      </div>
      
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert className="mb-6 border-green-500 text-green-600">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}
      
      <Card>
        <CardHeader>
          <CardTitle>Membership Requests</CardTitle>
          <CardDescription>
            Users who signed up using the chapter join code and are waiting for approval
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pendingMembers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <UserPlus className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2">No pending membership requests</p>
              <p className="text-sm">When users sign up with your chapter join code, they&apos;ll appear here</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Requested</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingMembers.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback>
                              {member.user.name ? getInitials(member.user.name) : '??'}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{member.user.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{member.user.email}</TableCell>
                      <TableCell>
                        {formatDistanceToNow(new Date(member.createdAt), { addSuffix: true })}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleApprove(member)}
                          className="text-green-600 hover:text-green-700 hover:bg-green-50"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeny(member)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Deny
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Confirmation Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'approve' ? 'Approve Member' : 'Deny Member'}
            </DialogTitle>
            <DialogDescription>
              {actionType === 'approve' 
                ? 'This user will gain access to the chapter as a full member.'
                : 'This membership request will be deleted and the user will need to request access again.'}
            </DialogDescription>
          </DialogHeader>
          
          {selectedMember && (
            <div className="py-4">
              <div className="flex items-center gap-3 mb-2">
                <Avatar>
                  <AvatarFallback>
                    {selectedMember.user.name ? getInitials(selectedMember.user.name) : '??'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{selectedMember.user.name}</p>
                  <p className="text-sm text-gray-500">{selectedMember.user.email}</p>
                </div>
              </div>
              <p className="text-sm text-gray-500">
                Requested {format(new Date(selectedMember.createdAt), "PPP 'at' p")}
              </p>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isActionInProgress}>
              Cancel
            </Button>
            <Button 
              onClick={executeMembershipAction} 
              disabled={isActionInProgress}
              variant={actionType === 'approve' ? "default" : "destructive"}
            >
              {isActionInProgress && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {actionType === 'approve' ? 'Approve' : 'Deny'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
