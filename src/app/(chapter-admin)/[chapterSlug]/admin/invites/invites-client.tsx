"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { formatDistanceToNow } from "date-fns";

// UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, PlusCircle, Mail, Copy, CheckCircle, Clock, XCircle, RefreshCw, ExternalLink } from "lucide-react";

// Schema for invite form
const inviteFormSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  role: z.enum(["MEMBER", "ADMIN"]),
});

type InviteFormValues = z.infer<typeof inviteFormSchema>;

type Invite = {
  id: string;
  email: string;
  role: string;
  createdAt: string;
  expiresAt: string;
  accepted: boolean;
  acceptedAt?: string;
  acceptedBy?: { name?: string; email?: string };
};

export default function AdminInvitesClient({ chapterSlug }: { chapterSlug: string }) {
  const { status } = useSession();
  const router = useRouter();
  
  const [invites, setInvites] = useState<Invite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);
  const [selectedInviteId, setSelectedInviteId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    setValue,
  } = useForm<InviteFormValues>({
    resolver: zodResolver(inviteFormSchema),
    defaultValues: {
      email: "",
      role: "MEMBER",
    },
  });

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

  // Fetch invites
  const fetchInvites = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/chapters/${chapterSlug}/admin/invites`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch invites");
      }
      
      const data = await response.json();
      setInvites(data.invites);
    } catch (err: unknown) {
      console.error("Error fetching invites:", err);
      setError("Failed to load invites. Please try again.");
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
      fetchInvites();
    }
  }, [status, router, checkAdminAccess, fetchInvites]);

  // Handle form submission
  const onSubmit = async (data: InviteFormValues) => {
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);
    
    try {
      const response = await fetch(`/api/chapters/${chapterSlug}/admin/invites`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      
      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.message || "Failed to create invite");
      }
      
      setSuccess(`Invite sent to ${data.email}`);
      fetchInvites();
      reset();
      setIsDialogOpen(false);
    } catch (err: unknown) {
      console.error("Error creating invite:", err);
      setError(
        err instanceof Error 
          ? err.message 
          : "Failed to send invite. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle copying invite link
  const copyInviteLink = (inviteId: string) => {
    setSelectedInviteId(inviteId);
    setCopySuccess(null);
    
    const inviteLink = `${window.location.origin}/${chapterSlug}/join?token=${inviteId}`;
    
    navigator.clipboard.writeText(inviteLink)
      .then(() => {
        setCopySuccess(inviteId);
        setTimeout(() => setCopySuccess(null), 3000);
      })
      .catch((err) => {
        console.error("Failed to copy:", err);
        setError("Failed to copy invite link");
      });
  };

  // Handle resending invite
  const resendInvite = async (inviteId: string) => {
    setSelectedInviteId(inviteId);
    setError(null);
    setSuccess(null);
    
    try {
      const response = await fetch(`/api/chapters/${chapterSlug}/admin/invites/${inviteId}/resend`, {
        method: "POST",
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || "Failed to resend invite");
      }
      
      setSuccess("Invite resent successfully");
      fetchInvites();
    } catch (err: unknown) {
      console.error("Error resending invite:", err);
      setError(
        err instanceof Error 
          ? err.message 
          : "Failed to resend invite"
      );
    } finally {
      setSelectedInviteId(null);
    }
  };

  // Handle revoking invite
  const revokeInvite = async (inviteId: string) => {
    setSelectedInviteId(inviteId);
    setError(null);
    setSuccess(null);
    
    try {
      const response = await fetch(`/api/chapters/${chapterSlug}/admin/invites/${inviteId}`, {
        method: "DELETE",
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || "Failed to revoke invite");
      }
      
      setSuccess("Invite revoked successfully");
      fetchInvites();
    } catch (err: unknown) {
      console.error("Error revoking invite:", err);
      setError(
        err instanceof Error 
          ? err.message 
          : "Failed to revoke invite"
      );
    } finally {
      setSelectedInviteId(null);
    }
  };

  // Handle refreshing invites
  const handleRefresh = () => {
    setRefreshing(true);
    fetchInvites();
  };

  // Render loading state
  if (status === "loading" || (isLoading && !refreshing)) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-[#00b894]" />
      </div>
    );
  }

  return (
    <div className="container py-6 max-w-5xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Manage Invites</h1>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={() => setIsDialogOpen(true)}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Invite Member
          </Button>
        </div>
      </div>
      
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert className="mb-4 bg-green-50 border-green-200 text-green-700">
          <CheckCircle className="h-4 w-4 mr-2" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}
      
      <Card>
        <CardHeader>
          <CardTitle>Invitations</CardTitle>
          <CardDescription>
            Send and manage invitations to join your chapter
          </CardDescription>
        </CardHeader>
        <CardContent>
          {invites.length === 0 ? (
            <div className="text-center py-6 text-gray-500">
              <Mail className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>No invites have been sent yet</p>
              <Button 
                variant="link" 
                onClick={() => setIsDialogOpen(true)}
                className="mt-2"
              >
                Send your first invite
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Invited</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invites.map((invite) => (
                    <TableRow key={invite.id}>
                      <TableCell>{invite.email}</TableCell>
                      <TableCell className="capitalize">{invite.role.toLowerCase()}</TableCell>
                      <TableCell>
                        {invite.accepted ? (
                          <div className="flex items-center">
                            <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                            <span>Accepted</span>
                          </div>
                        ) : (
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 text-amber-500 mr-1" />
                            <span>Pending</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>{formatDistanceToNow(new Date(invite.createdAt), { addSuffix: true })}</TableCell>
                      <TableCell>
                        {invite.accepted 
                          ? 'N/A' 
                          : formatDistanceToNow(new Date(invite.expiresAt), { addSuffix: true })}
                      </TableCell>
                      <TableCell className="text-right">
                        {!invite.accepted && (
                          <div className="flex justify-end items-center space-x-2">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => copyInviteLink(invite.id)}
                              title="Copy invite link"
                            >
                              {copySuccess === invite.id ? (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => resendInvite(invite.id)}
                              disabled={selectedInviteId === invite.id}
                              title="Resend invite"
                            >
                              {selectedInviteId === invite.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Mail className="h-4 w-4" />
                              )}
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => revokeInvite(invite.id)}
                              disabled={selectedInviteId === invite.id}
                              title="Revoke invite"
                            >
                              {selectedInviteId === invite.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <XCircle className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        )}
                        {invite.accepted && (
                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                          >
                            <a 
                              href={`/${chapterSlug}/admin/members?highlight=${invite.acceptedBy?.email}`}
                              className="flex items-center"
                            >
                              <span className="mr-1">View</span>
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* New Invite Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite a New Member</DialogTitle>
            <DialogDescription>
              Send an invitation email to join your chapter. The invite link will expire in 7 days.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input 
                  id="email"
                  placeholder="example@email.com"
                  {...register("email")}
                />
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="role">Role</Label>
                <Select
                  defaultValue="MEMBER"
                  onValueChange={(value) => setValue("role", value as "MEMBER" | "ADMIN")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MEMBER">Member</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                  </SelectContent>
                </Select>
                {errors.role && (
                  <p className="text-red-500 text-sm mt-1">{errors.role.message}</p>
                )}
              </div>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Send Invite
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
