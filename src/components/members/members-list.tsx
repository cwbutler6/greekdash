'use client';

import { useState } from 'react';
import { 
  Mail, 
  MessageSquare, 
  ChevronLeft, 
  ChevronRight 
} from 'lucide-react';


import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { CommunicateDialog } from './communicate-dialog';

interface Member {
  id: string;
  phone?: string | null;
  phoneVerified: boolean;
  smsEnabled: boolean;
  major?: string | null;
  gradYear?: number | null;
  bio?: string | null;
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  membership: {
    role: string;
  };
}

interface Pagination {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
}

interface MembersListProps {
  members: Member[];
  pagination: Pagination;
  onPageChange: (page: number) => void;
  chapterSlug: string;
}

export function MembersList({ 
  members, 
  pagination, 
  onPageChange,
  chapterSlug 
}: MembersListProps) {

  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [communicationType, setCommunicationType] = useState<'EMAIL' | 'SMS'>('EMAIL');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  if (members.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No members found. Try a different search term.</p>
      </div>
    );
  }

  const handleSendEmail = (member: Member) => {
    setSelectedMember(member);
    setCommunicationType('EMAIL');
    setIsDialogOpen(true);
  };

  const handleSendSMS = (member: Member) => {
    setSelectedMember(member);
    setCommunicationType('SMS');
    setIsDialogOpen(true);
  };

  const getInitials = (name?: string | null) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <div className="space-y-4">
      {members.map((member) => (
        <Card key={member.id} className="overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={member.user.image || ''} alt={member.user.name || 'Member'} />
                  <AvatarFallback>{getInitials(member.user.name)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{member.user.name || 'Unnamed Member'}</p>
                  <p className="text-sm text-muted-foreground">
                    {member.major ? `${member.major}` : ''}
                    {member.major && member.gradYear ? ` • ` : ''}
                    {member.gradYear ? `Class of ${member.gradYear}` : ''}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        size="icon" 
                        variant="outline"
                        onClick={() => handleSendEmail(member)}
                        disabled={!member.user.email}
                      >
                        <Mail className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {member.user.email ? 'Send Email' : 'No email available'}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        size="icon" 
                        variant="outline"
                        onClick={() => handleSendSMS(member)}
                        disabled={!member.phone || !member.phoneVerified || !member.smsEnabled}
                      >
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {member.phone && member.phoneVerified && member.smsEnabled 
                        ? 'Send SMS' 
                        : 'SMS not available'}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Pagination controls */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(pagination.page - 1)}
            disabled={pagination.page <= 1}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>
          <p className="text-sm text-muted-foreground">
            Page {pagination.page} of {pagination.totalPages}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(pagination.page + 1)}
            disabled={pagination.page >= pagination.totalPages}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      )}

      {/* Communication dialog */}
      {selectedMember && (
        <CommunicateDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          recipient={selectedMember}
          communicationType={communicationType}
          chapterSlug={chapterSlug}
        />
      )}
    </div>
  );
}
