import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { db } from "@/lib/db";
import { MembershipRole } from "@/generated/prisma";
import { treasuryService } from "@/lib/services/treasury-service";
import { z } from "zod";

// Check if user has permission to access treasury features
async function checkTreasuryAccess(chapterSlug: string, userId: string) {
  const membership = await db.membership.findFirst({
    where: {
      user: { id: userId },
      chapter: { slug: chapterSlug },
      role: { in: [MembershipRole.ADMIN, MembershipRole.OWNER] },
    },
  });

  return !!membership;
}

// GET handler - get treasury details for the chapter
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Extract chapter slug from the URL
  const url = new URL(request.url);
  const chapterSlug = url.searchParams.get("chapterSlug");
  
  if (!chapterSlug) {
    return NextResponse.json({ error: "Chapter slug required" }, { status: 400 });
  }

  // Check if the user has permission to access treasury features
  const hasAccess = await checkTreasuryAccess(chapterSlug, session.user.id);
  if (!hasAccess) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const treasury = treasuryService({ chapterSlug });
    
    // Get both treasury details and transactions
    const [details, transactions] = await Promise.all([
      treasury.getTreasuryDetails(),
      treasury.getTreasuryTransactions(),
    ]);

    return NextResponse.json({ details, transactions });
  } catch (error) {
    console.error("Error getting treasury data:", error);
    return NextResponse.json(
      { error: "Failed to get treasury data" },
      { status: 500 }
    );
  }
}

// POST handler - perform treasury operations
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Parse request body
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Validate required fields
  const schema = z.object({
    chapterSlug: z.string(),
    operation: z.enum(["deposit", "withdraw", "autoInvest", "setupWallet", "recordYield"]),
    amount: z.number().optional(),
    strategy: z.enum(["balanced", "conservative", "aggressive"]).optional(),
    enabled: z.boolean().optional(),
  });

  const result = schema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ 
      error: "Validation failed", 
      details: result.error.format() 
    }, { status: 400 });
  }

  const { chapterSlug, operation, amount, strategy = "balanced", enabled } = result.data;

  // Check if the user has permission to access treasury features
  const hasAccess = await checkTreasuryAccess(chapterSlug, session.user.id);
  if (!hasAccess) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const treasury = treasuryService({ chapterSlug });

  try {
    let result;
    switch (operation) {
      case "deposit":
        if (typeof amount !== "number") {
          return NextResponse.json({ error: "Amount required" }, { status: 400 });
        }
        result = await treasury.depositToAave(amount);
        break;
        
      case "withdraw":
        if (typeof amount !== "number") {
          return NextResponse.json({ error: "Amount required" }, { status: 400 });
        }
        result = await treasury.withdrawFromAave(amount);
        break;
        
      case "autoInvest":
        if (typeof enabled !== "boolean") {
          return NextResponse.json({ error: "Enabled flag required" }, { status: 400 });
        }
        result = await treasury.toggleAutoInvest(enabled, strategy as "balanced" | "conservative" | "aggressive");
        break;
        
      case "setupWallet":
        result = await treasury.setupChapterWallet();
        break;
        
      case "recordYield":
        if (typeof amount !== "number") {
          return NextResponse.json({ error: "Amount required" }, { status: 400 });
        }
        result = await treasury.recordYieldEarning(amount);
        break;
        
      default:
        return NextResponse.json(
          { error: "Invalid operation" },
          { status: 400 }
        );
    }

    // Log the action in audit logs
    await db.auditLog.create({
      data: {
        action: `treasury_${operation}`,
        targetType: "treasury",
        metadata: { ...body },
        userId: session.user.id,
        chapterId: (await db.chapter.findUnique({ 
          where: { slug: chapterSlug },
          select: { id: true }
        }))?.id as string,
      },
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error(`Error with treasury operation ${operation}:`, error);
    return NextResponse.json(
      { error: (error as Error).message || "Operation failed" },
      { status: 500 }
    );
  }
}
