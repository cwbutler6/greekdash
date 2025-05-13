'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Calendar, CalendarDays, Clock, MapPin, Users } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
// import { 
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from '@/components/ui/select';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { EventRsvpForm } from './event-rsvp-form';

// Type definitions
interface EventRSVP {
  id: string;
  status: 'GOING' | 'NOT_GOING' | 'MAYBE';
  userId: string;
  eventId: string;
  createdAt: string;
  updatedAt: string;
}

interface Event {
  id: string;
  title: string;
  description: string;
  location: string;
  startDate: string;
  endDate: string;
  status: 'SCHEDULED' | 'CANCELED' | 'COMPLETED';
  isPublic: boolean;
  capacity: number | null;
  chapterId: string;
  createdAt: string;
  updatedAt: string;
  userRsvp?: EventRSVP;
  _count?: {
    rsvps: number;
  };
}

type EventTab = 'upcoming' | 'past' | 'all';

interface Pagination {
  page: number;
  limit: number;
  total: number;
}

const rsvpStatusColorMap = {
  'GOING': 'bg-green-100 text-green-800',
  'MAYBE': 'bg-yellow-100 text-yellow-800',
  'NOT_GOING': 'bg-red-100 text-red-800'
};

interface PortalEventsClientProps {
  chapterSlug: string;
};

// Event status labels
const statusLabelMap = {
  SCHEDULED: 'Upcoming',
  COMPLETED: 'Completed',
  CANCELED: 'Canceled',
};

// Status badge colors
const statusColorMap = {
  SCHEDULED: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-gray-100 text-gray-800',
  CANCELED: 'bg-red-100 text-red-800',
};

// RSVP status labels
const rsvpStatusLabelMap = {
  GOING: 'Going',
  NOT_GOING: 'Not Going',
  MAYBE: 'Maybe',
};

