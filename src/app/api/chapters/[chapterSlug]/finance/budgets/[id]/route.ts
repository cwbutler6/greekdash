import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { financeService } from "@/lib/services/finance-service";
import { authOptions } from "@/lib/auth";
import { budgetSchema } from "@/lib/validations/finance";
import { prisma } from "@/lib/db";

// GET /api/chapters/[chapterSlug]/finance/budgets/[id] - Get a budget by ID
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

    // Get chapter from slug and budget ID from params
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
    
    // Get budget
    const budget = await financeService.getBudget(id, chapter.id);
    if (!budget) {
      return NextResponse.json({ error: "Budget not found" }, { status: 404 });
    }

    return NextResponse.json(budget);
  } catch (error) {
    console.error("Error fetching budget:", error);
    return NextResponse.json(
      { error: "Failed to fetch budget" },
      { status: 500 }
    );
  }
}

// PATCH /api/chapters/[chapterSlug]/finance/budgets/[id] - Update a budget
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

    // Get chapter from slug and budget ID from params
    const { chapterSlug, id } = await params;
    
    // Verify chapter exists and user has admin/owner access
    const chapter = await prisma.chapter.findFirst({
      where: {
        slug: chapterSlug,
        memberships: {
          some: {
            userId: session.user.id,
            role: { in: ["ADMIN", "OWNER"] }, // Only admins and owners can update budgets
          },
        },
      },
    });

    if (!chapter) {
      return NextResponse.json({ error: "Chapter not found or access denied" }, { status: 404 });
    }
    
    // Parse request body
    const body = await request.json();
    
    // Define the interface for budget update data
    interface BudgetUpdateData {
      name?: string;
      description?: string | null;
      startDate?: Date;
      endDate?: Date;
      amount?: number;
      status?: 'PLANNING' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
    }
    
    // Validate with partial schema and ensure proper typing
    const rawValidatedData = budgetSchema.partial().parse(body);
    
    // Create a properly typed object by mapping validated fields
    const validatedData: BudgetUpdateData = {};
    if ('name' in rawValidatedData) validatedData.name = rawValidatedData.name as string;
    if ('description' in rawValidatedData) validatedData.description = rawValidatedData.description as string | null;
    if ('startDate' in rawValidatedData) validatedData.startDate = rawValidatedData.startDate as Date;
    if ('endDate' in rawValidatedData) validatedData.endDate = rawValidatedData.endDate as Date;
    if ('amount' in rawValidatedData) validatedData.amount = rawValidatedData.amount as number;
    if ('status' in rawValidatedData) validatedData.status = rawValidatedData.status as 'PLANNING' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
    
    // Update budget with the properly typed data
    const budget = await financeService.updateBudget(
      id,
      chapter.id,
      validatedData
    );

    return NextResponse.json(budget);
  } catch (error) {
    console.error("Error updating budget:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", issues: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to update budget" },
      { status: 500 }
    );
  }
}

// DELETE /api/chapters/[chapterSlug]/finance/budgets/[id] - Delete a budget
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

    // Get chapter from slug and budget ID from params
    const { chapterSlug, id } = await params;
    
    // Verify chapter exists and user has admin/owner access
    const chapter = await prisma.chapter.findFirst({
      where: {
        slug: chapterSlug,
        memberships: {
          some: {
            userId: session.user.id,
            role: { in: ["ADMIN", "OWNER"] }, // Only admins and owners can delete budgets
          },
        },
      },
    });

    if (!chapter) {
      return NextResponse.json({ error: "Chapter not found or access denied" }, { status: 404 });
    }
    
    // Delete budget
    await financeService.deleteBudget(id, chapter.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting budget:", error);
    return NextResponse.json(
      { error: "Failed to delete budget" },
      { status: 500 }
    );
  }
}
