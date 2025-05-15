import { NextResponse } from "next/server";
import { z } from "zod";

import { financeService } from "@/lib/services/finance-service";
import { requireFinanceAccess, FinanceAccessRole } from "@/lib/finance/auth-check";

// GET /api/chapters/[chapterSlug]/finance/budgets - Get all budgets for a chapter
export async function GET(
  request: Request,
  { params }: { params: Promise<{ chapterSlug: string }> }
) {
  try {
    // Get chapter slug from params
    const { chapterSlug } = await params;
    
    // Use our finance access check utility to verify tenant access and feature availability
    // For viewing budgets, member access is sufficient
    const { chapter } = await requireFinanceAccess(chapterSlug, FinanceAccessRole.MEMBER);

    // Get budgets
    const budgets = await financeService.getBudgets(chapter.id);

    return NextResponse.json(budgets);
  } catch (error) {
    console.error("Error fetching budgets:", error);
    return NextResponse.json(
      { error: "Failed to fetch budgets" },
      { status: 500 }
    );
  }
}

// POST /api/chapters/[chapterSlug]/finance/budgets - Create a new budget
export async function POST(
  request: Request,
  { params }: { params: Promise<{ chapterSlug: string }> }
) {
  try {
    // Get chapter slug from params
    const { chapterSlug } = await params;
    
    // Use our finance access check utility to verify tenant access and feature availability
    // For creating budgets, we require ADMIN access to ensure proper financial controls
    const { chapter } = await requireFinanceAccess(chapterSlug, FinanceAccessRole.ADMIN);

    // Parse and validate request body
    const body = await request.json();
    
    // Add additional required fields and validate types
    const budgetData = {
      name: String(body.name),
      description: body.description ? String(body.description) : null,
      startDate: new Date(body.startDate),
      endDate: new Date(body.endDate),
      amount: Number(body.amount),
      status: body.status || 'PLANNING',
      chapterId: chapter.id,
    };
    
    // Create budget
    const budget = await financeService.createBudget(budgetData);

    return NextResponse.json(budget, { status: 201 });
  } catch (error) {
    console.error("Error creating budget:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", issues: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create budget" },
      { status: 500 }
    );
  }
}
