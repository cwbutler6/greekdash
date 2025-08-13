'use client';

import { useState, useEffect } from 'react';
import { MembershipRole } from '@/generated/prisma';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Search, MoreHorizontal, UserX, UserCheck, Download } from 'lucide-react';

// Define the member type
interface Member {
  id: string;
  userId: string;
  role: MembershipRole;
  isActive: boolean;
  deactivatedAt: Date | null;
  user: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  };
}

// Server action to update member role
async function updateMemberRole(formData: FormData) {
  try {
    const response = await fetch('/api/memberships/update-role', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update role');
    }

    return await response.json();
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error('An unexpected error occurred');
  }
}

// Server action to remove member
async function removeMember(formData: FormData) {
  try {
    const response = await fetch('/api/memberships/remove', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to remove member');
    }

    return await response.json();
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error('An unexpected error occurred');
  }
}

// Server action to deactivate/reactivate member
async function toggleMemberStatus(formData: FormData) {
  try {
    const response = await fetch('/api/memberships/deactivate', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update member status');
    }

    return await response.json();
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error('An unexpected error occurred');
  }
}

export default function MembersClient({ chapterSlug }: { chapterSlug: string }) {
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [memberToRemove, setMemberToRemove] = useState<Member | null>(null);
  const [memberToToggle, setMemberToToggle] = useState<Member | null>(null);
  const [showInactive, setShowInactive] = useState(false);

  // Fetch members data on component mount
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const url = `/api/chapters/${chapterSlug}/members${showInactive ? '?includeInactive=true' : ''}`;
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error('Failed to fetch members');
        }
        const data = await response.json();
        setMembers(data.members);
      } catch (error) {
        toast.error('Failed to load members');
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMembers();
  }, [chapterSlug, showInactive]);

  // Handle role update
  const handleRoleUpdate = async (memberId: string, newRole: MembershipRole) => {
    try {
      const formData = new FormData();
      formData.append('memberId', memberId);
      formData.append('role', newRole);
      formData.append('chapterSlug', chapterSlug);

      await updateMemberRole(formData);
      
      // Update the local state
      setMembers(prevMembers => 
        prevMembers.map(member => 
          member.id === memberId ? { ...member, role: newRole } : member
        )
      );
      
      toast.success('Member role updated');
    } catch (error) {
      toast.error('Failed to update role');
      console.error(error);
    }
  };

  // Handle member removal
  const handleRemoveMember = async () => {
    if (!memberToRemove) return;
    
    try {
      const formData = new FormData();
      formData.append('memberId', memberToRemove.id);
      formData.append('chapterSlug', chapterSlug);

      await removeMember(formData);
      
      // Update the local state
      setMembers(prevMembers => 
        prevMembers.filter(member => member.id !== memberToRemove.id)
      );
      
      toast.success('Member removed');
      setMemberToRemove(null);
    } catch (error) {
      toast.error('Failed to remove member');
      console.error(error);
    }
  };

  // Handle member deactivation/reactivation
  const handleToggleMemberStatus = async () => {
    if (!memberToToggle) return;
    
    try {
      const formData = new FormData();
      formData.append('memberId', memberToToggle.id);
      formData.append('action', memberToToggle.isActive ? 'deactivate' : 'reactivate');

      await toggleMemberStatus(formData);
      
      // Update the local state
      setMembers(prevMembers => 
        prevMembers.map(member => 
          member.id === memberToToggle.id 
            ? { 
                ...member, 
                isActive: !member.isActive,
                deactivatedAt: member.isActive ? new Date() : null
              } 
            : member
        )
      );
      
      toast.success(`Member ${memberToToggle.isActive ? 'deactivated' : 'reactivated'}`);
      setMemberToToggle(null);
    } catch (error) {
      toast.error(`Failed to ${memberToToggle.isActive ? 'deactivate' : 'reactivate'} member`);
      console.error(error);
    }
  };

  // Filter members by search query
  const filteredMembers = members.filter(member => {
    const searchLower = searchQuery.toLowerCase();
    return (
      (member.user.name?.toLowerCase().includes(searchLower) || false) ||
      (member.user.email?.toLowerCase().includes(searchLower) || false)
    );
  });

  // Add the exportMembers function inside the component
  const exportMembers = async (format: 'csv' | 'json' = 'csv') => {
    try {
      const params = new URLSearchParams({
        format,
        includeInactive: showInactive.toString(),
      });
      
      const response = await fetch(`/api/chapters/${chapterSlug}/members/export?${params}`);
      
      if (!response.ok) {
        throw new Error('Export failed');
      }
      
      if (format === 'csv') {
        // Handle CSV download
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${chapterSlug}-members-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        // Handle JSON download
        const data = await response.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${chapterSlug}-members-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
      
      toast.success('Member data exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export member data');
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Chapter Members</CardTitle>
          <CardDescription>
            Manage members and their roles in your chapter
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  type="text"
                  placeholder="Search members..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="show-inactive"
                  checked={showInactive}
                  onCheckedChange={(checked) => setShowInactive(checked === true)}
                />
                <label htmlFor="show-inactive" className="text-sm font-medium">
                  Show inactive members
                </label>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => exportMembers('csv')}>
                    Export as CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => exportMembers('json')}>
                    Export as JSON
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMembers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-6 text-gray-500">
                        {searchQuery 
                          ? 'No members found matching your search' 
                          : 'No members found in this chapter'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredMembers.map((member) => (
                      <TableRow key={member.id} className={!member.isActive ? 'opacity-60' : ''}>
                        <TableCell className="font-medium">
                          {member.user.name || 'Unknown'}
                        </TableCell>
                        <TableCell>{member.user.email || 'No email'}</TableCell>
                        <TableCell>
                          <Badge variant={member.isActive ? "default" : "secondary"}>
                            {member.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Select
                            defaultValue={member.role}
                            onValueChange={(value: string) => 
                              handleRoleUpdate(member.id, value as MembershipRole)
                            }
                            disabled={!member.isActive}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={MembershipRole.MEMBER}>Member</SelectItem>
                              <SelectItem value={MembershipRole.ADMIN}>Admin</SelectItem>
                              <SelectItem value={MembershipRole.OWNER}>Owner</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => setMemberToToggle(member)}
                                className="cursor-pointer"
                              >
                                {member.isActive ? (
                                  <>
                                    <UserX className="mr-2 h-4 w-4" />
                                    Deactivate
                                  </>
                                ) : (
                                  <>
                                    <UserCheck className="mr-2 h-4 w-4" />
                                    Reactivate
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => setMemberToRemove(member)}
                                className="cursor-pointer text-red-600"
                              >
                                Remove
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Deactivation/Reactivation Dialog */}
      <AlertDialog open={!!memberToToggle} onOpenChange={() => setMemberToToggle(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {memberToToggle?.isActive ? 'Deactivate' : 'Reactivate'} Member
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to {memberToToggle?.isActive ? 'deactivate' : 'reactivate'} {memberToToggle?.user.name || 'this member'}?
              {memberToToggle?.isActive 
                ? ' They will lose access to the chapter but their data will be preserved.' 
                : ' They will regain access to the chapter.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleToggleMemberStatus}>
              {memberToToggle?.isActive ? 'Deactivate' : 'Reactivate'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Removal Dialog */}
      <AlertDialog open={!!memberToRemove} onOpenChange={() => setMemberToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {memberToRemove?.user.name || 'this member'} from the chapter?
              This action cannot be undone and will permanently delete their data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveMember} className="bg-red-600 hover:bg-red-700">
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
