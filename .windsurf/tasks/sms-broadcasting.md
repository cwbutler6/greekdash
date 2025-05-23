# Task: Implement SMS Broadcasting for GreekDash

## Goal

Enhance the broadcasting capabilities of chapter admins by adding SMS notifications alongside existing email functionality for members who have provided phone numbers.

## Features

- Add phone number field to member profiles
- Admin UI for sending SMS broadcasts to chapter members
- Smart broadcasting that uses both email and SMS based on member preferences
- Delivery status tracking for SMS messages
- Opt-out mechanism for SMS notifications

## Stack

- Twilio API for SMS delivery
- Prisma schema updates for storing phone numbers
- Next.js Server Actions for sending messages
- React Hook Form for the broadcast form
- Zod for form validation
- Shadcn UI components for the interface

## Implementation Steps

### 1. Update Database Schema

Check to see if phone number and SMS preferences are already in the Profile model in Prisma:

```prisma
// prisma/schema.prisma

model Profile {
  // Existing fields
  id            String    @id @default(cuid())
  // ... other existing fields
  
  // New fields
  phoneNumber   String?
  phoneVerified Boolean   @default(false)
  smsEnabled    Boolean   @default(true)
  
  // ... existing relations
}
```

If not, add the fields and run migration:

```bash
pnpm prisma migrate dev --name add_phone_number_fields
```

### 2. Install Twilio SDK

```bash
pnpm add twilio
```

### 3. Set up Environment Variables

Add Twilio credentials to `.env`:

```
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number
```

### 4. Create SMS Service

Create a utility service for sending SMS:

```typescript
// src/lib/sms.ts
import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

const client = twilio(accountSid, authToken);

interface SendSmsParams {
  to: string;
  body: string;
  chapterSlug: string; // For multi-tenant tracking
}

export async function sendSms({ to, body, chapterSlug }: SendSmsParams) {
  try {
    const message = await client.messages.create({
      body,
      from: twilioPhoneNumber,
      to,
    });

    // Log the SMS in database for tracking/auditing
    await prisma.messageLog.create({
      data: {
        messageId: message.sid,
        type: 'SMS',
        recipient: to,
        content: body,
        status: message.status,
        chapter: {
          connect: {
            slug: chapterSlug,
          },
        },
      },
    });

    return {
      success: true,
      messageId: message.sid,
      status: message.status,
    };
  } catch (error) {
    console.error('SMS sending failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Function to validate phone number format
export function isValidPhoneNumber(phoneNumber: string): boolean {
  // Basic validation - can be enhanced with library like libphonenumber-js
  const phoneRegex = /^\+[1-9]\d{1,14}$/;
  return phoneRegex.test(phoneNumber);
}
```

### 5. Add Message Log Model to Prisma

```prisma
// prisma/schema.prisma

model MessageLog {
  id        String    @id @default(cuid())
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  messageId String    @unique // External ID (Twilio SID or Resend ID)
  type      String    // "SMS" or "EMAIL"
  recipient String    // Phone number or email
  content   String    @db.Text
  status    String    // Delivery status
  
  // Multi-tenant relationship
  chapter   Chapter   @relation(fields: [chapterId], references: [id])
  chapterId String
  
  @@index([chapterId])
}

model Chapter {
  // Existing fields
  // ...
  
  // Add relation
  messageLog MessageLog[]
}
```

Run migration:

```bash
pnpm prisma migrate dev --name add_message_log
```

### 6. Create User Profile Page to Add Phone Numbers

Add a form component for users to update their phone:

