import { NextResponse } from "next/server"
import { z } from "zod"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"

// Define validation schema
const feedbackSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  message: z.string().min(10),
  type: z.enum(["feedback", "bug", "feature", "support"]),
  userId: z.string().nullable().optional(),
  chapterSlug: z.string().nullable().optional(),
  screenshot: z.string().nullable().optional(),
})

export async function POST(request: Request) {
  try {
    // Parse the request body
    const body = await request.json()
    
    // Validate the data
    const result = feedbackSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: result.error.format() },
        { status: 400 }
      )
    }
    
    const { name, email, message, type, userId, chapterSlug, screenshot } = result.data
    
    // Get user from session if available
    const session = await getServerSession(authOptions)
    const authenticatedUserId = session?.user?.id
    
    // Create a new feedback request in the database
    const feedbackRequest = await prisma.feedbackRequest.create({
      data: {
        name,
        email,
        message,
        type,
        chapterSlug,
        screenshot,
        // Only use the userId if it matches the authenticated user
        userId: authenticatedUserId === userId ? userId : authenticatedUserId || null,
      },
    })
    
    // Here you could add logic to send an email notification
    // Example: await sendNotificationEmail(feedbackRequest)
    
    return NextResponse.json(
      { success: true, feedbackId: feedbackRequest.id },
      { status: 201 }
    )
  } catch (error) {
    console.error("Error processing feedback request:", error)
    return NextResponse.json(
      { error: "Failed to process feedback request" },
      { status: 500 }
    )
  }
}
