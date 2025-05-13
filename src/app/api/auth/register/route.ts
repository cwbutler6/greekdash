
import { Prisma } from "@prisma/client";
import { hash } from "bcrypt";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { MembershipRole } from "@/generated/prisma";
import prisma from "@/lib/prisma";

// Validation schema for registration
const registerSchema = z.object({
  fullName: z.string().min(3, "Full name must be at least 3 characters"),
  email: z.string().email("Please enter a valid email address"),
  chapterSlug: z
    .string()
    .min(3, "Chapter URL must be at least 3 characters")
    .max(30, "Chapter URL must be at most 30 characters")
    .regex(/^[a-z0-9-]+$/, "Chapter URL must only contain lowercase letters, numbers, and hyphens")
    .transform(val => val.toLowerCase()),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
});

export async function POST(request: Request) {
  try {
    // Parse request body
    const body = await request.json();
    const validationResult = registerSchema.safeParse(body);
    
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({ 
          message: "Invalid input data", 
          errors: validationResult.error.format() 
        }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    const { fullName, email, chapterSlug, password } = validationResult.data;
    
    // Check if email is already registered
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    
    if (existingUser) {
      return new Response(
        JSON.stringify({ message: "This email is already registered" }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Check if chapter slug is already taken
    const existingChapter = await prisma.chapter.findUnique({
      where: { slug: chapterSlug },
    });
    
    if (existingChapter) {
      return new Response(
        JSON.stringify({ message: "This chapter URL is already taken" }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Hash password
    const hashedPassword = await hash(password, 12);
    
    // Create user, chapter, and membership in a transaction
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Create new user
      const user = await tx.user.create({
        data: {
          name: fullName,
          email,
          password: hashedPassword,
        },
      });
      
      // Create new chapter with an explicit UUID for join code
      const chapter = await tx.chapter.create({
        data: {
          name: fullName.split(' ')[0] + "'s Chapter", // Default name can be changed later
          slug: chapterSlug,
          joinCode: uuidv4(), // Explicitly generate a UUID
        },
      });
      
      // Create membership with OWNER role (highest level)
      const membership = await tx.membership.create({
        data: {
          userId: user.id,
          chapterId: chapter.id,
          role: MembershipRole.OWNER, // Chapter creator becomes the owner
        },
      });
      
      // Create default subscription (free tier)
      const subscription = await tx.subscription.create({
        data: {
          chapterId: chapter.id,
          // Using defaults for the rest (FREE plan, ACTIVE status)
        },
      });
      
      return { user, chapter, membership, subscription };
    });
    
    // Ensure we always return valid JSON with proper headers
    return new Response(
      JSON.stringify({
        message: "Registration successful",
        userId: result.user.id,
        chapterSlug: result.chapter.slug,
      }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
    
  } catch (error) {
    console.error("Error registering user:", error);
    return new Response(
      JSON.stringify({ message: "An error occurred while registering" }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
