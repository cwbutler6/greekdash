"use client";

import { useState, useEffect } from "react";
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

export default function AdminInvitesPage({ params }: { params: { chapterSlug: string } }) {
  const { chapterSlug } = params;
  const { status } = useSession();
  const router = useRouter();
  
  const [invites, setInvites] = useState<Invite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLinkCopied, setIsLinkCopied] = useState(false);
  const [currentInviteLink, setCurrentInviteLink] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InviteFormValues>({
    resolver: zodResolver(inviteFormSchema),
    defaultValues: {
      email: "",
      role: "MEMBER",
    },
  });

  // Check if user is authenticated and has admin access
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push(`/${chapterSlug}`);
    } else if (status === "authenticated") {
      fetchInvites();
    }
  }, [status, chapterSlug, router]);

  const fetchInvites = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/chapters/${chapterSlug}/invites`);
      
      if (!response.ok) {
        if (response.status === 403) {
          // User doesn't have admin permissions
          router.push(`/${chapterSlug}`);
          return;
        }
        throw new Error("Failed to fetch invites");
      }
      
      const data = await response.json();
      setInvites(data);
    } catch (err) {
      console.error("Error fetching invites:", err);
      setError("Failed to load invites. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: InviteFormValues) => {
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);
    
    try {
      const response = await fetch(`/api/chapters/${chapterSlug}/invites`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to send invite");
      }
      
      // Get the invite details including token
      const invite = await response.json();
      
      // Generate invite link
      const inviteUrl = `${window.location.origin}/${chapterSlug}/join?inviteToken=${invite.token}`;
      setCurrentInviteLink(inviteUrl);
      
      // Success message
      setSuccess("Invite sent successfully!");
      
      // Show the dialog with invite link
      setIsDialogOpen(true);
      
      // Reset form
      reset();
      
      // Refresh invites list
      fetchInvites();
    } catch (err) {
      console.error("Error sending invite:", err);
      setError(err instanceof Error ? err.message : "An error occurred while sending the invite");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resendInvite = async (inviteId: string) => {
    try {
      const response = await fetch(`/api/chapters/${chapterSlug}/invites/${inviteId}/resend`, {
        method: "POST",
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to resend invite");
      }
      
      // Get the updated invite with new token
      const invite = await response.json();
      
      // Generate invite link
      const inviteUrl = `${window.location.origin}/${chapterSlug}/join?inviteToken=${invite.token}`;
      setCurrentInviteLink(inviteUrl);
      
      // Show the dialog with invite link
      setIsDialogOpen(true);
      
      // Refresh invites list
      fetchInvites();
      
      // Success message
      setSuccess("Invite resent successfully!");
    } catch (err) {
      console.error("Error resending invite:", err);
      setError(err instanceof Error ? err.message : "An error occurred while resending the invite");
    }
  };

  const deleteInvite = async (inviteId: string) => {
    if (!confirm("Are you sure you want to delete this invite?")) {
      return;
    }
    
    try {
      const response = await fetch(`/api/chapters/${chapterSlug}/invites/${inviteId}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete invite");
      }
      
      // Refresh invites list
      fetchInvites();
      
      // Success message
      setSuccess("Invite deleted successfully!");
    } catch (err) {
      console.error("Error deleting invite:", err);
      setError(err instanceof Error ? err.message : "An error occurred while deleting the invite");
    }
  };

  const copyInviteLink = async () => {
    try {
      await navigator.clipboard.writeText(currentInviteLink);
      setIsLinkCopied(true);
      setTimeout(() => setIsLinkCopied(false), 3000);
    } catch (err) {
      console.error("Failed to copy invite link:", err);
      setError("Failed to copy invite link. Please try again.");
    }
  };

  const getInviteStatus = (invite: Invite) => {
    if (invite.accepted) {
      return (
        <div className="flex items-center text-green-500">
          <CheckCircle className="w-4 h-4 mr-1" />
          <span>Accepted</span>
        </div>
      );
    }
    
    if (new Date(invite.expiresAt) < new Date()) {
      return (
        <div className="flex items-center text-red-500">
          <XCircle className="w-4 h-4 mr-1" />
          <span>Expired</span>
        </div>
      );
    }
    
    return (
      <div className="flex items-center text-amber-500">
        <Clock className="w-4 h-4 mr-1" />
        <span>Pending</span>
      </div>
    );
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
          <h1 className="text-3xl font-bold tracking-tight">Manage Invites</h1>
          <p className="text-gray-500">Send and manage invitations to your chapter</p>
        </div>
      </div>
      
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert className="mb-6 border-green-500 text-green-600">
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Invite a New Member</CardTitle>
              <CardDescription>
                Send an invitation to join your chapter
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" {...register("email")} placeholder="example@email.com" />
                  {errors.email && (
                    <p className="text-sm text-red-500">{errors.email.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select defaultValue="MEMBER" {...register("role")}>
                    <SelectTrigger id="role">
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MEMBER">Member</SelectItem>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500">
                    Admins can manage chapter settings and members
                  </p>
                </div>
                
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Send Invite
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
        
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Invites</CardTitle>
              <CardDescription>
                View and manage all invites to your chapter
              </CardDescription>
            </CardHeader>
            <CardContent>
              {invites.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Mail className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2">No invites sent yet</p>
                  <p className="text-sm">Use the form to invite members to your chapter</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Sent</TableHead>
                        <TableHead>Expires</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invites.map((invite) => (
                        <TableRow key={invite.id}>
                          <TableCell className="font-medium">{invite.email}</TableCell>
                          <TableCell>
                            <span className={invite.role === "ADMIN" ? "text-amber-600" : ""}>
                              {invite.role.charAt(0) + invite.role.slice(1).toLowerCase()}
                            </span>
                          </TableCell>
                          <TableCell>{getInviteStatus(invite)}</TableCell>
                          <TableCell>
                            {formatDistanceToNow(new Date(invite.createdAt), { addSuffix: true })}
                          </TableCell>
                          <TableCell>
                            {new Date(invite.expiresAt) > new Date()
                              ? formatDistanceToNow(new Date(invite.expiresAt), { addSuffix: true })
                              : "Expired"}
                          </TableCell>
                          <TableCell className="text-right">
                            {!invite.accepted && new Date(invite.expiresAt) > new Date() && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => resendInvite(invite.id)}
                                title="Resend Invite"
                              >
                                <RefreshCw className="h-4 w-4" />
                                <span className="sr-only">Resend</span>
                              </Button>
                            )}
                            {!invite.accepted && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => deleteInvite(invite.id)}
                                title="Delete Invite"
                                className="ml-2 text-red-500 hover:text-red-700"
                              >
                                <XCircle className="h-4 w-4" />
                                <span className="sr-only">Delete</span>
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
        </div>
      </div>
      
      {/* Dialog for showing invite link */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Link</DialogTitle>
            <DialogDescription>
              Share this link with the person you want to invite to your chapter. The link will expire in 7 days.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex items-center space-x-2">
            <Input
              value={currentInviteLink}
              readOnly
              className="flex-1"
            />
            <Button onClick={copyInviteLink} variant="outline">
              {isLinkCopied ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
          
          <div className="text-sm text-gray-500">
            <p>You can also send this link via email or messaging.</p>
          </div>
          
          <DialogFooter>
            <Button asChild>
              <a
                href={currentInviteLink}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Open Link
              </a>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
