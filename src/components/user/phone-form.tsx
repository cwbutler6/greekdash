'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/components/ui/use-toast';
import { isValidPhoneNumber } from '@/lib/validation';
import { updatePhoneSettings } from '@/app/actions/user-phone';

// Define a form schema that's compatible with the PhoneSettingsFormData type
const PhoneFormSchema = z.object({
  phone: z.string()
    .min(10, { message: 'Phone number must be at least 10 digits' })
    .regex(/^\+?[0-9]+$/, { message: 'Please enter a valid phone number' })
    .refine(val => isValidPhoneNumber(val), {
      message: 'Phone number must be in E.164 format (e.g. +12125551234)',
    }),
  // Define smsEnabled as a required boolean without a default value to match the expected type
  smsEnabled: z.boolean(),
});

// Define this explicitly to ensure type compatibility with React Hook Form
type FormValues = {
  phone: string;
  smsEnabled: boolean;
};

interface PhoneSettingsFormProps {
  initialData: {
    phone: string | null;
    smsEnabled: boolean;
  };
  chapterSlug: string;
}

export function PhoneSettingsForm({ initialData, chapterSlug }: PhoneSettingsFormProps) {
  const [isPending, setIsPending] = useState(false);
  
  // Use the FormValues type to ensure compatibility with the zodResolver
  const form = useForm<FormValues>({
    resolver: zodResolver(PhoneFormSchema),
    defaultValues: {
      phone: initialData.phone || '',
      smsEnabled: initialData.smsEnabled,
    },
  });

  async function onSubmit(data: FormValues) {
    setIsPending(true);
    try {
      const result = await updatePhoneSettings(data, chapterSlug);
      
      if (result.success) {
        toast('Phone settings updated', {
          description: 'Your phone settings have been successfully updated.',
        });
      } else {
        toast('Error', {
          description: result.error || 'Failed to update phone settings',
          className: 'bg-destructive',
        });
      }
    } catch {
      toast('Error', {
        description: 'Something went wrong updating your phone settings',
        className: 'bg-destructive',
      });
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone Number</FormLabel>
              <FormControl>
                <Input 
                  placeholder="+12125551234" 
                  {...field} 
                  disabled={isPending}
                />
              </FormControl>
              <FormDescription>
                Enter your phone number in E.164 format (e.g. +12125551234)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="smsEnabled"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">SMS Notifications</FormLabel>
                <FormDescription>
                  Receive important updates and announcements via SMS
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={isPending}
                  aria-readonly={isPending}
                />
              </FormControl>
            </FormItem>
          )}
        />
        
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Saving...' : 'Save Settings'}
        </Button>
      </form>
    </Form>
  );
}
