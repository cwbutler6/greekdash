'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { sendBroadcast } from '@/app/actions/broadcast';

interface BroadcastResult {
  emailsSent: number;
  smsSent: number;
  errors: string[];
}
import { toast } from '@/components/ui/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { MembershipRole } from '@/generated/prisma';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { InfoIcon } from 'lucide-react';

const roles = [
  {
    id: MembershipRole.MEMBER,
    label: 'Members',
  },
  {
    id: MembershipRole.ADMIN,
    label: 'Admins',
  },
  {
    id: MembershipRole.OWNER,
    label: 'Owners',
  },
];

// Match the schema defined in the server action
const BroadcastSchema = z.object({
  subject: z.string().min(1, { message: 'Subject is required' }),
  message: z.string().min(1, { message: 'Message is required' }),
  sendSms: z.boolean(),
  sendEmail: z.boolean(),
  targetRoles: z.array(z.nativeEnum(MembershipRole)).min(1, { message: 'Select at least one role' }),
});

// For validating the form inputs
type BroadcastFormValues = z.infer<typeof BroadcastSchema>;

interface BroadcastFormProps {
  chapterSlug: string;
}

export function BroadcastForm({ chapterSlug }: BroadcastFormProps) {
  const [isPending, setIsPending] = useState(false);
  const [result, setResult] = useState<BroadcastResult | null>(null);
  
  const form = useForm<BroadcastFormValues>({
    resolver: zodResolver(BroadcastSchema),
    defaultValues: {
      subject: '',
      message: '',
      sendSms: false,
      sendEmail: true,
      targetRoles: [MembershipRole.MEMBER, MembershipRole.ADMIN, MembershipRole.OWNER],
    },
  });

  async function onSubmit(data: BroadcastFormValues) {
    setIsPending(true);
    setResult(null);
    
    try {
      const response = await sendBroadcast(data, chapterSlug);
      
      if (response.success) {
        toast.success('Your message has been sent to the selected members.', {
          description: 'Broadcast sent successfully',
        });
        setResult(response.result || null);
        form.reset();
      } else {
        toast.error(response.error || 'Failed to send broadcast', {
          description: 'Error sending broadcast',
        });
      }
    } catch (error) {
      console.error('Broadcast error:', error);
      toast.error(`Something went wrong: ${error instanceof Error ? error.message : 'Unknown error'}`, {
        description: 'Error sending broadcast',
      });
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit((data) => {
            // Pass the form data directly to onSubmit
            return onSubmit(data);
          })} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Send Broadcast</CardTitle>
              <CardDescription>
                Send a message to all members of your chapter
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Chapter Meeting This Thursday" 
                        {...field} 
                        disabled={isPending}
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
                        placeholder="Enter your message here..." 
                        {...field} 
                        disabled={isPending}
                        rows={5}
                      />
                    </FormControl>
                    <FormDescription>
                      This message will be sent to all selected members.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Send to</h3>
                <div className="space-y-2">
                  {roles.map((role) => (
                    <FormField
                      key={role.id}
                      control={form.control}
                      name="targetRoles"
                      render={({ field }) => (
                        <FormItem 
                          key={role.id}
                          className="flex flex-row items-start space-x-3 space-y-0"
                        >
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(role.id)}
                              onCheckedChange={(checked) => {
                                const updatedRoles = checked
                                  ? [...field.value, role.id]
                                  : field.value.filter((value) => value !== role.id);
                                field.onChange(updatedRoles);
                              }}
                              disabled={isPending}
                            />
                          </FormControl>
                          <FormLabel className="font-normal">
                            {role.label}
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-4 pt-4">
                <h3 className="text-sm font-medium">Delivery Methods</h3>
                <FormField
                  control={form.control}
                  name="sendEmail"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Email</FormLabel>
                        <FormDescription>
                          Send via email to all members with email addresses
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={isPending || (!form.watch('sendSms'))}
                          aria-readonly={isPending}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="sendSms"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">SMS</FormLabel>
                        <FormDescription>
                          Send via SMS to members with verified phone numbers who have opted in
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={isPending || (!form.watch('sendEmail') && !field.value)}
                          aria-readonly={isPending}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Sending...' : 'Send Broadcast'}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>

      {result && (
        <Alert variant={result.errors.length > 0 ? "destructive" : "default"}>
          <InfoIcon className="h-4 w-4" />
          <AlertTitle>Broadcast Summary</AlertTitle>
          <AlertDescription>
            <div className="space-y-2 mt-2">
              <p>
                <span className="font-medium">Emails sent:</span> {result.emailsSent}
              </p>
              <p>
                <span className="font-medium">SMS sent:</span> {result.smsSent}
              </p>
              
              {result.errors.length > 0 && (
                <div className="mt-4">
                  <p className="font-medium text-amber-600 dark:text-amber-400">
                    There were some errors:
                  </p>
                  <ul className="list-disc pl-5 mt-2 space-y-1 text-sm">
                    {result.errors.slice(0, 5).map((error: string, i: number) => (
                      <li key={i}>{error}</li>
                    ))}
                    {result.errors.length > 5 && (
                      <li>...and {result.errors.length - 5} more errors</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
