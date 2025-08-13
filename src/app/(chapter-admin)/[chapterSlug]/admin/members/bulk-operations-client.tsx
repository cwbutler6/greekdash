'use client';

import { useState, useEffect } from 'react';
import { MembershipRole } from '@/generated/prisma';
import { BulkMemberOperations } from '@/components/members/BulkMemberOperations';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

// Define the member type (same as in members-client.tsx)
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

interface BulkMemberOperationsClientProps {
  chapterSlug: string;
}

export default function BulkMemberOperationsClient({ chapterSlug }: BulkMemberOperationsClientProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch members data (including inactive members for bulk operations)
  const fetchMembers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`/api/chapters/${chapterSlug}/members?includeInactive=true`);
      if (!response.ok) {
        throw new Error('Failed to fetch members');
      }
      
      const data = await response.json();
      setMembers(data.members);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch members');
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchMembers();
  }, [chapterSlug]);

  // Handle members update after bulk operations
  const handleMembersUpdate = () => {
    fetchMembers();
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading members...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <p className="text-destructive mb-2">Error loading members</p>
            <p className="text-sm text-muted-foreground">{error}</p>
            <button 
              onClick={fetchMembers}
              className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Try Again
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <BulkMemberOperations 
      chapterSlug={chapterSlug}
      members={members}
      onMembersUpdate={handleMembersUpdate}
    />
  );
}