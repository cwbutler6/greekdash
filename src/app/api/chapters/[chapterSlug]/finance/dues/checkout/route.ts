import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { financeService } from "@/lib/services/finance-service";
import { authOptions } from "@/lib/auth";
import { stripePaymentSchema } from "@/lib/validations/finance";
import { prisma } from "@/lib/db";

// POST /api/chapters/[chapterSlug]/finance/dues/checkout - Create a Stripe checkout session for a dues payment
export async function POST(
  request: Request,
  { params }: { params: Promise<{ chapterSlug: string }> }
) {
  try {
    // Validate session and check chapter access
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get chapter from slug in URL
    const { chapterSlug } = await params;
    
    // Verify chapter exists and user has access
    const chapter = await prisma.chapter.findFirst({
      where: {
        slug: chapterSlug,
        memberships: {
          some: {
            userId: session.user.id,
          },
        },
      },
    });

    if (!chapter) {
      return NextResponse.json({ error: "Chapter not found or access denied" }, { status: 404 });
    }

    // Parse and validate request body
    const body = await request.json();
    
    // Validate that the dues payment exists and belongs to this chapter
    const duesPayment = await prisma.duesPayment.findFirst({
      where: {
        id: body.duesPaymentId,
        chapterId: chapter.id,
      },
    });

    if (!duesPayment) {
      return NextResponse.json({ error: "Dues payment not found" }, { status: 404 });
    }
    
    // Validate with schema
    const validatedData = stripePaymentSchema.parse({
      ...body,
      chapterId: chapter.id, // Ensure correct chapter ID
    });
    
    // Create checkout session
    const checkoutSession = await financeService.createStripeCheckoutSession(
      validatedData.duesPaymentId,
      chapter.id
    );

    return NextResponse.json(checkoutSession);
  } catch (error) {
    console.error("Error creating checkout session:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", issues: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
