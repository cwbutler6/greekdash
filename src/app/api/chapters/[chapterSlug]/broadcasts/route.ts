import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/mail";
import { requireChapterAccess } from "@/lib/auth";
import { MembershipRole } from "@/generated/prisma";

// Schema validation for broadcast request
const broadcastSchema = z.object({
  subject: z.string().min(1, "Subject is required").max(100, "Subject cannot exceed 100 characters"),
  message: z.string().min(1, "Message content is required").max(5000, "Message cannot exceed 5000 characters"),
  recipientFilter: z.enum(["all", "admins", "members"]).optional().default("all"),
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
    
    const { subject, message, recipientFilter } = validationResult.data;
    
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
      },
    });
    
    if (members.length === 0) {
      return NextResponse.json(
        { message: "No recipients found matching the filter criteria" },
        { status: 400 }
      );
    }
    
    // Prepare recipient list
    const recipients = members
      .filter(member => member.user.email) // Filter out any null emails
      .map(member => ({
        email: member.user.email as string,
        name: member.user.name || "",
        userId: member.user.id,
      }));
    
    // Create an audit log entry for the broadcast
    await prisma.auditLog.create({
      data: {
        userId: membership.userId,
        chapterId: chapter.id,
        action: "CHAPTER_BROADCAST",
        targetType: "CHAPTER",
        targetId: chapter.id,
        metadata: {
          recipientCount: recipients.length,
          subject,
          recipientFilter,
          timestamp: new Date().toISOString(),
        },
      },
    });
    
    // Send emails to all recipients in batches to avoid rate limits
    const batchSize = 10;
    const emailPromises = [];
    
    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);
      
      for (const recipient of batch) {
        emailPromises.push(
          sendEmail(recipient.email, "chapterBroadcast", {
            chapterName: chapter.name,
            subject,
            message,
            senderName: sender.name || "Chapter Admin",
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
    
    return NextResponse.json({
      message: `Broadcast email sent to ${recipients.length} recipients`,
      recipientCount: recipients.length,
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