```typescript
// src/components/user/phone-form.tsx
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { updatePhoneSettings } from '@/lib/actions/user-actions';
import { useToast } from '@/components/ui/use-toast';

const PhoneFormSchema = z.object({
  phoneNumber: z.string()
    .min(10, { message: 'Phone number must be at least 10 digits' })
    .regex(/^\+?[0-9]+$/, { message: 'Please enter a valid phone number' }),
  smsEnabled: z.boolean().default(true),
});

export function PhoneSettingsForm({ user }) {
  const { toast } = useToast();
  const [isPending, setIsPending] = useState(false);
  
  const form = useForm<z.infer<typeof PhoneFormSchema>>({
    resolver: zodResolver(PhoneFormSchema),
    defaultValues: {
      phoneNumber: user.phoneNumber || '',
      smsEnabled: user.smsEnabled,
    },
  });
  
  async function onSubmit(values: z.infer<typeof PhoneFormSchema>) {
    setIsPending(true);
    try {
      await updatePhoneSettings(values);
      toast({
        title: 'Settings updated',
        description: 'Your phone settings have been successfully updated.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update phone settings. Please try again.',
        variant: 'destructive',
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
          name="phoneNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone Number</FormLabel>
              <FormControl>
                <Input placeholder="+15551234567" {...field} />
              </FormControl>
              <FormDescription>
                Enter your phone number with country code (e.g., +1 for US)
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
                <FormLabel className="text-base">Enable SMS Notifications</FormLabel>
                <FormDescription>
                  Receive chapter announcements via text message
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
        
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Saving...' : 'Save Settings'}
        </Button>
      </form>
    </Form>
  );
}
```

### 7. Create Server Action for Phone Settings

```typescript
// src/lib/actions/user-actions.ts
'use server';

import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { isValidPhoneNumber } from '@/lib/sms';

const PhoneSettingsSchema = z.object({
  phoneNumber: z.string()
    .min(10, { message: 'Phone number must be at least 10 digits' })
    .regex(/^\+?[0-9]+$/, { message: 'Please enter a valid phone number' }),
  smsEnabled: z.boolean().default(true),
});

export async function updatePhoneSettings(formData: z.infer<typeof PhoneSettingsSchema>) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }
  
  const validatedData = PhoneSettingsSchema.parse(formData);
  
  // Normalize phone number to E.164 format
  let phoneNumber = validatedData.phoneNumber;
  if (!phoneNumber.startsWith('+')) {
    phoneNumber = `+${phoneNumber}`;
  }
  
  if (!isValidPhoneNumber(phoneNumber)) {
    throw new Error('Invalid phone number format');
  }
  
  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      phoneNumber,
      smsEnabled: validatedData.smsEnabled,
    },
  });
  
  return { success: true };
}
```

### 8. Create Admin Broadcast UI

Create a new page for chapter admins to send broadcasts:

```typescript
// src/app/(chapter-admin)/[chapterSlug]/admin/broadcast/page.tsx
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { BroadcastForm } from '@/components/admin/broadcast-form';
import { notFound } from 'next/navigation';

export default async function BroadcastPage({
  params,
}: {
  params: Promise<{ chapterSlug: string }>;
}) {
  const { chapterSlug } = await params;
  const session = await auth();
  
  if (!session?.user?.id) {
    return notFound();
  }
  
  // Verify admin access
  const userChapterRole = await prisma.userChapter.findFirst({
    where: {
      userId: session.user.id,
      chapter: {
        slug: chapterSlug,
      },
      role: 'ADMIN',
    },
  });
  
  if (!userChapterRole) {
    return notFound();
  }
  
  // Get chapter members count with phone numbers
  const memberStats = await prisma.$transaction([
    prisma.userChapter.count({
      where: {
        chapter: { slug: chapterSlug },
      },
    }),
    prisma.userChapter.count({
      where: {
        chapter: { slug: chapterSlug },
        user: {
          phoneNumber: { not: null },
          smsEnabled: true,
        },
      },
    }),
  ]);
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Broadcast Messages</h1>
        <p className="text-muted-foreground">
          Send important announcements to chapter members via email and SMS
        </p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border p-4">
          <h3 className="font-medium">Chapter Stats</h3>
          <ul className="mt-2 space-y-1">
            <li>Total members: {memberStats[0]}</li>
            <li>Members with SMS enabled: {memberStats[1]}</li>
          </ul>
        </div>
      </div>
      
      <BroadcastForm chapterSlug={chapterSlug} />
    </div>
  );
}
```

### 9. Create Broadcast Form Component

