import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { financeService } from "@/lib/services/finance-service";
import { authOptions } from "@/lib/auth";
import { duesPaymentSchema, bulkDuesPaymentSchema } from "@/lib/validations/finance";
import { prisma } from "@/lib/db";
import { MembershipRole } from "@/generated/prisma";

// GET /api/chapters/[chapterSlug]/finance/dues - Get all dues payments for a chapter
export async function GET(
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

    // Check if we're filtering for a specific user
    const url = new URL(request.url);
    const userId = url.searchParams.get("userId");
    const status = url.searchParams.get("status");
    const stats = url.searchParams.get("stats") === "true";
    
    if (stats) {
      // Get dues payment stats
      const totalCollectedResult = await prisma.duesPayment.aggregate({
        where: {
          chapterId: chapter.id,
          paidAt: { not: null },
        },
        _sum: { amount: true },
        _count: true,
      });
      
      const totalPendingResult = await prisma.duesPayment.aggregate({
        where: {
          chapterId: chapter.id,
          paidAt: null,
        },
        _sum: { amount: true },
        _count: true,
      });
      
      const recentPayments = await prisma.duesPayment.findMany({
        where: { chapterId: chapter.id },
        orderBy: { dueDate: "desc" },
        take: 5,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
      });
      
      return NextResponse.json({
        totalCollected: totalCollectedResult._sum.amount || 0,
        totalPaidCount: totalCollectedResult._count,
        totalPending: totalPendingResult._sum.amount || 0,
        totalPendingCount: totalPendingResult._count,
        recentPayments,
      });
    }
    
    // Retrieve dues payments with appropriate filters
    let duesPayments;
    if (userId) {
      duesPayments = await financeService.getUserDuesPayments(userId, chapter.id);
    } else if (status) {
      const isPaid = status.toLowerCase() === 'paid';
      duesPayments = await prisma.duesPayment.findMany({
        where: {
          chapterId: chapter.id,
          paidAt: isPaid ? { not: null } : null,
        },
        orderBy: { dueDate: "desc" },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
      });
    } else {
      duesPayments = await financeService.getDuesPayments(chapter.id);
    }

    return NextResponse.json(duesPayments);
  } catch (error) {
    console.error("Error fetching dues payments:", error);
    return NextResponse.json(
      { error: "Failed to fetch dues payments" },
      { status: 500 }
    );
  }
}

// POST /api/chapters/[chapterSlug]/finance/dues - Create a new dues payment
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
    
    // Verify chapter exists and user has admin/owner access
    const membership = await prisma.membership.findFirst({
      where: {
        userId: session.user.id,
        chapter: {
          slug: chapterSlug,
        },
        role: { in: [MembershipRole.ADMIN, MembershipRole.OWNER] }, // Only admins and owners can create dues
      },
      include: {
        chapter: true,
      },
    });

    if (!membership) {
      return NextResponse.json({ error: "Chapter not found or access denied" }, { status: 404 });
    }

    const chapter = membership.chapter;

    // Parse and validate request body
    const body = await request.json();
    
    // Check if this is a bulk creation request
    const isBulk = Array.isArray(body.memberIds) && body.memberIds.length > 0;
    
    if (isBulk) {
      // Validate with bulk schema
      const validatedData = bulkDuesPaymentSchema.parse({
        ...body,
        chapterId: chapter.id, // Set the correct chapter ID
      });
      
      // Create bulk dues payments
      const duesPayments = await financeService.createBulkDuesPayments(validatedData);
      return NextResponse.json(duesPayments, { status: 201 });
    } else {
      // Validate with single schema
      const validatedData = duesPaymentSchema.parse({
        ...body,
        chapterId: chapter.id, // Set the correct chapter ID
      });
      
      // Create single dues payment
      const duesPayment = await financeService.createDuesPayment(validatedData);
      return NextResponse.json(duesPayment, { status: 201 });
    }
  } catch (error) {
    console.error("Error creating dues payment:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", issues: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create dues payment" },
      { status: 500 }
    );
  }
}
