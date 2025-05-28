import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { z } from 'zod';
import { Resend } from 'resend';
import twilio from 'twilio';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth-options';

// Initialize email and SMS clients
const resend = new Resend(process.env.RESEND_API_KEY);
const twilioClient = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;

// Define communication types
enum CommunicationType {
  EMAIL = 'EMAIL',
  SMS = 'SMS',
}

// Define message schema for type safety
const communicateRequestSchema = z.object({
  chapterSlug: z.string().min(1),
  recipientIds: z.array(z.string()).min(1).max(50),
  subject: z.string().min(1).max(100),
  message: z.string().min(1).max(5000),
  communicationType: z.enum([CommunicationType.EMAIL, CommunicationType.SMS]),
});

export async function POST(request: NextRequest) {
  try {
    // Authenticate the user
    const authSession = await getServerSession(authOptions);
    
    if (!authSession?.user) {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = communicateRequestSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error.format() },
        { status: 400 }
      );
    }
    
    const { chapterSlug, recipientIds, subject, message, communicationType } = validationResult.data;
    
    // Verify the sender is a member of the chapter
    const sender = await prisma.user.findFirst({
      where: { 
        email: authSession.user.email as string,
        memberships: {
          some: {
            chapter: { slug: chapterSlug },
            role: { not: 'PENDING_MEMBER' }
          }
        }
      },
      include: {
        memberships: {
          where: {
            chapter: { slug: chapterSlug }
          },
          include: {
            chapter: true
          }
        }
      }
    });
    
    if (!sender || sender.memberships.length === 0) {
      return NextResponse.json(
        { error: 'You are not a member of this chapter' },
        { status: 403 }
      );
    }

    const chapter = sender.memberships[0].chapter;
    
    // Get the recipients who are members of the same chapter
    const recipients = await prisma.profile.findMany({
      where: {
        id: { in: recipientIds },
        chapter: { slug: chapterSlug }
      },
      include: {
        user: true
      }
    });
    
    if (recipients.length === 0) {
      return NextResponse.json(
        { error: 'No valid recipients found' },
        { status: 400 }
      );
    }
    
    // Process message sending based on communication type
    const successfulSends = [];
    const failedSends = [];
    
    for (const recipient of recipients) {
      try {
        let messageId = '';
        
        if (communicationType === CommunicationType.EMAIL) {
          // Send email via Resend
          if (!recipient.user.email) {
            failedSends.push({
              recipientId: recipient.id,
              error: 'No email address available'
            });
            continue;
          }
          
          const emailResult = await resend.emails.send({
            from: `${chapter.name} via GreekDash <noreply@greekdash.com>`,
            to: recipient.user.email,
            subject: subject,
            text: `Message from ${sender.name}: ${message}`,
            html: `
              <div>
                <h2>Message from ${sender.name}</h2>
                <p>${message}</p>
                <hr />
                <p>This message was sent via GreekDash by a member of ${chapter.name}.</p>
              </div>
            `,
          });
          
          // The Resend API response contains the ID in the data object
          messageId = emailResult.data?.id || '';
          
        } else if (communicationType === CommunicationType.SMS) {
          // Send SMS via Twilio
          if (!recipient.phone || !recipient.phoneVerified || !recipient.smsEnabled) {
            failedSends.push({
              recipientId: recipient.id,
              error: 'SMS not available or enabled for this recipient'
            });
            continue;
          }
          
          if (!twilioClient || !process.env.TWILIO_PHONE_NUMBER) {
            throw new Error('Twilio is not properly configured');
          }
          
          const smsResult = await twilioClient.messages.create({
            body: `Message from ${sender.name} (${chapter.name}): ${message}`,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: recipient.phone
          });
          
          messageId = smsResult.sid;
        }
        
        // Log the message in the database
        await prisma.messageLog.create({
          data: {
            messageId,
            type: communicationType,
            recipient: communicationType === CommunicationType.EMAIL 
              ? recipient.user.email || ''
              : recipient.phone || '',
            content: message,
            status: 'SENT',
            chapterId: chapter.id,
          }
        });
        
        successfulSends.push({
          recipientId: recipient.id,
          recipientName: recipient.user.name,
          messageId
        });
        
      } catch (err) {
        console.error(`Failed to send message to recipient ${recipient.id}:`, err);
        failedSends.push({
          recipientId: recipient.id,
          error: err instanceof Error ? err.message : 'Unknown error'
        });
      }
    }
    
    // Return the results
    return NextResponse.json({
      success: successfulSends.length > 0,
      totalRecipients: recipients.length,
      successfulSends,
      failedSends
    });
    
  } catch (error) {
    console.error('Error sending messages:', error);
    return NextResponse.json(
      { error: 'Failed to send messages', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
