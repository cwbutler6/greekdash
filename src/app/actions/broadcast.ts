'use server';

import { z } from 'zod';
import { prisma } from '@/lib/db';
import { sendSms } from '@/lib/sms';
import { auth } from '@/lib/auth';
import { sendEmail } from '@/lib/mail';
import { MembershipRole } from '@prisma/client';
import { revalidatePath } from 'next/cache';

const BroadcastSchema = z.object({
  subject: z.string().min(1, { message: 'Subject is required' }),
  message: z.string().min(1, { message: 'Message is required' }),
  sendSms: z.boolean().default(false),
  sendEmail: z.boolean().default(true),
  targetRoles: z.array(z.nativeEnum(MembershipRole)).default([MembershipRole.MEMBER, MembershipRole.ADMIN, MembershipRole.OWNER]),
});

export type BroadcastFormData = z.infer<typeof BroadcastSchema>;

interface BroadcastResult {
  emailsSent: number;
  smsSent: number;
  errors: string[];
}

export async function sendBroadcast(formData: BroadcastFormData, chapterSlug: string): Promise<{ success: boolean; result?: BroadcastResult; error?: string }> {
  const session = await auth();
  
  if (!session?.user?.id) {
    return {
      success: false,
      error: 'You must be signed in to send broadcasts',
    };
  }

  try {
    const validatedData = BroadcastSchema.parse(formData);
    
    // Check if user has admin rights in this chapter
    const membership = await prisma.membership.findFirst({
      where: {
        userId: session.user.id,
        chapter: {
          slug: chapterSlug,
        },
        role: {
          in: [MembershipRole.ADMIN, MembershipRole.OWNER],
        },
      },
      include: {
        chapter: true,
      },
    });

    if (!membership) {
      return {
        success: false,
        error: 'You do not have permission to send broadcasts in this chapter',
      };
    }

    // Get all members with the target roles
    const memberships = await prisma.membership.findMany({
      where: {
        chapterId: membership.chapterId,
        role: {
          in: validatedData.targetRoles,
        },
      },
      include: {
        user: true,
        profile: true,
      },
    });

    const result: BroadcastResult = {
      emailsSent: 0,
      smsSent: 0,
      errors: [],
    };

    // Process each member
    for (const memberInfo of memberships) {
      // Skip if user or profile is missing
      if (!memberInfo.user || !memberInfo.profile) {
        continue;
      }

      // Send email if enabled and user has email
      if (validatedData.sendEmail && memberInfo.user.email) {
        try {
          await sendEmail({
            to: memberInfo.user.email,
            subject: validatedData.subject,
            html: validatedData.message,
            from: `${membership.chapter.name} <noreply@greekdash.com>`,
          });
          
          // Log the email in the database
          await prisma.messageLog.create({
            data: {
              messageId: `email-${Date.now()}-${memberInfo.user.id}`, // Generate a unique ID
              type: 'EMAIL',
              recipient: memberInfo.user.email,
              content: validatedData.message,
              status: 'sent',
              chapterId: membership.chapterId,
            },
          });
          
          result.emailsSent++;
        } catch (error) {
          result.errors.push(`Failed to send email to ${memberInfo.user.email}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Send SMS if enabled and user has verified phone
      if (validatedData.sendSms && memberInfo.profile.phone && memberInfo.profile.smsEnabled) {
        try {
          const smsResult = await sendSms({
            to: memberInfo.profile.phone,
            body: `${validatedData.subject}: ${validatedData.message}`,
            chapterSlug,
          });
          
          if (smsResult.success) {
            result.smsSent++;
          } else {
            result.errors.push(`Failed to send SMS to ${memberInfo.profile.phone}: ${smsResult.error}`);
          }
        } catch (error) {
          result.errors.push(`Failed to send SMS to ${memberInfo.profile.phone}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    }

    // Log the broadcast action
    await prisma.auditLog.create({
      data: {
        action: 'BROADCAST_SENT',
        targetType: 'BROADCAST',
        metadata: {
          emailsSent: result.emailsSent,
          smsSent: result.smsSent,
          subject: validatedData.subject,
        },
        userId: session.user.id,
        chapterId: membership.chapterId,
      },
    });

    // Revalidate the path to reflect changes
    revalidatePath(`/${chapterSlug}/admin/broadcast`);
    
    return {
      success: true,
      result,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0].message,
      };
    }
    
    return {
      success: false,
      error: 'Something went wrong sending the broadcast',
    };
  }
}
