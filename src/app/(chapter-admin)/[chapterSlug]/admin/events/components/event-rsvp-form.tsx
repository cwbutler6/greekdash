'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { rsvpSchema, RsvpFormValues } from '@/lib/validations/event';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  RadioGroup,
  RadioGroupItem,
} from '@/components/ui/radio-group';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface EventRsvpFormProps {
  chapterSlug: string;
  eventId: string;
  existingRsvp?: {
    id: string;
    status: 'GOING' | 'NOT_GOING' | 'MAYBE';
  } | null;
  onSuccess?: () => void;
}

export function EventRsvpForm({
  chapterSlug,
  eventId,
  existingRsvp,
  onSuccess,
}: EventRsvpFormProps) {
  const [isLoading, setIsLoading] = useState(false);

  // Initialize form with schema validation
  const form = useForm<RsvpFormValues>({
    resolver: zodResolver(rsvpSchema),
    defaultValues: {
      status: existingRsvp?.status || 'GOING',
    },
  });

  // Form submission handler
  const onSubmit = async (values: RsvpFormValues) => {
    setIsLoading(true);
    
    try {
      const endpoint = `/api/chapters/${chapterSlug}/events/${eventId}/rsvp`;
      const method = existingRsvp ? 'PATCH' : 'POST';
      
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...values,
          id: existingRsvp?.id, // Include ID for updates
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save RSVP');
      }
      
      toast.success(existingRsvp ? 'RSVP updated successfully' : 'RSVP saved successfully');
      
      // Call the onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'An unexpected error occurred');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Are you attending?</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex flex-col space-y-1"
                >
                  <FormItem className="flex items-center space-x-3 space-y-0 cursor-pointer">
                    <FormControl>
                      <RadioGroupItem value="GOING" />
                    </FormControl>
                    <FormLabel className="font-normal cursor-pointer">
                      Yes, I&apos;ll be there
                    </FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3 space-y-0 cursor-pointer">
                    <FormControl>
                      <RadioGroupItem value="MAYBE" />
                    </FormControl>
                    <FormLabel className="font-normal cursor-pointer">
                      Maybe
                    </FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3 space-y-0 cursor-pointer">
                    <FormControl>
                      <RadioGroupItem value="NOT_GOING" />
                    </FormControl>
                    <FormLabel className="font-normal cursor-pointer">
                      No, I can&apos;t make it
                    </FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {existingRsvp ? 'Update RSVP' : 'Submit RSVP'}
        </Button>
      </form>
    </Form>
  );
}
