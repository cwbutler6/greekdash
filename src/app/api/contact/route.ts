import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';

// Contact form schema validation
const contactFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
  chapterSlug: z.string().min(1, 'Chapter slug is required'),
});

export async function POST(request: NextRequest) {
  try {
    // Parse and validate the request body
    const body = await request.json();
    const validatedData = contactFormSchema.parse(body);
    
    // Find the chapter by slug
    const chapter = await prisma.chapter.findUnique({
      where: { slug: validatedData.chapterSlug },
      select: { id: true }
    });
    
    if (!chapter) {
      return NextResponse.json(
        { error: 'Chapter not found' },
        { status: 404 }
      );
    }
    
    // Create the contact message
    const contactMessage = await prisma.contactMessage.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        message: validatedData.message,
        chapterId: chapter.id,
      },
    });
    
    return NextResponse.json(
      { success: true, id: contactMessage.id },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error submitting contact form:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to submit contact form' },
      { status: 500 }
    );
  }
}
