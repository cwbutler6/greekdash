'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { Mail, MessageSquare, Send } from 'lucide-react';
import { toast } from 'sonner';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

interface Member {
  id: string;
  phone?: string | null;
  phoneVerified: boolean;
  smsEnabled: boolean;
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
  };
}

interface CommunicateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipient: Member;
  communicationType: 'EMAIL' | 'SMS';
  chapterSlug: string;
}

// Define the form schema
const communicateFormSchema = z.object({
  subject: z.string().min(1, "Subject is required").max(100, "Subject must be 100 characters or less"),
  message: z.string().min(1, "Message is required").max(5000, "Message must be 5000 characters or less"),
});

type CommunicateFormValues = z.infer<typeof communicateFormSchema>;

export function CommunicateDialog({
  open,
  onOpenChange,
  recipient,
  communicationType,
  chapterSlug
}: CommunicateDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Setup form
  const form = useForm<CommunicateFormValues>({
    resolver: zodResolver(communicateFormSchema),
    defaultValues: {
      subject: '',
      message: '',
    },
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (data: CommunicateFormValues) => {
      const response = await axios.post('/api/members/communicate', {
        chapterSlug,
        recipientIds: [recipient.id],
        subject: data.subject,
        message: data.message,
        communicationType,
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success(`Message sent successfully to ${recipient.user.name || 'recipient'}`);
      form.reset();
      onOpenChange(false);
    },
    onError: (error: Error & { response?: { data?: { error?: string } } }) => {
      toast.error(`Failed to send message: ${error.response?.data?.error || error.message || 'Unknown error'}`);
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  // Handle form submission
  const onSubmit = (data: CommunicateFormValues) => {
    setIsSubmitting(true);
    sendMessageMutation.mutate(data);
  };



  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            {communicationType === 'EMAIL' ? (
              <Mail className="mr-2 h-5 w-5" />
            ) : (
              <MessageSquare className="mr-2 h-5 w-5" />
            )}
            Send {communicationType === 'EMAIL' ? 'Email' : 'SMS'} to {recipient.user.name || 'Member'}
          </DialogTitle>
          <DialogDescription>
            {communicationType === 'EMAIL' 
              ? `Sending email to ${recipient.user.email}`
              : `Sending SMS to ${recipient.phone}`}
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subject</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter subject" 
                      {...field} 
                    />
                  </FormControl>
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
                      placeholder="Type your message here..." 
                      className="min-h-[120px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={isSubmitting}
              >
                <Send className="mr-2 h-4 w-4" />
                Send {communicationType === 'EMAIL' ? 'Email' : 'SMS'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
