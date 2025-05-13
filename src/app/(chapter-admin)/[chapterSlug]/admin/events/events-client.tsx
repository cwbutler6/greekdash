'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { CalendarDays, MapPin, Plus, Users } from 'lucide-react';
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
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { EventStatus } from '@/generated/prisma';

// Define the event type
interface Event {
  id: string;
  title: string;
  description: string;
  location: string;
  startDate: string;
  endDate: string;
  capacity: number | null;
  isPublic: boolean;
  status: EventStatus;
  createdAt: string;
  createdBy: {
    id: string;
    name: string | null;
    image: string | null;
  };
  _count: {
    rsvps: number;
  };
}

interface PaginationData {
  total: number;
  pages: number;
  page: number;
  limit: number;
}

// Event status badge colors
const statusColorMap = {
  UPCOMING: 'bg-blue-100 text-blue-800',
  ONGOING: 'bg-green-100 text-green-800',
  COMPLETED: 'bg-gray-100 text-gray-800',
  CANCELED: 'bg-red-100 text-red-800',
};

// Event status labels
const statusLabelMap = {
  UPCOMING: 'Upcoming',
  ONGOING: 'Ongoing',
  COMPLETED: 'Completed',
  CANCELED: 'Canceled',
};

interface EventsClientProps {
  chapterSlug: string;
}

export function EventsClient({ chapterSlug }: EventsClientProps) {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationData>({
    total: 0,
    pages: 1,
    page: 1,
    limit: 10,
  });
  
  // Fetch events data on component mount
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/chapters/${chapterSlug}/events?page=${pagination.page}&limit=${pagination.limit}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch events');
        }
        
        const data = await response.json();
        setEvents(data.events);
        setPagination(data.pagination);
      } catch (error) {
        toast.error('Failed to load events');
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();
  }, [chapterSlug, pagination.page, pagination.limit]);

  // Navigate to create new event page
  const handleCreateEvent = () => {
    router.push(`/${chapterSlug}/admin/events/new`);
  };

  // Navigate to event details page
  const handleViewEvent = (eventId: string) => {
    router.push(`/${chapterSlug}/admin/events/${eventId}`);
  };

  // Navigate to edit event page
  const handleEditEvent = (eventId: string) => {
    router.push(`/${chapterSlug}/admin/events/${eventId}/edit`);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Events</h1>
        <Button onClick={handleCreateEvent}>
          <Plus className="mr-2 h-4 w-4" /> Create Event
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upcoming Events</CardTitle>
          <CardDescription>
            Manage your chapter&apos;s events and track attendance
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            // Skeleton loading state
            <div className="space-y-4">
              {Array(3).fill(0).map((_, i) => (
                <div key={i} className="flex flex-col space-y-2">
                  <Skeleton className="h-6 w-1/3" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </div>
          ) : events.length === 0 ? (
            // Empty state
            <div className="text-center py-8">
              <h3 className="text-lg font-medium">No events found</h3>
              <p className="text-muted-foreground mt-2">
                Create your first event to get started
              </p>
              <Button onClick={handleCreateEvent} className="mt-4">
                <Plus className="mr-2 h-4 w-4" /> Create Event
              </Button>
            </div>
          ) : (
            // Events table
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event</TableHead>
                    <TableHead>Date & Location</TableHead>
                    <TableHead>RSVPs</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events.map((event) => (
                    <TableRow key={event.id} className="cursor-pointer hover:bg-slate-50" onClick={() => handleViewEvent(event.id)}>
                      <TableCell className="font-medium">
                        {event.title}
                        {!event.isPublic && (
                          <Badge variant="outline" className="ml-2">
                            Private
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col space-y-1">
                          <div className="flex items-center text-sm text-muted-foreground">
                            <CalendarDays className="mr-1 h-3 w-3" />
                            {format(new Date(event.startDate), 'MMM d, yyyy • h:mm a')}
                          </div>
                          <div className="flex items-center text-sm text-muted-foreground">
                            <MapPin className="mr-1 h-3 w-3" />
                            {event.location}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Users className="mr-1 h-4 w-4 text-muted-foreground" />
                          <span>{event._count.rsvps}{event.capacity && ` / ${event.capacity}`}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={statusColorMap[event.status]}
                          variant="secondary"
                        >
                          {statusLabelMap[event.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                                      <circle cx="12" cy="12" r="1" /><circle cx="12" cy="5" r="1" /><circle cx="12" cy="19" r="1" />
                                    </svg>
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={(e) => {
                                    e.stopPropagation();
                                    handleViewEvent(event.id);
                                  }}>
                                    View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditEvent(event.id);
                                  }}>
                                    Edit Event
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Actions</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {!isLoading && events.length > 0 && pagination.pages > 1 && (
            <div className="flex justify-center mt-4 space-x-2">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page === 1}
                onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
              >
                Previous
              </Button>
              <span className="flex items-center mx-2">
                Page {pagination.page} of {pagination.pages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page === pagination.pages}
                onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
