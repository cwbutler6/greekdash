import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { financeService } from "@/lib/services/finance-service";
import { authOptions } from "@/lib/auth";
import { expenseSchema, expenseApprovalSchema } from "@/lib/validations/finance";
import { prisma } from "@/lib/db";
import { MembershipRole, ExpenseStatus } from "@/generated/prisma";

// GET /api/chapters/[chapterSlug]/finance/expenses/[id] - Get an expense by ID
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

    // Get chapter from slug and expense ID from params
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
    
    // Get expense
    const expense = await financeService.getExpense(id, chapter.id);
    if (!expense) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    return NextResponse.json(expense);
  } catch (error) {
    console.error("Error fetching expense:", error);
    return NextResponse.json(
      { error: "Failed to fetch expense" },
      { status: 500 }
    );
  }
}

// PATCH /api/chapters/[chapterSlug]/finance/expenses/[id] - Update an expense
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

    // Get chapter from slug and expense ID from params
    const { chapterSlug, id } = await params;
    
    // Get the expense first to perform permission checks
    const expense = await prisma.expense.findFirst({
      where: {
        id,
        chapter: {
          slug: chapterSlug,
        },
      },
      include: {
        submittedBy: true,
      },
    });

    if (!expense) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }
    
    // Get user's role in the chapter
    const membership = await prisma.membership.findFirst({
      where: {
        userId: session.user.id,
        chapter: {
          slug: chapterSlug,
        },
      },
      select: {
        role: true,
      },
    });

    if (!membership) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }
    
    // Check permissions - Only admins/owners can approve/deny, or the submitter can edit their own expense
    const isAdmin = membership.role === MembershipRole.ADMIN || membership.role === MembershipRole.OWNER;
    const isSubmitter = expense.submittedById === session.user.id;
    
    if (!isAdmin && !isSubmitter) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }
    
    // Get the URL to check if it's an approval endpoint
    const url = new URL(request.url);
    const isApproval = url.searchParams.has("approve");
    
    // Only admins can approve/deny expenses
    if (isApproval && !isAdmin) {
      return NextResponse.json({ error: "Only admins can approve/deny expenses" }, { status: 403 });
    }
    
    // Parse request body
    const body = await request.json();
    
    if (isApproval) {
      // This is an approval/status change request
      const validatedData = expenseApprovalSchema.parse({
        ...body,
        expenseId: id,
        chapterId: expense.chapterId,
      });
      
      // Update expense with approval information
      const updatedExpense = await financeService.updateExpense(id, expense.chapterId, {
        status: validatedData.status,
        approvedById: session.user.id,
        approvedAt: new Date(),
        ...(validatedData.status === "PAID" ? { paidAt: new Date() } : {}),
      });
      
      return NextResponse.json(updatedExpense);
    } else {
      // Regular update - only the submitter can edit their expense before approval
      // or admins can edit any expense
      if (!isSubmitter && !isAdmin) {
        return NextResponse.json({ error: "Only the submitter can edit this expense" }, { status: 403 });
      }
      
      // Non-admins can't change status
      if (!isAdmin && body.status) {
        return NextResponse.json({ error: "Only admins can change expense status" }, { status: 403 });
      }
      
      // Use safeParse for better type safety and error handling
      const result = expenseSchema.partial().safeParse(body);
      
      if (!result.success) {
        return NextResponse.json(
          { error: "Invalid request data", issues: result.error.issues },
          { status: 400 }
        );
      }
      
      // Update expense with properly typed data
      // Apply type assertion to ensure result.data matches the expected type
      const typedData = result.data as {
        title?: string;
        description?: string | null;
        amount?: number;
        receiptUrl?: string | null;
        status?: ExpenseStatus;
        budgetId?: string | null;
      };
      
      const updatedExpense = await financeService.updateExpense(
        id,
        expense.chapterId,
        typedData
      );
      
      return NextResponse.json(updatedExpense);
    }
  } catch (error) {
    console.error("Error updating expense:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", issues: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to update expense" },
      { status: 500 }
    );
  }
}

// DELETE /api/chapters/[chapterSlug]/finance/expenses/[id] - Delete an expense
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

    // Get chapter from slug and expense ID from params
    const { chapterSlug, id } = await params;
    
    // Verify chapter exists and user has admin/owner access
    const membership = await prisma.membership.findFirst({
      where: {
        userId: session.user.id,
        chapter: {
          slug: chapterSlug,
        },
        role: { in: ["ADMIN", "OWNER"] }, // Only admins and owners can delete expenses
      },
      include: {
        chapter: true,
      },
    });

    if (!membership) {
      return NextResponse.json({ error: "Chapter not found or access denied" }, { status: 404 });
    }
    
    // Delete expense
    await financeService.deleteExpense(id, membership.chapter.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting expense:", error);
    return NextResponse.json(
      { error: "Failed to delete expense" },
      { status: 500 }
    );
  }
}
