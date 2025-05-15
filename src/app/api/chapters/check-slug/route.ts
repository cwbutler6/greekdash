import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  try {
    // Get slug from query params
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");

    if (!slug) {
      return new NextResponse(
        JSON.stringify({ message: "Slug is required", available: false }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Validate slug format to prevent errors
    const slugRegex = /^[a-z0-9-]+$/;
    if (!slugRegex.test(slug)) {
      return new NextResponse(
        JSON.stringify({
          message: "Invalid slug format",
          available: false
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Check if slug already exists
    const chapter = await prisma.chapter.findUnique({
      where: { slug },
    });

    // Return whether slug is available
    return new NextResponse(
      JSON.stringify({ available: !chapter }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error("Error checking slug availability:", error);
    return new NextResponse(
      JSON.stringify({
        message: "An error occurred while checking slug availability",
        available: false
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
