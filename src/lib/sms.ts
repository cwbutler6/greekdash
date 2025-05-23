import twilio from 'twilio';
import { prisma } from '@/lib/db';

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
    // Get chapter by slug for multi-tenant context
    const chapter = await prisma.chapter.findUnique({
      where: { slug: chapterSlug },
    });

    if (!chapter) {
      throw new Error(`Chapter with slug ${chapterSlug} not found`);
    }

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
            id: chapter.id,
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

// We moved the isValidPhoneNumber function to validation.ts
// to avoid importing Twilio in client components
