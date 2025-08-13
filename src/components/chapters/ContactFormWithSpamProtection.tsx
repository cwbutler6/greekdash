'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useMutation } from '@tanstack/react-query';
import { Loader2, Shield } from 'lucide-react';
import { toast } from 'sonner';

// Enhanced contact form schema with honeypot fields
const contactFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  email: z.string().email('Invalid email address').max(255, 'Email too long'),
  message: z.string().min(10, 'Message must be at least 10 characters').max(2000, 'Message too long'),
  // Honeypot fields - hidden from users
  website: z.string().max(0).optional(),
  phone: z.string().max(0).optional(),
});

type ContactFormValues = z.infer<typeof contactFormSchema>;

interface ContactFormProps {
  chapterSlug: string;
}

export function ContactFormWithSpamProtection({ chapterSlug }: ContactFormProps) {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formStartTime, setFormStartTime] = useState<number>(0);
  const [isRateLimited, setIsRateLimited] = useState(false);
  
  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: '',
      email: '',
      message: '',
      website: '', // Honeypot
      phone: '', // Honeypot
    },
  });
  
  // Record when form starts being filled
  useEffect(() => {
    setFormStartTime(Date.now());
  }, []);
  
  const { mutate, isPending } = useMutation({
    mutationFn: async (data: ContactFormValues) => {
      const response = await fetch(`/api/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          chapterSlug,
          formStartTime,
        }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        if (response.status === 429) {
          setIsRateLimited(true);
        }
        throw new Error(result.error || 'Failed to send message');
      }
      
      return result;
    },
    onSuccess: () => {
      toast.success('Message sent successfully!');
      form.reset();
      setIsSubmitted(true);
      setFormStartTime(Date.now()); // Reset timing for potential new submission
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to send message');
    },
  });
  
  function onSubmit(data: ContactFormValues) {
    // Additional client-side validation
    if (data.website || data.phone) {
      // Honeypot triggered - silently fail
      return;
    }
    
    mutate(data);
  }
  
  if (isRateLimited) {
    return (
      <Card className="w-full mb-8 border-orange-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-700">
            <Shield className="h-5 w-5" />
            Rate Limited
          </CardTitle>
          <CardDescription>
            You&apos;ve submitted too many messages recently. Please wait 15 minutes before trying again.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button 
            variant="outline" 
            onClick={() => {
              setIsRateLimited(false);
              setIsSubmitted(false);
            }}
          >
            Try Again Later
          </Button>
        </CardFooter>
      </Card>
    );
  }
  
  if (isSubmitted) {
    return (
      <Card className="w-full mb-8">
        <CardHeader>
          <CardTitle>Thank You!</CardTitle>
          <CardDescription>
            Your message has been sent to the chapter. They will get back to you soon.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button variant="outline" onClick={() => setIsSubmitted(false)}>
            Send Another Message
          </Button>
        </CardFooter>
      </Card>
    );
  }
  
  return (
    <Card className="w-full mb-8">
      <CardHeader>
        <CardTitle>Contact Us</CardTitle>
        <CardDescription>
          Have questions about our chapter? Fill out the form below and we&apos;ll get back to you.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Your name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="your.email@example.com" {...field} />
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
                      placeholder="Write your message here..."
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Honeypot fields - hidden from users */}
            <div style={{ display: 'none' }}>
              <FormField
                control={form.control}
                name="website"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Website (leave blank)</FormLabel>
                    <FormControl>
                      <Input {...field} tabIndex={-1} autoComplete="off" />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone (leave blank)</FormLabel>
                    <FormControl>
                      <Input {...field} tabIndex={-1} autoComplete="off" />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                'Send Message'
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}