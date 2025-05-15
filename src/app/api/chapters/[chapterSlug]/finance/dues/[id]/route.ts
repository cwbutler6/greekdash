import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { financeService } from "@/lib/services/finance-service";
import { authOptions } from "@/lib/auth";
import { duesPaymentSchema } from "@/lib/validations/finance";
import { prisma } from "@/lib/db";
import { MembershipRole } from "@/generated/prisma";

// GET /api/chapters/[chapterSlug]/finance/dues/[id] - Get a dues payment by ID
export async function GET(
  request: Request,
  { params }: { params: Promise<{ chapterSlug: string; id: string }> }
) {
  try {
    // Validate session and check chapter access
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get chapter from slug and dues payment ID from params
    const { chapterSlug, id } = await params;
    
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
    
    // Get dues payment
    const duesPayment = await financeService.getDuesPayment(id, chapter.id);
    if (!duesPayment) {
      return NextResponse.json({ error: "Dues payment not found" }, { status: 404 });
    }

    return NextResponse.json(duesPayment);
  } catch (error) {
    console.error("Error fetching dues payment:", error);
    return NextResponse.json(
      { error: "Failed to fetch dues payment" },
      { status: 500 }
    );
  }
}

// PATCH /api/chapters/[chapterSlug]/finance/dues/[id] - Update a dues payment
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ chapterSlug: string; id: string }> }
) {
  try {
    // Validate session and check chapter access
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get chapter from slug and dues payment ID from params
    const { chapterSlug, id } = await params;
    
    // Verify chapter exists and user has admin/owner access
    const membership = await prisma.membership.findFirst({
      where: {
        userId: session.user.id,
        chapter: {
          slug: chapterSlug,
        },
        role: { in: [MembershipRole.ADMIN, MembershipRole.OWNER] }, // Only admins and owners can update dues
      },
      include: {
        chapter: true,
      },
    });

    if (!membership) {
      return NextResponse.json({ error: "Chapter not found or access denied" }, { status: 404 });
    }
    
    // Parse request body
    const body = await request.json();
    
    // Validate with partial schema
    const validatedData = duesPaymentSchema.partial().parse(body);
    
    // Update dues payment
    const duesPayment = await financeService.updateDuesPayment(
      id,
      membership.chapter.id,
      validatedData
    );

    return NextResponse.json(duesPayment);
  } catch (error) {
    console.error("Error updating dues payment:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", issues: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to update dues payment" },
      { status: 500 }
    );
  }
}

// DELETE /api/chapters/[chapterSlug]/finance/dues/[id] - Delete a dues payment
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ chapterSlug: string; id: string }> }
) {
  try {
    // Validate session and check chapter access
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get chapter from slug and dues payment ID from params
    const { chapterSlug, id } = await params;
    
    // Verify chapter exists and user has admin/owner access
    const membership = await prisma.membership.findFirst({
      where: {
        userId: session.user.id,
        chapter: {
          slug: chapterSlug,
        },
        role: { in: [MembershipRole.ADMIN, MembershipRole.OWNER] }, // Only admins and owners can delete dues
      },
      include: {
        chapter: true,
      },
    });

    if (!membership) {
      return NextResponse.json({ error: "Chapter not found or access denied" }, { status: 404 });
    }
    
    // Delete dues payment
    await financeService.deleteDuesPayment(id, membership.chapter.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting dues payment:", error);
    return NextResponse.json(
      { error: "Failed to delete dues payment" },
      { status: 500 }
    );
  }
}
