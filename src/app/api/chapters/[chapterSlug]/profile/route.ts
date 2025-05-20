import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth-options";

// Schema for profile updates
const profileSchema = z.object({
  name: z.string().min(3, 'Full name must be at least 3 characters'),
  email: z.string().email('Please enter a valid email address').optional(),
  phone: z.string().optional().nullable(),
  major: z.string().optional().nullable(),
  gradYear: z.string()
    .refine(val => !val || /^\d{4}$/.test(val), {
      message: 'Graduation year must be a 4-digit year'
    })
    .optional()
    .nullable(),
  bio: z.string().max(300, 'Bio cannot exceed 300 characters').optional().nullable(),
});

// PUT: Update user profile for specific chapter context
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ chapterSlug: string }> }
) {
  try {
    const { chapterSlug } = await params;
    
    // Get current authenticated user
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Find chapter by slug
    const chapter = await prisma.chapter.findUnique({
      where: { slug: chapterSlug },
    });
    
    if (!chapter) {
      return NextResponse.json(
        { message: "Chapter not found" },
        { status: 404 }
      );
    }
    
    // Verify user has membership in this chapter
    const membership = await prisma.membership.findUnique({
      where: {
        userId_chapterId: {
          userId: session.user.id,
          chapterId: chapter.id,
        },
      },
    });
    
    if (!membership) {
      return NextResponse.json(
        { message: "You are not a member of this chapter" },
        { status: 403 }
      );
    }
    
    // Parse and validate request body
    const body = await request.json();
    const validatedData = profileSchema.safeParse(body);
    
    if (!validatedData.success) {
      return NextResponse.json(
        { message: "Invalid profile data", errors: validatedData.error.errors },
        { status: 400 }
      );
    }
    
    const profileData = validatedData.data;
    
    // Extract profile data that should go in the user record
    const { name } = profileData;
    
    // Update user's basic information
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { name },
    });
    
    // Extract profile data that should go in the chapter-specific profile
    const { phone, major, gradYear, bio } = profileData;
    
    // Convert gradYear to a number if it exists
    const gradYearNum = gradYear ? parseInt(gradYear) : null;
    
    // Check if a profile already exists for this membership
    const existingProfile = await prisma.profile.findUnique({
      where: { membershipId: membership.id }
    });
    
    if (existingProfile) {
      // Update existing profile
      await prisma.profile.update({
        where: { membershipId: membership.id },
        data: {
          phone,
          major,
          gradYear: gradYearNum,
          bio,
        }
      });
    } else {
      // Create new profile
      await prisma.profile.create({
        data: {
          phone,
          major,
          gradYear: gradYearNum,
          bio,
          membership: {
            connect: { id: membership.id }
          },
          user: {
            connect: { id: session.user.id }
          },
          chapter: {
            connect: { id: chapter.id }
          }
        }
      });
    }
    
    // Create an audit log entry with the profile data for future reference
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        chapterId: chapter.id,
        action: "PROFILE_UPDATED",
        targetType: "USER",
        targetId: session.user.id,
        metadata: {
          phone,
          major,
          gradYear,
          bio,
          updatedFields: Object.keys(profileData).filter(key => !!profileData[key as keyof typeof profileData]),
          timestamp: new Date().toISOString(),
        },
      },
    });
    
    return NextResponse.json({
      message: "Profile updated successfully",
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
      },
      profile: {
        phone, 
        major,
        gradYear,
        bio
      }
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { message: "Error updating profile" },
      { status: 500 }
    );
  }
}
