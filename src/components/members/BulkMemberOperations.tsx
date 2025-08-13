'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MembershipRole } from '@/generated/prisma';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { Loader2, Users, UserCheck, UserX, Shield } from 'lucide-react';

// Form schemas
const bulkRoleUpdateSchema = z.object({
  memberIds: z.array(z.string()).min(1, 'Select at least one member'),
  role: z.nativeEnum(MembershipRole),
});

const bulkStatusUpdateSchema = z.object({
  memberIds: z.array(z.string()).min(1, 'Select at least one member'),
  action: z.enum(['deactivate', 'reactivate']),
});

type BulkRoleFormValues = z.infer<typeof bulkRoleUpdateSchema>;
type BulkStatusFormValues = z.infer<typeof bulkStatusUpdateSchema>;

interface Member {
  id: string;
  userId: string;
  role: MembershipRole;
  isActive: boolean;
  user: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  };
}

interface BulkMemberOperationsProps {
  chapterSlug: string;
  members: Member[];
  onMembersUpdate: () => void;
}

export function BulkMemberOperations({ chapterSlug, members, onMembersUpdate }: BulkMemberOperationsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [pendingOperation, setPendingOperation] = useState<{
    type: 'role' | 'status';
    data: BulkRoleFormValues | BulkStatusFormValues;
  } | null>(null);

  // Role update form
  const roleForm = useForm<BulkRoleFormValues>({
    resolver: zodResolver(bulkRoleUpdateSchema),
    defaultValues: {
      memberIds: [],
      role: MembershipRole.MEMBER,
    },
  });

  // Status update form
  const statusForm = useForm<BulkStatusFormValues>({
    resolver: zodResolver(bulkStatusUpdateSchema),
    defaultValues: {
      memberIds: [],
      action: 'deactivate',
    },
  });

  // Get active and inactive members
  const activeMembers = members.filter(m => m.isActive);
  const inactiveMembers = members.filter(m => !m.isActive);

  // Helper functions
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n: string) => n?.[0] || '')
      .join('')
      .toUpperCase();
  };

  const toggleSelectAll = (formType: 'role' | 'status', memberList: Member[]) => {
    const form = formType === 'role' ? roleForm : statusForm;
    const allMemberIds = memberList.map(m => m.id);
    const currentlySelected = form.getValues().memberIds;
    
    if (currentlySelected.length === allMemberIds.length) {
      if (formType === 'role') {
        roleForm.setValue('memberIds', []);
      } else {
        statusForm.setValue('memberIds', []);
      }
    } else {
      if (formType === 'role') {
        roleForm.setValue('memberIds', allMemberIds);
      } else {
        statusForm.setValue('memberIds', allMemberIds);
      }
    }
  };

  // Handle bulk operations
  const handleBulkOperation = async (operation: 'role' | 'status', data: BulkRoleFormValues | BulkStatusFormValues) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/memberships/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chapterSlug,
          action: operation === 'role' ? 'updateRole' : (data as BulkStatusFormValues).action,
          memberIds: data.memberIds,
          data: operation === 'role' ? { role: (data as BulkRoleFormValues).role } : {},
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Operation failed');
      }

      const result = await response.json();
      toast.success(result.message);
      
      // Reset forms and close dialogs
      roleForm.reset();
      statusForm.reset();
      setShowRoleDialog(false);
      setShowStatusDialog(false);
      setPendingOperation(null);
      
      // Refresh members list
      onMembersUpdate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Operation failed');
    } finally {
      setIsLoading(false);
    }
  };

  const onRoleSubmit = (data: BulkRoleFormValues) => {
    setPendingOperation({ type: 'role', data });
    setShowRoleDialog(true);
  };

  const onStatusSubmit = (data: BulkStatusFormValues) => {
    setPendingOperation({ type: 'status', data });
    setShowStatusDialog(true);
  };

  return (
    <div className="space-y-6">
      {/* Bulk Role Update */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Bulk Role Update
          </CardTitle>
          <CardDescription>
            Update roles for multiple active members at once
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...roleForm}>
            <form onSubmit={roleForm.handleSubmit(onRoleSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={roleForm.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Role</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={MembershipRole.MEMBER}>Member</SelectItem>
                          <SelectItem value={MembershipRole.ADMIN}>Admin</SelectItem>
                          <SelectItem value={MembershipRole.OWNER}>Owner</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex items-end">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => toggleSelectAll('role', activeMembers)}
                    className="w-full"
                  >
                    {roleForm.watch('memberIds').length === activeMembers.length ? 'Deselect All' : 'Select All'}
                  </Button>
                </div>
              </div>

              <FormField
                control={roleForm.control}
                name="memberIds"
                render={() => (
                  <FormItem>
                    <FormLabel>Select Active Members ({roleForm.watch('memberIds').length} selected)</FormLabel>
                    <div className="max-h-[300px] overflow-y-auto border rounded-md p-2">
                      {activeMembers.length > 0 ? (
                        <div className="space-y-2">
                          {activeMembers.map((member) => (
                            <FormField
                              key={member.id}
                              control={roleForm.control}
                              name="memberIds"
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-center space-x-3 space-y-0 p-2 hover:bg-accent rounded-md">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(member.id)}
                                      onCheckedChange={(checked) => {
                                        return checked
                                          ? field.onChange([...field.value, member.id])
                                          : field.onChange(
                                              field.value?.filter((value) => value !== member.id)
                                            );
                                      }}
                                    />
                                  </FormControl>
                                  <div className="flex items-center space-x-2 flex-1">
                                    <Avatar className="h-8 w-8">
                                      <AvatarImage src={member.user.image || ''} alt={member.user.name || 'User'} />
                                      <AvatarFallback>{getInitials(member.user.name || 'U')}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                      <div className="font-medium">{member.user.name}</div>
                                      <div className="text-sm text-muted-foreground">{member.user.email}</div>
                                    </div>
                                    <Badge variant="outline">{member.role}</Badge>
                                  </div>
                                </FormItem>
                              )}
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          No active members found
                        </div>
                      )}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={isLoading || roleForm.watch('memberIds').length === 0}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Roles'
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Bulk Status Update */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Bulk Status Update
          </CardTitle>
          <CardDescription>
            Activate or deactivate multiple members at once
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...statusForm}>
            <form onSubmit={statusForm.handleSubmit(onStatusSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={statusForm.control}
                  name="action"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Action</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select action" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="deactivate">
                            <div className="flex items-center gap-2">
                              <UserX className="h-4 w-4" />
                              Deactivate Members
                            </div>
                          </SelectItem>
                          <SelectItem value="reactivate">
                            <div className="flex items-center gap-2">
                              <UserCheck className="h-4 w-4" />
                              Reactivate Members
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex items-end">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      const targetMembers = statusForm.watch('action') === 'deactivate' ? activeMembers : inactiveMembers;
                      toggleSelectAll('status', targetMembers);
                    }}
                    className="w-full"
                  >
                    {(() => {
                      const targetMembers = statusForm.watch('action') === 'deactivate' ? activeMembers : inactiveMembers;
                      return statusForm.watch('memberIds').length === targetMembers.length ? 'Deselect All' : 'Select All';
                    })()}
                  </Button>
                </div>
              </div>

              <FormField
                control={statusForm.control}
                name="memberIds"
                render={() => {
                  const targetMembers = statusForm.watch('action') === 'deactivate' ? activeMembers : inactiveMembers;
                  return (
                    <FormItem>
                      <FormLabel>
                        Select {statusForm.watch('action') === 'deactivate' ? 'Active' : 'Inactive'} Members ({statusForm.watch('memberIds').length} selected)
                      </FormLabel>
                      <div className="max-h-[300px] overflow-y-auto border rounded-md p-2">
                        {targetMembers.length > 0 ? (
                          <div className="space-y-2">
                            {targetMembers.map((member) => (
                              <FormField
                                key={member.id}
                                control={statusForm.control}
                                name="memberIds"
                                render={({ field }) => (
                                  <FormItem className="flex flex-row items-center space-x-3 space-y-0 p-2 hover:bg-accent rounded-md">
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(member.id)}
                                        onCheckedChange={(checked) => {
                                          return checked
                                            ? field.onChange([...field.value, member.id])
                                            : field.onChange(
                                                field.value?.filter((value) => value !== member.id)
                                              );
                                        }}
                                      />
                                    </FormControl>
                                    <div className="flex items-center space-x-2 flex-1">
                                      <Avatar className="h-8 w-8">
                                        <AvatarImage src={member.user.image || ''} alt={member.user.name || 'User'} />
                                        <AvatarFallback>{getInitials(member.user.name || 'U')}</AvatarFallback>
                                      </Avatar>
                                      <div className="flex-1">
                                        <div className="font-medium">{member.user.name}</div>
                                        <div className="text-sm text-muted-foreground">{member.user.email}</div>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Badge variant={member.isActive ? "default" : "secondary"}>
                                          {member.isActive ? 'Active' : 'Inactive'}
                                        </Badge>
                                        <Badge variant="outline">{member.role}</Badge>
                                      </div>
                                    </div>
                                  </FormItem>
                                )}
                              />
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8 text-muted-foreground">
                            No {statusForm.watch('action') === 'deactivate' ? 'active' : 'inactive'} members found
                          </div>
                        )}
                      </div>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />

              <Button type="submit" disabled={isLoading || statusForm.watch('memberIds').length === 0}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  `${statusForm.watch('action') === 'deactivate' ? 'Deactivate' : 'Reactivate'} Members`
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Confirmation Dialogs */}
      <AlertDialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Bulk Role Update</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to update the role of {pendingOperation?.data?.memberIds?.length || 0} member(s) to {pendingOperation?.type === 'role' ? (pendingOperation.data as BulkRoleFormValues).role : ''}?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => pendingOperation && handleBulkOperation('role', pendingOperation.data)}
              disabled={isLoading}
            >
              {isLoading ? 'Updating...' : 'Update Roles'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Confirm Bulk {pendingOperation?.type === 'status' && (pendingOperation.data as BulkStatusFormValues).action === 'deactivate' ? 'Deactivation' : 'Reactivation'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to {pendingOperation?.type === 'status' ? (pendingOperation.data as BulkStatusFormValues).action : 'update'} {pendingOperation?.data?.memberIds?.length || 0} member(s)?
              {pendingOperation?.type === 'status' && (pendingOperation.data as BulkStatusFormValues).action === 'deactivate'
                ? ' Deactivated members will lose access but their data will be preserved.'
                : ' Reactivated members will regain access to the chapter.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => pendingOperation && handleBulkOperation('status', pendingOperation.data)}
              disabled={isLoading}
            >
              {isLoading ? 'Processing...' : `${pendingOperation?.type === 'status' && (pendingOperation.data as BulkStatusFormValues).action === 'deactivate' ? 'Deactivate' : 'Reactivate'} Members`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}