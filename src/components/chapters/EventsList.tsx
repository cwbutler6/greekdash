'use client';

import { Event, EventStatus } from '@/generated/prisma';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, MapPinIcon, ClockIcon } from 'lucide-react';
import { format } from 'date-fns';

interface EventsListProps {
  events: Array<Pick<Event, 'id' | 'title' | 'description' | 'location' | 'startDate' | 'endDate' | 'status'>>;
}

export function EventsList({ events }: EventsListProps) {
  if (!events.length) {
    return (
      <Card className="w-full mb-8">
        <CardHeader>
          <CardTitle>Upcoming Events</CardTitle>
          <CardDescription>No upcoming public events at this time.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="w-full mb-8">
      <CardHeader>
        <CardTitle>Upcoming Events</CardTitle>
        <CardDescription>Check out our upcoming public events</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {events.map((event) => (
          <Card key={event.id} className="overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-xl">{event.title}</CardTitle>
                <Badge variant={event.status === EventStatus.UPCOMING ? 'default' : 'secondary'}>
                  {event.status.charAt(0) + event.status.slice(1).toLowerCase()}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pb-2">
              <p className="text-sm text-muted-foreground mb-4">{event.description}</p>
              <div className="grid gap-2">
                <div className="flex items-center text-sm">
                  <CalendarIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>{format(new Date(event.startDate), 'EEEE, MMMM d, yyyy')}</span>
                </div>
                <div className="flex items-center text-sm">
                  <ClockIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>{format(new Date(event.startDate), 'h:mm a')} - {format(new Date(event.endDate), 'h:mm a')}</span>
                </div>
                <div className="flex items-center text-sm">
                  <MapPinIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>{event.location}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </CardContent>
    </Card>
  );
}