```typescript
// src/components/admin/broadcast-form.tsx
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent } from '@/components/ui/card';
import { sendBroadcast } from '@/lib/actions/broadcast-actions';
import { useToast } from '@/components/ui/use-toast';

const BroadcastFormSchema = z.object({
  subject: z.string().min(2, { message: 'Subject is required' }),
  message: z.string().min(10, { message: 'Message must be at least 10 characters' }),
  sendEmail: z.boolean().default(true),
  sendSms: z.boolean().default(false),
});

export function BroadcastForm({ chapterSlug }: { chapterSlug: string }) {
  const { toast } = useToast();
  const [isPending, setIsPending] = useState(false);
  const [result, setResult] = useState<any>(null);
  
  const form = useForm<z.infer<typeof BroadcastFormSchema>>({
    resolver: zodResolver(BroadcastFormSchema),
    defaultValues: {
      subject: '',
      message: '',
      sendEmail: true,
      sendSms: false,
    },
  });
  
  async function onSubmit(values: z.infer<typeof BroadcastFormSchema>) {
    if (!values.sendEmail && !values.sendSms) {
      toast({
        title: 'Error',
        description: 'You must select at least one delivery method (email or SMS)',
        variant: 'destructive',
      });
      return;
    }
    
    setIsPending(true);
    setResult(null);
    
    try {
      const response = await sendBroadcast({
        ...values,
        chapterSlug,
      });
      
      setResult(response);
      
      toast({
        title: 'Broadcast sent',
        description: `Your message has been sent to ${response.emailCount + response.smsCount} recipients.`,
      });
      
      // Reset form on success
      form.reset();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to send broadcast',
        variant: 'destructive',
      });
    } finally {
      setIsPending(false);
    }
  }
  
  return (
    <Card>
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subject</FormLabel>
                  <FormControl>
                    <Input placeholder="Important chapter announcement" {...field} />
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
                      placeholder="Type your announcement here..." 
                      className="min-h-[120px]" 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    This message will be sent via the selected delivery methods.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex flex-col space-y-4 sm:flex-row sm:space-x-6 sm:space-y-0">
              <FormField
                control={form.control}
                name="sendEmail"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2">
                    <FormControl>
                      <Checkbox 
                        checked={field.value} 
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="text-sm font-normal">
                      Send via Email
                    </FormLabel>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="sendSms"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2">
                    <FormControl>
                      <Checkbox 
                        checked={field.value} 
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="text-sm font-normal">
                      Send via SMS
                    </FormLabel>
                  </FormItem>
                )}
              />
            </div>
            
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Sending...' : 'Send Broadcast'}
            </Button>
          </form>
        </Form>
        
        {result && (
          <div className="mt-6 rounded-md bg-muted p-4">
            <h4 className="font-medium">Broadcast Results</h4>
            <ul className="mt-2 space-y-1 text-sm">
              <li>Emails sent: {result.emailCount}</li>
              <li>SMS sent: {result.smsCount}</li>
              {result.failures > 0 && (
                <li className="text-destructive">Failed deliveries: {result.failures}</li>
              )}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

### 10. Create Server Action for Broadcast

```typescript
// src/lib/actions/broadcast-actions.ts
'use server';

import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';
import { sendSms } from '@/lib/sms';

const BroadcastSchema = z.object({
  subject: z.string().min(2),
  message: z.string().min(10),
  sendEmail: z.boolean().default(true),
  sendSms: z.boolean().default(false),
  chapterSlug: z.string(),
});