export default function PortalEventsClient({ chapterSlug }: PortalEventsClientProps) {
  // These are commented out but kept for potential future use
  // const router = useRouter();
  // const { data: session } = useSession();
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  // Only using setIsRsvpDialogOpen in handleRsvpSuccess
  const [, setIsRsvpDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<EventTab>('upcoming');
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0
  });

  // Fetch events data on component mount
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/chapters/${chapterSlug}/events?tab=${activeTab}&page=${pagination.page}&limit=${pagination.limit}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch events');
        }
        
        const data = await response.json();
        setEvents(data.events);
        setPagination(prev => ({ ...prev, total: data.total }));
      } catch (error) {
        console.error('Error fetching events:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchEvents();
  }, [chapterSlug, pagination.page, pagination.limit, activeTab]);

  // Navigate to event details
  const handleViewEvent = (event: Event) => {
    setSelectedEvent(event);
  };

  // Handle pagination changes
  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  // Handle tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value as EventTab);
    setPagination(prev => ({ ...prev, page: 1 }));
  };
  
  // Handle successful RSVP update
  const handleRsvpSuccess = () => {
    setIsRsvpDialogOpen(false);
    
    // Refresh the events data to show updated RSVP status
    const fetchEvents = async () => {
      try {
        const response = await fetch(`/api/chapters/${chapterSlug}/events?tab=${activeTab}&page=${pagination.page}&limit=${pagination.limit}`);
        
        if (response.ok) {
          const data = await response.json();
          setEvents(data.events);
          
          // Update the selected event with the new RSVP data
          if (selectedEvent) {
            const updatedEvent = data.events.find((e: Event) => e.id === selectedEvent.id);
            if (updatedEvent) {
              setSelectedEvent(updatedEvent);
            }
          }
        }
      } catch (error) {
        console.error('Failed to refresh events:', error);
      }
    };

    fetchEvents();
  };

  // Format the date for display
  const formatEventDate = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    const sameDay = start.toDateString() === end.toDateString();
    
    if (sameDay) {
      return `${format(start, 'PPP')} from ${format(start, 'p')} to ${format(end, 'p')}`;
    } else {
      return `From ${format(start, 'PPP p')} to ${format(end, 'PPP p')}`;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Chapter Events</h1>
      </div>

      <Tabs defaultValue="upcoming" value={activeTab} onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming Events</TabsTrigger>
          <TabsTrigger value="past">Past Events</TabsTrigger>
          <TabsTrigger value="all">All Events</TabsTrigger>
        </TabsList>
        
        <TabsContent value="upcoming" className="space-y-4">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-2/3" />
                    <Skeleton className="h-4 w-1/3" />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : events.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-10">
                <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No upcoming events</h3>
                <p className="text-muted-foreground text-center mt-2">
                  Check back later for new events
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {events.map((event) => (
                <Card key={event.id} className="overflow-hidden">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-xl">{event.title}</CardTitle>
                        <CardDescription>
                          <div className="flex items-center mt-1">
                            <CalendarDays className="h-4 w-4 mr-1 text-muted-foreground" />
                            <span>{formatEventDate(event.startDate, event.endDate)}</span>
                          </div>
                        </CardDescription>
                      </div>
                      <div>
                        <Badge className={statusLabelMap[event.status]} variant="secondary">
                          {statusLabelMap[event.status]}
                        </Badge>
                        {event.userRsvp && (
                          <Badge className={`ml-2 ${rsvpStatusColorMap[event.userRsvp.status]}`} variant="secondary">
                            {rsvpStatusLabelMap[event.userRsvp.status]}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <p className="line-clamp-2 text-muted-foreground">
                          {event.description}
                        </p>
                        <div className="flex flex-col gap-1 text-sm">
                          <div className="flex items-center text-muted-foreground">
                            <Clock className="h-4 w-4 mr-1" />
                            <span>{format(new Date(event.startDate), 'h:mm a')} - {format(new Date(event.endDate), 'h:mm a')}</span>
                          </div>
                          <div className="flex items-center text-muted-foreground">
                            <MapPin className="h-4 w-4 mr-1" />
                            <span>{event.location}</span>
                          </div>
                          {event.capacity && (
                            <div className="flex items-center text-muted-foreground">
                              <Users className="h-4 w-4 mr-1" />
                              <span>{event._count?.rsvps ?? 0} / {event.capacity} Attendees</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-end justify-end md:justify-end mt-4 md:mt-0">
                        <Button
                          variant="outline"
                          onClick={() => handleViewEvent(event)}
                        >
                          View Details
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="past" className="space-y-4">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-2/3" />
                    <Skeleton className="h-4 w-1/3" />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : events.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-10">
                <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No past events</h3>
                <p className="text-muted-foreground text-center mt-2">
                  There are no past events to display
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {events.map((event) => (
                <Card key={event.id} className="overflow-hidden">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-xl">{event.title}</CardTitle>
                        <CardDescription>
                          <div className="flex items-center mt-1">
                            <CalendarDays className="h-4 w-4 mr-1 text-muted-foreground" />
                            <span>{formatEventDate(event.startDate, event.endDate)}</span>
                          </div>
                        </CardDescription>
                      </div>
                      <div>
                        <Badge className={statusLabelMap[event.status]} variant="secondary">
                          {statusLabelMap[event.status]}
                        </Badge>
                        {event.userRsvp && (
                          <Badge className={`ml-2 ${rsvpStatusColorMap[event.userRsvp.status]}`} variant="secondary">
                            {rsvpStatusLabelMap[event.userRsvp.status]}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <p className="line-clamp-2 text-muted-foreground">
                          {event.description}
                        </p>
                        <div className="flex flex-col gap-1 text-sm">
                          <div className="flex items-center text-muted-foreground">
                            <Clock className="h-4 w-4 mr-1" />
                            <span>{format(new Date(event.startDate), 'h:mm a')} - {format(new Date(event.endDate), 'h:mm a')}</span>
                          </div>
                          <div className="flex items-center text-muted-foreground">
                            <MapPin className="h-4 w-4 mr-1" />
                            <span>{event.location}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-end justify-end md:justify-end mt-4 md:mt-0">
                        <Button
                          variant="outline"
                          onClick={() => handleViewEvent(event)}
                        >
                          View Details
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="all" className="space-y-4">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-2/3" />
                    <Skeleton className="h-4 w-1/3" />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : events.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-10">
                <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No events</h3>
                <p className="text-muted-foreground text-center mt-2">
                  There are no events to display
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {events.map((event) => (
                <Card key={event.id} className="overflow-hidden">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-xl">{event.title}</CardTitle>
                        <CardDescription>
                          <div className="flex items-center mt-1">
                            <CalendarDays className="h-4 w-4 mr-1 text-muted-foreground" />
                            <span>{formatEventDate(event.startDate, event.endDate)}</span>
                          </div>
                        </CardDescription>
                      </div>
                      <div>
                        <Badge className={statusLabelMap[event.status]} variant="secondary">
                          {statusLabelMap[event.status]}
                        </Badge>
                        {event.userRsvp && (
                          <Badge className={`ml-2 ${rsvpStatusColorMap[event.userRsvp.status]}`} variant="secondary">
                            {rsvpStatusLabelMap[event.userRsvp.status]}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <p className="line-clamp-2 text-muted-foreground">
                          {event.description}
                        </p>
                        <div className="flex flex-col gap-1 text-sm">
                          <div className="flex items-center text-muted-foreground">
                            <Clock className="h-4 w-4 mr-1" />
                            <span>{format(new Date(event.startDate), 'h:mm a')} - {format(new Date(event.endDate), 'h:mm a')}</span>
                          </div>
                          <div className="flex items-center text-muted-foreground">
                            <MapPin className="h-4 w-4 mr-1" />
                            <span>{event.location}</span>
                          </div>
                          {event.capacity && (
                            <div className="flex items-center text-muted-foreground">
                              <Users className="h-4 w-4 mr-1" />
                              <span>{event._count?.rsvps ?? 0} / {event.capacity} Attendees</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-end justify-end md:justify-end mt-4 md:mt-0">
                        <Button
                          variant="outline"
                          onClick={() => handleViewEvent(event)}
                        >
                          View Details
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <div className="mt-4">
        {pagination.total > pagination.limit && (
          <div className="flex justify-center space-x-2">
            <Button
              variant="outline"
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
            >
              Previous
            </Button>
            
            <span className="flex items-center mx-2">
              Page {pagination.page} of {Math.ceil(pagination.total / pagination.limit)}
            </span>
            
            <Button
              variant="outline"
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page >= Math.ceil(pagination.total / pagination.limit)}
            >
              Next
            </Button>
          </div>
        )}
      </div>

      {/* Event Details Dialog */}
      {selectedEvent && (
        <Dialog open={!!selectedEvent} onOpenChange={(open) => !open && setSelectedEvent(null)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>{selectedEvent.title}</DialogTitle>
              <DialogDescription>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge className={statusColorMap[selectedEvent.status]} variant="secondary">
                    {statusLabelMap[selectedEvent.status]}
                  </Badge>
                  {selectedEvent.userRsvp && (
                    <Badge className={rsvpStatusColorMap[selectedEvent.userRsvp.status]} variant="secondary">
                      {rsvpStatusLabelMap[selectedEvent.userRsvp.status]}
                    </Badge>
                  )}
                </div>
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">When & Where</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div className="flex items-start space-x-2">
                    <CalendarDays className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p>{format(new Date(selectedEvent.startDate), 'EEEE, MMMM d, yyyy')}</p>
                      {format(new Date(selectedEvent.startDate), 'yyyy-MM-dd') !== format(new Date(selectedEvent.endDate), 'yyyy-MM-dd') && (
                        <p>to {format(new Date(selectedEvent.endDate), 'EEEE, MMMM d, yyyy')}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-2">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p>{format(new Date(selectedEvent.startDate), 'h:mm a')} - {format(new Date(selectedEvent.endDate), 'h:mm a')}</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start space-x-2 mt-2">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p>{selectedEvent.location}</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">Description</h3>
                <p className="whitespace-pre-line">{selectedEvent.description}</p>
              </div>
              
              {selectedEvent.capacity && (
                <div className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <p>
                    <span>{selectedEvent._count?.rsvps ?? 0} / {selectedEvent.capacity} Attendees</span>
                  </p>
                </div>
              )}
              
              {selectedEvent.status !== 'CANCELED' && selectedEvent.status !== 'COMPLETED' && (
                <div className="pt-4 border-t">
                  <h3 className="text-sm font-medium mb-3">Your RSVP</h3>
                  <EventRsvpForm
                    chapterSlug={chapterSlug}
                    eventId={selectedEvent.id}
                    existingRsvp={selectedEvent.userRsvp || undefined}
                    onSuccess={handleRsvpSuccess}
                  />
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
