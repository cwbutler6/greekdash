import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { financeService } from "@/lib/services/finance-service";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

// GET /api/chapters/[chapterSlug]/finance/summary - Get financial summary for a chapter
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

    // Check for timeframe filter
    const url = new URL(request.url);
    const timeframe = url.searchParams.get("timeframe") || "month";
    
    // Define date range based on timeframe
    const now = new Date();
    const startDate = new Date();
    
    switch(timeframe) {
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      case 'quarter':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case 'month':
      default:
        startDate.setMonth(now.getMonth() - 1);
        break;
    }
    
    // Get basic finance summary
    const summary = await financeService.getFinanceSummary(chapter.id);
    
    // Get additional timeframe-specific data
    const timeframeDuesResult = await prisma.duesPayment.aggregate({
      where: {
        chapterId: chapter.id,
        paidAt: { 
          gte: startDate,
          lte: now 
        },
      },
      _sum: { amount: true },
      _count: true,
    });
    
    const timeframeExpensesResult = await prisma.expense.aggregate({
      where: {
        chapterId: chapter.id,
        status: "PAID",
        paidAt: { 
          gte: startDate,
          lte: now 
        },
      },
      _sum: { amount: true },
      _count: true,
    });
    
    // Combine all data
    const combinedSummary = {
      ...summary,
      timeframe: {
        period: timeframe,
        startDate,
        endDate: now,
        income: timeframeDuesResult._sum.amount || 0,
        incomeCount: timeframeDuesResult._count,
        expenses: timeframeExpensesResult._sum.amount || 0,
        expensesCount: timeframeExpensesResult._count,
        balance: (timeframeDuesResult._sum.amount || 0) - (timeframeExpensesResult._sum.amount || 0)
      }
    };

    return NextResponse.json(combinedSummary);
  } catch (error) {
    console.error("Error fetching finance summary:", error);
    return NextResponse.json(
      { error: "Failed to fetch finance summary" },
      { status: 500 }
    );
  }
}