export async function sendBroadcast(formData: z.infer<typeof BroadcastSchema>) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }
  
  const validatedData = BroadcastSchema.parse(formData);
  
  // Verify admin access
  const userChapterRole = await prisma.userChapter.findFirst({
    where: {
      userId: session.user.id,
      chapter: {
        slug: validatedData.chapterSlug,
      },
      role: 'ADMIN',
    },
    include: {
      chapter: true,
    },
  });
  
  if (!userChapterRole) {
    throw new Error('Unauthorized: Admin access required');
  }
  
  const chapter = userChapterRole.chapter;
  
  // Get chapter members
  const members = await prisma.userChapter.findMany({
    where: {
      chapter: { slug: validatedData.chapterSlug },
    },
    include: {
      user: true,
    },
  });
  
  let emailCount = 0;
  let smsCount = 0;
  let failures = 0;
  
  // Process emails
  if (validatedData.sendEmail) {
    const emailPromises = members.map(async (member) => {
      try {
        await sendEmail({
          to: member.user.email,
          subject: validatedData.subject,
          html: `
            <div>
              <h2>${validatedData.subject}</h2>
              <p>${validatedData.message.replace(/\n/g, '<br/>')}</p>
              <hr />
              <p>This message was sent from ${chapter.name} via GreekDash.</p>
              <p><small>To manage your notification preferences, please update your profile settings.</small></p>
            </div>
          `,
          chapterSlug: validatedData.chapterSlug,
        });
        
        emailCount++;
        return { success: true };
      } catch (error) {
        failures++;
        console.error('Failed to send email:', error);
        return { success: false, error };
      }
    });
    
    await Promise.all(emailPromises);
  }
  
  // Process SMS
  if (validatedData.sendSms) {
    const smsRecipients = members.filter(
      (member) => member.user.phoneNumber && member.user.smsEnabled
    );
    
    const smsPromises = smsRecipients.map(async (member) => {
      try {
        if (!member.user.phoneNumber) return { success: false };
        
        // Format SMS message: Include subject and message
        const smsBody = `${chapter.name}: ${validatedData.subject}\n\n${validatedData.message}`;
        
        await sendSms({
          to: member.user.phoneNumber,
          body: smsBody,
          chapterSlug: validatedData.chapterSlug,
        });
        
        smsCount++;
        return { success: true };
      } catch (error) {
        failures++;
        console.error('Failed to send SMS:', error);
        return { success: false, error };
      }
    });
    
    await Promise.all(smsPromises);
  }
  
  // Log the broadcast in the database
  await prisma.broadcastLog.create({
    data: {
      subject: validatedData.subject,
      content: validatedData.message,
      emailsSent: emailCount,
      smsSent: smsCount,
      failures,
      sentBy: {
        connect: {
          id: session.user.id,
        },
      },
      chapter: {
        connect: {
          slug: validatedData.chapterSlug,
        },
      },
    },
  });
  
  return {
    success: true,
    emailCount,
    smsCount,
    failures,
  };
}
```

### 11. Add Broadcast Log Model to Prisma

```prisma
// prisma/schema.prisma

model BroadcastLog {
  id         String   @id @default(cuid())
  createdAt  DateTime @default(now())
  subject    String
  content    String   @db.Text
  emailsSent Int      @default(0)
  smsSent    Int      @default(0)
  failures   Int      @default(0)
  
  // Relations
  sentBy     User     @relation(fields: [sentById], references: [id])
  sentById   String
  chapter    Chapter  @relation(fields: [chapterId], references: [id])
  chapterId  String
  
  @@index([chapterId])
  @@index([sentById])
}

model User {
  // Existing fields...
  
  // Add relation
  broadcastsSent BroadcastLog[]
}

model Chapter {
  // Existing fields...
  
  // Add relation
  broadcasts BroadcastLog[]
}
```

Run migration:

```bash
pnpm prisma migrate dev --name add_broadcast_log
```

### 12. Update Navigation to Include Broadcast Link

```typescript
// Update admin navigation to include broadcast link
// This should be added to the appropriate navigation component

{
  name: 'Broadcast',
  href: `/[chapterSlug]/admin/broadcast`,
  icon: MessageSquareIcon,
}
```

### 13. Testing and Verification

1. Test phone number validation
2. Test SMS sending with a test Twilio account
3. Verify message logs are correctly stored
4. Check admin broadcast UI functions properly
5. Verify both email and SMS delivery

## Future Enhancements

- Add message templates
- Schedule broadcasts for future delivery
- SMS response handling
- Analytics dashboard for message delivery rates
- Character count and cost estimation for SMS
