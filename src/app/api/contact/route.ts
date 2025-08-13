import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';

// Rate limiting store (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Contact form schema with honeypot validation
const contactFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  email: z.string().email('Invalid email address').max(255, 'Email too long'),
  message: z.string().min(10, 'Message must be at least 10 characters').max(2000, 'Message too long'),
  chapterSlug: z.string().min(1, 'Chapter slug is required'),
  // Honeypot fields - should be empty
  website: z.string().max(0, 'Bot detected').optional(),
  phone: z.string().max(0, 'Bot detected').optional(),
  // Time-based validation
  formStartTime: z.number().optional(),
});

// Rate limiting configuration
const RATE_LIMIT = {
  maxRequests: 5, // Max 5 submissions per window
  windowMs: 15 * 60 * 1000, // 15 minutes
  minFormTime: 3000, // Minimum 3 seconds to fill form
};

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  return 'unknown';
}

function checkRateLimit(ip: string): { allowed: boolean; resetTime?: number } {
  const now = Date.now();
  const key = `contact_${ip}`;
  const record = rateLimitStore.get(key);
  
  if (!record || now > record.resetTime) {
    // Reset or create new record
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + RATE_LIMIT.windowMs,
    });
    return { allowed: true };
  }
  
  if (record.count >= RATE_LIMIT.maxRequests) {
    return { allowed: false, resetTime: record.resetTime };
  }
  
  // Increment count
  record.count++;
  rateLimitStore.set(key, record);
  return { allowed: true };
}

function validateFormTiming(formStartTime?: number): boolean {
  if (!formStartTime) return true; // Allow if no timing data
  
  const formDuration = Date.now() - formStartTime;
  return formDuration >= RATE_LIMIT.minFormTime;
}

function sanitizeInput(input: string): string {
  // Remove potentially harmful content
  return input
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .trim();
}

export async function POST(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const clientIP = getClientIP(request);
    
    // Check rate limit
    const rateLimitResult = checkRateLimit(clientIP);
    if (!rateLimitResult.allowed) {
      const resetTime = rateLimitResult.resetTime;
      const waitTime = resetTime ? Math.ceil((resetTime - Date.now()) / 1000 / 60) : 15;
      
      return NextResponse.json(
        { 
          error: `Too many requests. Please try again in ${waitTime} minutes.`,
          rateLimited: true 
        },
        { status: 429 }
      );
    }
    
    // Parse and validate the request body
    const body = await request.json();
    const validatedData = contactFormSchema.parse(body);
    
    // Check honeypot fields
    if (validatedData.website || validatedData.phone) {
      // Log potential bot attempt
      console.warn(`Potential bot submission from IP: ${clientIP}`);
      
      // Return success to avoid revealing honeypot
      return NextResponse.json(
        { success: true, id: 'blocked' },
        { status: 201 }
      );
    }
    
    // Validate form timing
    if (!validateFormTiming(validatedData.formStartTime)) {
      console.warn(`Form submitted too quickly from IP: ${clientIP}`);
      
      return NextResponse.json(
        { error: 'Please take your time filling out the form.' },
        { status: 400 }
      );
    }
    
    // Sanitize inputs
    const sanitizedData = {
      name: sanitizeInput(validatedData.name),
      email: validatedData.email.toLowerCase().trim(),
      message: sanitizeInput(validatedData.message),
      chapterSlug: validatedData.chapterSlug,
    };
    
    // Find the chapter by slug
    const chapter = await prisma.chapter.findUnique({
      where: { slug: sanitizedData.chapterSlug },
      select: { id: true, name: true }
    });
    
    if (!chapter) {
      return NextResponse.json(
        { error: 'Chapter not found' },
        { status: 404 }
      );
    }
    
    // Check for duplicate submissions (same email + chapter in last hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const existingMessage = await prisma.contactMessage.findFirst({
      where: {
        email: sanitizedData.email,
        chapterId: chapter.id,
        createdAt: {
          gte: oneHourAgo,
        },
      },
    });
    
    if (existingMessage) {
      return NextResponse.json(
        { error: 'You have already submitted a message recently. Please wait before submitting again.' },
        { status: 429 }
      );
    }
    
    // Create the contact message
    const contactMessage = await prisma.contactMessage.create({
      data: {
        name: sanitizedData.name,
        email: sanitizedData.email,
        message: sanitizedData.message,
        chapterId: chapter.id,
      },
    });
    
    // TODO: Send notification email to chapter admins
    // This would integrate with the existing email system
    
    return NextResponse.json(
      { success: true, id: contactMessage.id },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error submitting contact form:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid form data', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to submit contact form' },
      { status: 500 }
    );
  }
}
