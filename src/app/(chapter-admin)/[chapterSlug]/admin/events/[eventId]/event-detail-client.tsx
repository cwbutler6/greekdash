'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { useSession } from 'next-auth/react';
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
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  CalendarDays, 
  Clock, 
  Edit, 
  MapPin, 
  Trash2, 
  Users, 
  CheckCircle, 
  XCircle, 
  HelpCircle,
  Download,
  Loader2
} from 'lucide-react';
import { EventStatus } from '@/generated/prisma';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

// Type definitions
interface User {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
}

interface EventRSVP {
  id: string;
  status: 'GOING' | 'NOT_GOING' | 'MAYBE';
  userId: string;
  eventId: string;
  createdAt: string;
  updatedAt: string;
  user: User;
}

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
  updatedBy: string | null;
  updatedAt: string;
  createdBy: {
    id: string;
    name: string | null;
    image: string | null;
  };
  _count: {
    rsvps: number;
  };
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

// RSVP status badge colors
const rsvpStatusColorMap = {
  GOING: 'bg-green-100 text-green-800',
  NOT_GOING: 'bg-red-100 text-red-800',
  MAYBE: 'bg-yellow-100 text-yellow-800',
};

// RSVP status labels
const rsvpStatusLabelMap = {
  GOING: 'Going',
  NOT_GOING: 'Not Going',
  MAYBE: 'Maybe',
};

// RSVP status icons
const rsvpStatusIconMap = {
  GOING: CheckCircle,
  NOT_GOING: XCircle,
  MAYBE: HelpCircle,
};

interface EventDetailClientProps {
  chapterSlug: string;
  eventId: string;
}

