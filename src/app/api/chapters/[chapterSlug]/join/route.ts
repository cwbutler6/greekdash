import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma";
import { hash } from "bcrypt";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { 
  joinFormLimiter, 
  getClientIP, 
  validateHoneypot, 
  validateFormTiming, 
  sanitizeInput 
} from "@/lib/rate-limit";

// Enhanced validation schema with spam protection
const joinChapterSchema = z.object({
  fullName: z.string().min(3, "Full name must be at least 3 characters").max(100, "Name must be less than 100 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  joinCode: z.string().min(1, "Join code is required"),
  // Honeypot fields
  website: z.string().optional(),
  phone: z.string().optional(),
  // Timing validation
  formStartTime: z.number().optional(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ chapterSlug: string }> }
) {
  try {
    const { chapterSlug } = await params;
    
    // Get client IP for rate limiting
    const clientIP = getClientIP(request);
    
    // Check rate limit (5 attempts per 15 minutes)
    const rateLimitResult = joinFormLimiter.check(clientIP);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { 
          message: "Too many join attempts. Please try again later.",
          rateLimited: true,
          resetTime: rateLimitResult.resetTime
        },
        { status: 429 }
      );
    }
    
    // Parse request body
    const body = await request.json();
    const validationResult = joinChapterSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { message: "Invalid input data", errors: validationResult.error.format() },
        { status: 400 }
      );
    }
    
    const { fullName, email, password, joinCode, website, phone, formStartTime } = validationResult.data;
    
    // Validate honeypot fields
    if (!validateHoneypot({ website, phone }, ['website', 'phone'])) {
      console.warn(`Honeypot triggered for join form from IP: ${clientIP}`);
      return NextResponse.json(
        { message: "Invalid form submission" },
        { status: 400 }
      );
    }
    
    // Validate form timing (minimum 3 seconds)
    if (formStartTime && !validateFormTiming(formStartTime, 3000)) {
      console.warn(`Form submitted too quickly from IP: ${clientIP}`);
      return NextResponse.json(
        { message: "Please take your time filling out the form" },
        { status: 400 }
      );
    }
    
    // Sanitize inputs
    const sanitizedFullName = sanitizeInput(fullName);
    
    // Check if chapter exists
    const chapter = await prisma.chapter.findUnique({
      where: { slug: chapterSlug },
    });
    
    if (!chapter) {
      return NextResponse.json(
        { message: "Chapter not found" },
        { status: 404 }
      );
    }
    
    // Validate join code
    if (chapter.joinCode !== joinCode) {
      return NextResponse.json(
        { message: "Invalid join code" },
        { status: 400 }
      );
    }
    
    // Check for duplicate submissions (same email + chapter within 1 hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentSubmission = await prisma.user.findFirst({
      where: {
        email,
        memberships: {
          some: {
            chapterId: chapter.id,
            createdAt: {
              gte: oneHourAgo,
            },
          },
        },
      },
    });
    
    if (recentSubmission) {
      return NextResponse.json(
        { message: "A recent join request already exists for this email and chapter" },
        { status: 400 }
      );
    }
    
    // Check if user with this email already exists
    let user = await prisma.user.findUnique({
      where: { email },
      include: {
        memberships: {
          where: {
            chapterId: chapter.id,
          },
        },
      },
    });
    
    // If user already has a membership with this chapter, return error
    if (user && user.memberships.length > 0) {
      return NextResponse.json(
        { message: "You are already a member or have a pending request for this chapter" },
        { status: 400 }
      );
    }
    
    // Hash password
    const hashedPassword = await hash(password, 12);
    
    // Start a transaction to create user (if needed) and membership
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // If user doesn't exist, create a new one
      if (!user) {
        // Create user with included memberships
        user = await tx.user.create({
          data: {
            name: sanitizedFullName,
            email,
            password: hashedPassword,
          },
          include: {
            memberships: true,
          },
        });
        
        // TypeScript workaround: ensure the user has memberships array
        user = {
          ...user,
          memberships: [],
        };
      }
      
      // Create membership as PENDING_MEMBER
      const membership = await tx.membership.create({
        data: {
          userId: user!.id,
          chapterId: chapter.id,
          role: "PENDING_MEMBER", // Set as pending member awaiting approval
        },
      });
      
      return { user, membership };
    });
    
    // The user object must exist at this point due to the transaction logic
    if (!result.user) {
      return NextResponse.json(
        { message: "User creation failed during chapter join process" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Your request to join has been submitted and is pending approval",
      userId: result.user.id,
      isPending: true,
    });
    
  } catch (error) {
    console.error("Error in chapter join process:", error);
    return NextResponse.json(
      { message: "An error occurred during the join process" },
      { status: 500 }
    );
  }
}
