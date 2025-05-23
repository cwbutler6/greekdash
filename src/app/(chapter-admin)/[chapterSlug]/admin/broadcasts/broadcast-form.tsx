'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'sonner';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { AlertCircle, CheckCircle, Loader2, Mail, MessageSquare } from 'lucide-react';

// Schema for broadcast form
const formSchema = z.object({
  subject: z.string()
    .min(1, 'Subject is required')
    .max(100, 'Subject cannot exceed 100 characters'),
  message: z.string()
    .min(1, 'Message content is required')
    .max(5000, 'Message cannot exceed 5000 characters'),
  recipientFilter: z.enum(['all', 'admins', 'members']),
  sendEmail: z.boolean(),
  sendSms: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

const recipientOptions = [
  { value: 'all', label: 'All Members' },
  { value: 'admins', label: 'Administrators Only' },
  { value: 'members', label: 'Regular Members Only' },
];

interface BroadcastFormProps {
  chapterSlug: string;
  memberCount: number; // Used in the component for displaying recipient count information
}

export function BroadcastForm({ chapterSlug, memberCount }: BroadcastFormProps) {
  const [preview, setPreview] = useState(false);
  // Toast is imported directly from sonner

  // Initialize form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      subject: '',
      message: '',
      recipientFilter: 'all',
      sendEmail: true,
      sendSms: false,
    },
  });

  // Define mutation for sending broadcast
  const { mutate, isPending, isSuccess, isError, error } = useMutation({
    mutationFn: async (data: FormValues) => {
      const response = await axios.post(`/api/chapters/${chapterSlug}/broadcasts`, data);
      return response.data;
    },
    onSuccess: (data) => {
      toast.success('Broadcast sent successfully', {
        description: `Your message has been sent to ${data.recipientCount} recipients.`
      });
      form.reset();
      setPreview(false);
    },
    onError: (error: Error | unknown) => {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'An unexpected error occurred';
      
      toast.error('Error sending broadcast', {
        description: errorMessage
      });
    },
  });

  // Handle form submission
  function onSubmit(values: FormValues) {
    if (preview) {
      // If in preview mode, send the broadcast
      mutate(values);
    } else {
      // Otherwise, show preview first
      setPreview(true);
    }
  }

  // Get recipient count text based on filter
  const getRecipientCountText = (filter: string) => {
    switch (filter) {
      case 'admins':
        return `chapter administrators (approximately ${Math.ceil(memberCount * 0.2)} people)`;
      case 'members':
        return `regular members (approximately ${Math.ceil(memberCount * 0.8)} people)`;
      default:
        return `members (${memberCount} people)`;
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Show status messages */}
        {isSuccess && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md p-4 mb-6 flex items-start">
            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mr-3 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-green-800 dark:text-green-300">Broadcast sent successfully</h3>
              <p className="mt-1 text-sm text-green-700 dark:text-green-400">
                Your message has been delivered to the recipients.
              </p>
            </div>
          </div>
        )}

        {isError && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4 mb-6 flex items-start">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mr-3 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-red-800 dark:text-red-300">Failed to send broadcast</h3>
              <p className="mt-1 text-sm text-red-700 dark:text-red-400">
                {error instanceof Error ? error.message : 'An unexpected error occurred'}
              </p>
            </div>
          </div>
        )}
        
        {preview ? (
          <div className="space-y-6">
            <div className="border-b pb-4 mb-4">
              <h2 className="text-xl font-semibold mb-2">Message Preview</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Review your message before sending
              </p>
            </div>
            
            <div className="rounded-md border border-gray-200 dark:border-gray-700 p-4">
              <h3 className="text-lg font-medium">{form.getValues('subject')}</h3>
              <div className="mt-2 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">
                {form.getValues('message')}
              </div>
              <div className="mt-4 space-y-2">
                <p className="text-xs text-gray-500">
                  Recipients: {getRecipientCountText(form.getValues('recipientFilter'))}
                </p>
                <p className="text-xs text-gray-500">
                  Delivery methods: {[form.getValues('sendEmail') ? 'Email' : '', form.getValues('sendSms') ? 'SMS' : ''].filter(Boolean).join(' and ')}
                </p>
              </div>
            </div>
            
            <div className="flex space-x-4 pt-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setPreview(false)}
                disabled={isPending}
              >
                Edit Message
              </Button>
              <Button 
                type="submit" 
                disabled={isPending}
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Send Broadcast'
                )}
              </Button>
            </div>
          </div>
        ) : (
          <>
            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subject</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter email subject" {...field} />
                  </FormControl>
                  <FormDescription>
                    The subject line of the email your members will receive
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter your message here..." 
                      className="min-h-[200px]" 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Write the content of your message. Simple formatting is supported.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="recipientFilter"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Recipients</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select recipients" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {recipientOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Choose which members will receive this broadcast
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="border-t pt-4 mt-6">
              <h3 className="text-sm font-medium mb-3">Delivery Methods</h3>
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="sendEmail"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between space-x-2 rounded-md border p-4">
                      <div className="space-y-0.5">
                        <div className="flex items-center">
                          <Mail className="w-4 h-4 mr-2" />
                          <FormLabel className="text-base">Email</FormLabel>
                        </div>
                        <FormDescription>
                          Send via email to members with email addresses
                        </FormDescription>
                      </div>
                      <FormControl>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={(checked) => {
                                    // Only allow unchecking if SMS is checked
                                    if (!checked && !form.watch('sendSms')) {
                                      return;
                                    }
                                    field.onChange(checked);
                                  }}
                                />
                              </div>
                            </TooltipTrigger>
                            {!form.watch('sendSms') && (
                              <TooltipContent side="right">
                                <p>At least one delivery method must be selected</p>
                              </TooltipContent>
                            )}
                          </Tooltip>
                        </TooltipProvider>
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="sendSms"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between space-x-2 rounded-md border p-4">
                      <div className="space-y-0.5">
                        <div className="flex items-center">
                          <MessageSquare className="w-4 h-4 mr-2" />
                          <FormLabel className="text-base">SMS</FormLabel>
                        </div>
                        <FormDescription>
                          Send via SMS to members with verified phone numbers who have opted in
                        </FormDescription>
                      </div>
                      <FormControl>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={(checked) => {
                                    // Only allow unchecking if Email is checked
                                    if (!checked && !form.watch('sendEmail')) {
                                      return;
                                    }
                                    field.onChange(checked);
                                  }}
                                />
                              </div>
                            </TooltipTrigger>
                            {!form.watch('sendEmail') && (
                              <TooltipContent side="right">
                                <p>At least one delivery method must be selected</p>
                              </TooltipContent>
                            )}
                          </Tooltip>
                        </TooltipProvider>
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>
            
            <div className="flex justify-end pt-4">
              <Button type="submit">
                Preview Message
              </Button>
            </div>
          </>
        )}
      </form>
    </Form>
  );
}
