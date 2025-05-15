import { NextResponse } from "next/server";
import { z } from "zod";

import { financeService } from "@/lib/services/finance-service";
import { requireFinanceAccess, FinanceAccessRole } from "@/lib/finance/auth-check";

// GET /api/chapters/[chapterSlug]/finance/expenses - Get all expenses for a chapter
export async function GET(
  request: Request,
  { params }: { params: Promise<{ chapterSlug: string }> }
) {
  try {
    // Get chapter slug from params
    const { chapterSlug } = await params;
    
    // Use our finance access check utility to verify tenant access and feature availability
    // For viewing expenses, regular member access is sufficient
    const { chapter } = await requireFinanceAccess(chapterSlug, FinanceAccessRole.MEMBER);

    // Check if stats are requested
    const url = new URL(request.url);
    const statsParam = url.searchParams.get("stats");
    const stats = statsParam === "true";
    
    if (stats) {
      // Get expense statistics through the finance service
      // Since getExpenseStats might not exist, we'll call getFinanceSummary which includes expense stats
      const financeSummary = await financeService.getFinanceSummary(chapter.id);
      // Extract just the expense-related stats from the finance summary
      const expenseStats = {
        pendingExpenses: financeSummary.pendingExpenses,
        totalExpenses: financeSummary.totalExpenses,
        // Add more derived stats as needed
        expenseCount: financeSummary.pendingExpenses?.count || 0,
      };
      return NextResponse.json(expenseStats);
    }
    
    // Get query parameters for filtering
    const statusFilter = url.searchParams.get("status");
    const startDate = url.searchParams.get("startDate") ? new Date(url.searchParams.get("startDate") as string) : undefined;
    const endDate = url.searchParams.get("endDate") ? new Date(url.searchParams.get("endDate") as string) : undefined;
    const budgetId = url.searchParams.get("budgetId") || undefined;
    
    // Get all expenses for the chapter
    // Since our financeService implementation might not support filtering directly,
    // we'll get all expenses for the chapter and filter them in memory
    const allExpenses = await financeService.getExpenses(chapter.id);
    
    // Using type inference from the financeService results
    
    // Apply filters in memory if needed
    const expenses = allExpenses.filter((expense) => {
      // Filter by status if provided
      if (statusFilter && expense.status !== statusFilter) {
        return false;
      }
      
      // Filter by date range if provided
      if (startDate && new Date(expense.submittedAt) < startDate) {
        return false;
      }
      if (endDate && new Date(expense.submittedAt) > endDate) {
        return false;
      }
      
      // Filter by budget if provided
      if (budgetId && expense.budgetId !== budgetId) {
        return false;
      }
      
      return true;
    });

    return NextResponse.json(expenses);
  } catch (error) {
    console.error("Error fetching expenses:", error);
    return NextResponse.json(
      { error: "Failed to fetch expenses" },
      { status: 500 }
    );
  }
}

// POST /api/chapters/[chapterSlug]/finance/expenses - Create a new expense
export async function POST(
  request: Request,
  { params }: { params: Promise<{ chapterSlug: string }> }
) {
  try {
    // Get chapter slug from params
    const { chapterSlug } = await params;
    
    // Use our finance access check utility to verify tenant access and feature availability
    // For creating expenses, we require ADMIN access to ensure proper financial controls
    const { membership, chapter } = await requireFinanceAccess(chapterSlug, FinanceAccessRole.ADMIN);

    // Parse and validate request body
    const body = await request.json();
    
    // Add additional required fields and validate types
    const expenseData = {
      title: String(body.title),
      description: body.description ? String(body.description) : null,
      amount: Number(body.amount),
      receiptUrl: body.receiptUrl ? String(body.receiptUrl) : null,
      status: body.status || 'PENDING',
      chapterId: chapter.id,
      budgetId: body.budgetId ? String(body.budgetId) : null,
      submittedById: membership.userId, // Use userId from membership object
    };
    
    // Create expense
    const expense = await financeService.createExpense(expenseData);

    return NextResponse.json(expense, { status: 201 });
  } catch (error) {
    console.error("Error creating expense:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", issues: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create expense" },
      { status: 500 }
    );
  }
}
