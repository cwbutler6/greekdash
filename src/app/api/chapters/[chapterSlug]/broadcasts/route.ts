import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/mail";
import { sendSms } from "@/lib/sms";
import { requireChapterAccess } from "@/lib/auth";
import { MembershipRole } from "@/generated/prisma";

// Schema validation for broadcast request
const broadcastSchema = z.object({
  subject: z.string().min(1, "Subject is required").max(100, "Subject cannot exceed 100 characters"),
  message: z.string().min(1, "Message content is required").max(5000, "Message cannot exceed 5000 characters"),
  recipientFilter: z.enum(["all", "admins", "members"]).optional().default("all"),
  shouldSendEmail: z.boolean().optional().default(true),
  shouldSendSms: z.boolean().optional().default(false),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ chapterSlug: string }> }
) {
  try {
    // Extract and validate chapterSlug
    const { chapterSlug } = await params;
    
    if (!chapterSlug) {
      return NextResponse.json({ message: "Chapter slug is required" }, { status: 400 });
    }

    // Authorize the request (only ADMIN or OWNER can send broadcasts)
    const { membership } = await requireChapterAccess(chapterSlug);
    
    // Check if user has admin privileges
    if (membership.role !== "ADMIN" && membership.role !== "OWNER") {
      return NextResponse.json(
        { message: "Only chapter administrators can send broadcasts" },
        { status: 403 }
      );
    }
    
    // Get the chapter details
    const chapter = await prisma.chapter.findUnique({
      where: { slug: chapterSlug },
      select: {
        id: true,
        name: true,
        slug: true,
      }
    });
    
    if (!chapter) {
      return NextResponse.json(
        { message: "Chapter not found" },
        { status: 404 }
      );
    }
    
    // Parse and validate request body
    const body = await request.json();
    const validationResult = broadcastSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { message: "Invalid request data", errors: validationResult.error.format() },
        { status: 400 }
      );
    }
    
    const { subject, message, recipientFilter, shouldSendEmail, shouldSendSms } = validationResult.data;
    
    // Ensure at least one delivery method is selected
    if (!shouldSendEmail && !shouldSendSms) {
      return NextResponse.json(
        { message: "At least one delivery method (email or SMS) must be selected" },
        { status: 400 }
      );
    }
    
    // Get the sender's information
    const sender = await prisma.user.findUnique({
      where: { id: membership.userId },
      select: { name: true, email: true },
    });
    
    if (!sender) {
      return NextResponse.json(
        { message: "Sender information not found" },
        { status: 404 }
      );
    }
    
    // Get chapter member emails based on the filter
    const roleFilter = (() => {
      switch (recipientFilter) {
        case "admins":
          return { in: [MembershipRole.ADMIN, MembershipRole.OWNER] };
        case "members":
          return { in: [MembershipRole.MEMBER] };
        default:
          return { notIn: [MembershipRole.PENDING_MEMBER] }; // "all" except pending
      }
    })();
    
    const members = await prisma.membership.findMany({
      where: {
        chapterId: chapter.id,
        role: roleFilter,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        profile: {
          select: {
            id: true,
            phone: true,
            phoneVerified: true,
            smsEnabled: true,
          },
        },
      },
    });
    
    if (members.length === 0) {
      return NextResponse.json(
        { message: "No recipients found matching the filter criteria" },
        { status: 400 }
      );
    }
    
    // Prepare recipient lists
    const emailRecipients = shouldSendEmail ? members
      .filter(member => member.user.email) // Filter out any null emails
      .map(member => ({
        email: member.user.email as string,
        name: member.user.name || "",
        userId: member.user.id,
      })) : [];
      
    const smsRecipients = shouldSendSms ? members
      .filter(member => 
        member.profile?.phone && 
        member.profile.phoneVerified && 
        member.profile.smsEnabled
      ) // Only include verified phones that have opted in
      .map(member => ({
        phone: member.profile?.phone as string,
        name: member.user.name || "",
        userId: member.user.id,
        profileId: member.profile?.id,
      })) : [];
    
    // Create an audit log entry for the broadcast
    await prisma.auditLog.create({
      data: {
        userId: membership.userId,
        chapterId: chapter.id,
        action: "CHAPTER_BROADCAST",
        targetType: "CHAPTER",
        targetId: chapter.id,
        metadata: {
          emailRecipientCount: emailRecipients.length,
          smsRecipientCount: smsRecipients.length,
          subject,
          recipientFilter,
          deliveryMethods: {
            email: shouldSendEmail,
            sms: shouldSendSms,
          },
          timestamp: new Date().toISOString(),
        },
      },
    });
    
    // Process results tracking
    let emailsSent = 0;
    let smsSent = 0;
    const errors: string[] = [];
    
    // Send emails to recipients in batches to avoid rate limits
    if (shouldSendEmail && emailRecipients.length > 0) {
      const batchSize = 10;
      // Define a specific type for email promise results instead of using 'any'
      type EmailPromiseResult = { messageLog: { id: string } | null, success: boolean };
      const emailPromises: Promise<EmailPromiseResult>[] = [];
      
      for (let i = 0; i < emailRecipients.length; i += batchSize) {
        const batch = emailRecipients.slice(i, i + batchSize);
        
        for (const recipient of batch) {
          emailPromises.push(
            sendEmail(recipient.email, 'chapterBroadcast', {
              chapterName: chapter.name,
              subject,
              message,
              senderName: sender.name || 'Chapter Admin',
            }).then(() => {
              // Log the email in the database
              return { success: true, messageLog: null } as EmailPromiseResult;
            }).then(() => {
              return prisma.messageLog.create({
                data: {
                  messageId: `email-${Date.now()}-${recipient.userId}`, // Generate a unique ID
                  type: 'EMAIL',
                  recipient: recipient.email,
                  content: message,
                  status: 'sent',
                  chapterId: chapter.id,
                },
              }).then((messageLog) => {
                emailsSent++;
                return { success: true, messageLog };
              });
            }).catch((error: Error) => {
              errors.push(`Failed to send email to ${recipient.email}: ${error.message}`);
              return { success: false, messageLog: null } as EmailPromiseResult;
            })
          );
        }
        
        // Wait for each batch to complete before starting the next one
        if (emailPromises.length >= batchSize) {
          await Promise.all(emailPromises);
          emailPromises.length = 0;
        }
      }
      
      // Process any remaining emails in the final batch
      if (emailPromises.length > 0) {
        await Promise.all(emailPromises);
      }
    }
    
    // Send SMS to recipients
    if (shouldSendSms && smsRecipients.length > 0) {
      // Define type for SMS operation result to match the sendSms function return type
      type SmsResult = { 
        success: boolean; 
        messageId?: string; 
        status?: string; 
        error?: string 
      };
      
      const smsPromises = smsRecipients.map(recipient => {
        // Format the SMS message (shorter and without HTML)
        const smsBody = `${subject}: ${message.slice(0, 1500)}`; // Limit SMS length
        
        return sendSms({
          to: recipient.phone,
          body: smsBody,
          chapterSlug,
        }).then((result: SmsResult) => {
          if (result.success) {
            smsSent++;
          } else {
            errors.push(`Failed to send SMS to ${recipient.phone}: ${result.error || 'Unknown error'}`);
          }
          return result; // Return the result to maintain the proper type
        }).catch((error: Error) => {
          errors.push(`Error sending SMS to ${recipient.phone}: ${error.message}`);
          // Return a failed result to maintain the Promise type
          return {
            success: false,
            error: error.message
          } as SmsResult;
        });
      });
      
      await Promise.all(smsPromises);
    }
    
    return NextResponse.json({
      message: `Broadcast sent to ${emailsSent + smsSent} recipients (${emailsSent} emails, ${smsSent} SMS)`,
      emailsSent,
      smsSent,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Error sending broadcast:", error);
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes("Unauthorized")) {
        return NextResponse.json(
          { message: "You don't have permission to send broadcasts for this chapter" },
          { status: 403 }
        );
      }
    }
    
    return NextResponse.json(
      { message: "An error occurred while sending the broadcast" },
      { status: 500 }
    );
  }
}
