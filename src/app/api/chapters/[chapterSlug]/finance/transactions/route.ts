import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { Prisma } from "@/generated/prisma";

import { financeService } from "@/lib/services/finance-service";
import { authOptions } from "@/lib/auth";
import { transactionSchema } from "@/lib/validations/finance";
import { prisma } from "@/lib/db";
import { MembershipRole, TransactionType } from "@/generated/prisma";

// GET /api/chapters/[chapterSlug]/finance/transactions - Get all transactions for a chapter
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

    // Parse filter parameters from URL
    const url = new URL(request.url);
    const startDateParam = url.searchParams.get("startDate");
    const endDateParam = url.searchParams.get("endDate");
    const typeParam = url.searchParams.get("type");
    const limitParam = url.searchParams.get("limit");

    // Build filters
    const filters: {
      startDate?: Date;
      endDate?: Date;
      type?: TransactionType;
    } = {};
    if (startDateParam) filters.startDate = new Date(startDateParam);
    if (endDateParam) filters.endDate = new Date(endDateParam);
    if (typeParam) filters.type = typeParam as TransactionType;

    // Get transactions with filters
    let transactions = await financeService.getTransactions(chapter.id, filters);
    
    // Apply limit if provided
    if (limitParam && !isNaN(Number(limitParam))) {
      const limit = Number(limitParam);
      transactions = transactions.slice(0, limit);
    }

    return NextResponse.json(transactions);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json(
      { error: "Failed to fetch transactions" },
      { status: 500 }
    );
  }
}

// POST /api/chapters/[chapterSlug]/finance/transactions - Create a new transaction
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
        role: { in: [MembershipRole.ADMIN, MembershipRole.OWNER] }, // Only admins and owners can create transactions
      },
      include: {
        chapter: true,
      },
    });

    if (!membership) {
      return NextResponse.json({ error: "Chapter not found or access denied" }, { status: 404 });
    }

    // Parse and validate request body
    const body = await request.json();
    
    // Validate with schema
    const validatedData = transactionSchema.parse({
      ...body,
      chapterId: membership.chapter.id, // Set the correct chapter ID
    });
    
    // Create transaction
    const transaction = await financeService.createTransaction({
      amount: Number(validatedData.amount),
      type: validatedData.type as TransactionType,
      description: typeof validatedData.description === 'string' ? validatedData.description : null,
      metadata: validatedData.metadata ? (validatedData.metadata as Prisma.InputJsonValue) : null,
      chapterId: membership.chapter.id,
      expenseId: validatedData.expenseId as string|| null,
      duesPaymentId: validatedData.duesPaymentId as string || null,
      processedAt: new Date(),
    });

    return NextResponse.json(transaction, { status: 201 });
  } catch (error) {
    console.error("Error creating transaction:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", issues: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create transaction" },
      { status: 500 }
    );
  }
}
