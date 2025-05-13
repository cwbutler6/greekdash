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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { Search } from 'lucide-react';

// Define the member type
interface Member {
  id: string;
  userId: string;
  role: MembershipRole;
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

export default function MembersClient({ chapterSlug }: { chapterSlug: string }) {
  // const router = useRouter(); // Uncomment if needed for navigation
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [memberToRemove, setMemberToRemove] = useState<Member | null>(null);

  // Fetch members data on component mount
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const response = await fetch(`/api/chapters/${chapterSlug}/members`);
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
  }, [chapterSlug]);

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

  // Filter members by search query
  const filteredMembers = members.filter(member => {
    const searchLower = searchQuery.toLowerCase();
    return (
      (member.user.name?.toLowerCase().includes(searchLower) || false) ||
      (member.user.email?.toLowerCase().includes(searchLower) || false)
    );
  });

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
          <div className="flex items-center mb-4">
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
                    <TableHead>Role</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMembers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-6 text-gray-500">
                        {searchQuery 
                          ? 'No members found matching your search' 
                          : 'No members found in this chapter'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredMembers.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell className="font-medium">
                          {member.user.name || 'Unknown'}
                        </TableCell>
                        <TableCell>{member.user.email || 'No email'}</TableCell>
                        <TableCell>
                          <Select
                            defaultValue={member.role}
                            onValueChange={(value: string) => 
                              handleRoleUpdate(member.id, value as MembershipRole)
                            }
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
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="destructive" 
                                size="sm"
                                onClick={() => setMemberToRemove(member)}
                              >
                                Remove
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Remove Member</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to remove {member.user.name || 'this member'} from the chapter?
                                  This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleRemoveMember}>
                                  Remove
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
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
    </div>
  );
}