export function EventDetailClient({ chapterSlug, eventId }: EventDetailClientProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [event, setEvent] = useState<Event | null>(null);
  const [rsvps, setRsvps] = useState<EventRSVP[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [activeTab, setActiveTab] = useState('details');

  // Fetch event data
  useEffect(() => {
    const fetchEventData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/chapters/${chapterSlug}/events/${eventId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch event');
        }
        
        const data = await response.json();
        setEvent(data.event);

        // Fetch RSVPs for this event
        const rsvpResponse = await fetch(`/api/chapters/${chapterSlug}/events/${eventId}/rsvp`);
        
        if (!rsvpResponse.ok) {
          throw new Error('Failed to fetch event RSVPs');
        }
        
        const rsvpData = await rsvpResponse.json();
        setRsvps(rsvpData.rsvps);
      } catch (error) {
        toast.error('Failed to load event details');
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEventData();
  }, [chapterSlug, eventId]);

  // Navigate to edit event page
  const handleEditEvent = () => {
    router.push(`/${chapterSlug}/admin/events/${eventId}/edit`);
  };

  // Delete event
  const handleDeleteEvent = async () => {
    try {
      setIsDeleting(true);
      const response = await fetch(`/api/chapters/${chapterSlug}/events/${eventId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete event');
      }
      
      toast.success('Event deleted successfully');
      router.push(`/${chapterSlug}/admin/events`);
      router.refresh();
    } catch (error) {
      toast.error('Failed to delete event');
      console.error(error);
    } finally {
      setIsDeleting(false);
    }
  };

  // Export RSVPs to CSV
  const handleExportRSVPs = async () => {
    try {
      setIsExporting(true);
      
      // Convert RSVPs to CSV
      const headers = ['Name', 'Email', 'Status', 'Response Date'];
      const csvRows = [
        headers.join(','),
        ...rsvps.map((rsvp) => {
          const row = [
            rsvp.user.name?.replace(/,/g, ' ') || 'Unknown',
            rsvp.user.email.replace(/,/g, ' '),
            rsvpStatusLabelMap[rsvp.status],
            format(new Date(rsvp.createdAt), 'yyyy-MM-dd HH:mm:ss')
          ];
          return row.join(',');
        })
      ];
      
      const csvContent = csvRows.join('\n');
      
      // Create a Blob from the CSV data
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      
      // Create a link and trigger download
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `event-rsvps-${eventId}.csv`);
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success('RSVPs exported successfully');
    } catch (error) {
      toast.error('Failed to export RSVPs');
      console.error(error);
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-4 w-1/4" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="col-span-2">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-1/4 mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
            </Card>
          </div>
          <div>
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-1/2" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <h2 className="text-xl font-medium">Event not found</h2>
        <p className="text-muted-foreground">The event you're looking for doesn't exist or you don't have permission to view it.</p>
        <Button onClick={() => router.push(`/${chapterSlug}/admin/events`)}>
          Back to Events
        </Button>
      </div>
    );
  }

  // Format dates for display
  const formattedStartDate = format(new Date(event.startDate), 'EEEE, MMMM d, yyyy');
  const formattedStartTime = format(new Date(event.startDate), 'h:mm a');
  const formattedEndDate = format(new Date(event.endDate), 'EEEE, MMMM d, yyyy');
  const formattedEndTime = format(new Date(event.endDate), 'h:mm a');
  const isSameDay = formattedStartDate === formattedEndDate;

  // Count RSVPs by status
  const rsvpCounts = {
    GOING: rsvps.filter(rsvp => rsvp.status === 'GOING').length,
    NOT_GOING: rsvps.filter(rsvp => rsvp.status === 'NOT_GOING').length,
    MAYBE: rsvps.filter(rsvp => rsvp.status === 'MAYBE').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{event.title}</h1>
          <p className="text-muted-foreground">
            Created {format(new Date(event.createdAt), 'MMM d, yyyy')} by {event.createdBy.name || 'Unknown'}
          </p>
        </div>
        <div className="flex space-x-3">
          <Button onClick={handleEditEvent} variant="outline" size="sm">
            <Edit className="mr-2 h-4 w-4" /> Edit
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete the event and all associated RSVPs.
                  This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleDeleteEvent}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  disabled={isDeleting}
                >
                  {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Badge className={statusColorMap[event.status]} variant="secondary">
          {statusLabelMap[event.status]}
        </Badge>
        {!event.isPublic && (
          <Badge variant="outline">Private</Badge>
        )}
        {event.capacity && (
          <Badge variant="outline">
            <Users className="mr-1 h-3 w-3" /> 
            Capacity: {event.capacity}
          </Badge>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="rsvps">
            RSVPs
            <Badge variant="secondary" className="ml-2">
              {rsvps.length}
            </Badge>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="details" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Event Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1">
                    <h3 className="text-sm font-medium text-muted-foreground">Description</h3>
                    <p className="whitespace-pre-line">{event.description}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Date & Location</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start space-x-2">
                    <CalendarDays className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">{formattedStartDate}</p>
                      {!isSameDay && <p className="font-medium">to {formattedEndDate}</p>}
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-2">
                    <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p>{formattedStartTime} - {formattedEndTime}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-2">
                    <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p>{event.location}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="rsvps" className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
            <div className="grid grid-cols-3 gap-3 w-full md:w-auto">
              <div className="flex flex-col items-center justify-center p-3 border rounded-md bg-card">
                <span className="text-xl font-bold">{rsvpCounts.GOING}</span>
                <span className="text-xs text-muted-foreground">Going</span>
              </div>
              <div className="flex flex-col items-center justify-center p-3 border rounded-md bg-card">
                <span className="text-xl font-bold">{rsvpCounts.MAYBE}</span>
                <span className="text-xs text-muted-foreground">Maybe</span>
              </div>
              <div className="flex flex-col items-center justify-center p-3 border rounded-md bg-card">
                <span className="text-xl font-bold">{rsvpCounts.NOT_GOING}</span>
                <span className="text-xs text-muted-foreground">Not Going</span>
              </div>
            </div>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleExportRSVPs}
              disabled={isExporting || rsvps.length === 0}
            >
              {isExporting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              Export to CSV
            </Button>
          </div>
          
          {rsvps.length === 0 ? (
            <div className="text-center py-8">
              <h3 className="text-lg font-medium">No RSVPs yet</h3>
              <p className="text-muted-foreground mt-2">
                No one has responded to this event yet
              </p>
            </div>
          ) : (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Response Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rsvps.map((rsvp) => {
                    const StatusIcon = rsvpStatusIconMap[rsvp.status];
                    return (
                      <TableRow key={rsvp.id}>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={rsvp.user.image || undefined} alt={rsvp.user.name || "Member"} />
                              <AvatarFallback>
                                {rsvp.user.name?.split(' ').map(n => n[0]).join('') || rsvp.user.email[0].toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{rsvp.user.name || 'Unknown'}</p>
                              <p className="text-xs text-muted-foreground">{rsvp.user.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={rsvpStatusColorMap[rsvp.status]} variant="secondary">
                            <StatusIcon className="mr-1 h-3 w-3" />
                            {rsvpStatusLabelMap[rsvp.status]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {format(new Date(rsvp.createdAt), 'MMM d, yyyy • h:mm a')}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
