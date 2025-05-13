'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

// Define the schema in the component to ensure type consistency
const eventSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters" }).max(100, { message: "Title cannot exceed 100 characters" }),
  description: z.string().min(10, { message: "Description must be at least 10 characters" }).max(5000, { message: "Description cannot exceed 5000 characters" }),
  location: z.string().min(3, { message: "Location must be at least 3 characters" }).max(200, { message: "Location cannot exceed 200 characters" }),
  startDate: z.date({ required_error: "Start date is required" }),
  endDate: z.date({ required_error: "End date is required" }),
  capacity: z.number().int().positive().nullable(),
  isPublic: z.boolean()
});

// Add refinement for date validation
const eventSchemaWithRefinement = eventSchema.refine(
  (data) => data.endDate > data.startDate,
  {
    message: "End date must be after start date",
    path: ["endDate"],
  }
);

// Create the type from the schema
type EventFormData = z.infer<typeof eventSchema>;

interface EventFormClientProps {
  chapterSlug: string;
  mode: 'create' | 'edit';
  eventId?: string;
}

export function EventFormClient({
  chapterSlug,
  mode,
  eventId,
}: EventFormClientProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(mode === 'edit');

  // Initialize form with schema validation
  const form = useForm<EventFormData>({
    resolver: zodResolver(eventSchemaWithRefinement),
    defaultValues: {
      title: '',
      description: '',
      location: '',
      startDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      endDate: new Date(Date.now() + 26 * 60 * 60 * 1000),   // Tomorrow + 2 hours
      capacity: null,
      isPublic: true,
    },
  });

  // Fetch event data for edit mode
  useEffect(() => {
    const fetchEvent = async () => {
      if (mode === 'edit' && eventId) {
        try {
          setIsFetching(true);
          const response = await fetch(`/api/chapters/${chapterSlug}/events/${eventId}`);
          
          if (!response.ok) {
            throw new Error('Failed to fetch event');
          }
          
          const data = await response.json();
          
          // Populate form with event data
          form.reset({
            title: data.event.title,
            description: data.event.description,
            location: data.event.location,
            startDate: new Date(data.event.startDate),
            endDate: new Date(data.event.endDate),
            capacity: data.event.capacity,
            isPublic: data.event.isPublic ?? true, // Ensure it's always a boolean
          });
        } catch (error) {
          toast.error('Failed to load event details');
          console.error(error);
        } finally {
          setIsFetching(false);
        }
      }
    };

    fetchEvent();
  }, [chapterSlug, eventId, mode, form]);

  // Form submission handler
  const onSubmit = async (values: EventFormData) => {
    setIsLoading(true);
    
    try {
      const endpoint = mode === 'create' 
        ? `/api/chapters/${chapterSlug}/events` 
        : `/api/chapters/${chapterSlug}/events/${eventId}`;
      
      const method = mode === 'create' ? 'POST' : 'PATCH';
      
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save event');
      }
      
      const responseData = await response.json();
      
      toast.success(mode === 'create' ? 'Event created successfully' : 'Event updated successfully');
      
      // Redirect to event details page
      router.push(`/${chapterSlug}/admin/events/${responseData.event.id}`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'An unexpected error occurred');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Event Title</FormLabel>
              <FormControl>
                <Input placeholder="Summer Chapter Meeting" {...field} />
              </FormControl>
              <FormDescription>
                A clear and concise title for your event
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Details about the event..."
                  className="min-h-[120px]"
                  {...field} 
                />
              </FormControl>
              <FormDescription>
                Provide details about the event, what attendees should expect, what to bring, etc.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Location</FormLabel>
              <FormControl>
                <Input placeholder="Student Union, Room 101" {...field} />
              </FormControl>
              <FormDescription>
                Where the event will take place
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Start Date & Time</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP p")
                        ) : (
                          <span>Pick a date and time</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                    <div className="p-3 border-t border-border">
                      <div className="flex items-center justify-between">
                        <FormLabel className="text-xs">Time</FormLabel>
                        <Input
                          type="time"
                          value={field.value ? format(field.value, "HH:mm") : ""}
                          onChange={(e) => {
                            const [hours, minutes] = e.target.value.split(":");
                            const newDate = new Date(field.value);
                            newDate.setHours(parseInt(hours), parseInt(minutes));
                            field.onChange(newDate);
                          }}
                          className="w-24"
                        />
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
                <FormDescription>
                  When the event starts
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="endDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>End Date & Time</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP p")
                        ) : (
                          <span>Pick a date and time</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => {
                        const startDate = form.getValues("startDate");
                        return date < (startDate || new Date());
                      }}
                      initialFocus
                    />
                    <div className="p-3 border-t border-border">
                      <div className="flex items-center justify-between">
                        <FormLabel className="text-xs">Time</FormLabel>
                        <Input
                          type="time"
                          value={field.value ? format(field.value, "HH:mm") : ""}
                          onChange={(e) => {
                            const [hours, minutes] = e.target.value.split(":");
                            const newDate = new Date(field.value);
                            newDate.setHours(parseInt(hours), parseInt(minutes));
                            field.onChange(newDate);
                          }}
                          className="w-24"
                        />
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
                <FormDescription>
                  When the event ends
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="capacity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Capacity (Optional)</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  min="0"
                  placeholder="Leave empty for unlimited" 
                  value={field.value === null ? '' : field.value}
                  onChange={e => {
                    const value = e.target.value === '' ? null : parseInt(e.target.value);
                    field.onChange(value);
                  }}
                />
              </FormControl>
              <FormDescription>
                Maximum number of attendees. Leave empty for unlimited.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="isPublic"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Public Event</FormLabel>
                <FormDescription>
                  If enabled, this event will be visible to all chapter members.
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => router.back()} 
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === 'create' ? 'Create Event' : 'Update Event'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
