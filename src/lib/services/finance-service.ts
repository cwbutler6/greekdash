import { db } from "@/lib/db";
import { BudgetStatus, ExpenseStatus, TransactionType, Prisma } from '@/generated/prisma';
import stripe from "@/lib/stripe";

/**
 * Finance Service
 * Handles all finance-related operations with multi-tenant support
 */
export const financeService = {
  /**
   * Budget Management
   */
  getBudgets: async (chapterId: string) => {
    return db.budget.findMany({
      where: { chapterId },
      orderBy: { startDate: "desc" },
    });
  },

  getBudget: async (budgetId: string, chapterId: string) => {
    return db.budget.findFirst({
      where: { 
        id: budgetId,
        chapterId // Ensure tenant isolation
      },
      include: {
        expenses: true,
      },
    });
  },

  createBudget: async (data: {
    name: string;
    description?: string | null;
    startDate: Date;
    endDate: Date;
    amount: number;
    status?: BudgetStatus;
    chapterId: string;
  }) => {
    return db.budget.create({
      data
    });
  },

  updateBudget: async (
    budgetId: string,
    chapterId: string,
    data: {
      name?: string;
      description?: string | null;
      startDate?: Date;
      endDate?: Date;
      amount?: number;
      status?: BudgetStatus;
    }
  ) => {
    return db.budget.update({
      where: {
        id: budgetId,
        chapterId, // Ensure tenant isolation
      },
      data,
    });
  },

  deleteBudget: async (budgetId: string, chapterId: string) => {
    return db.budget.delete({
      where: {
        id: budgetId,
        chapterId, // Ensure tenant isolation
      },
    });
  },

  /**
   * Expense Management
   */
  getExpenses: async (chapterId: string) => {
    return db.expense.findMany({
      where: { chapterId },
      orderBy: { submittedAt: "desc" },
      include: {
        submittedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        approvedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        budget: true,
      },
    });
  },

  getExpense: async (expenseId: string, chapterId: string) => {
    return db.expense.findFirst({
      where: { 
        id: expenseId,
        chapterId, // Ensure tenant isolation
      },
      include: {
        submittedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        approvedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        budget: true,
      },
    });
  },

  createExpense: async (data: {
    title: string;
    description?: string | null;
    amount: number;
    receiptUrl?: string | null;
    status?: ExpenseStatus;
    chapterId: string;
    budgetId?: string | null;
    submittedById: string;
  }) => {
    return db.expense.create({
      data,
      include: {
        submittedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        budget: true,
      },
    });
  },

  updateExpense: async (
    expenseId: string,
    chapterId: string,
    data: {
      title?: string;
      description?: string | null;
      amount?: number;
      receiptUrl?: string | null;
      status?: ExpenseStatus;
      budgetId?: string | null;
      approvedById?: string | null;
      approvedAt?: Date | null;
      paidAt?: Date | null;
    }
  ) => {
    const expense = await db.expense.update({
      where: {
        id: expenseId,
        chapterId, // Ensure tenant isolation
      },
      data,
      include: {
        submittedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    // Create a transaction record if the expense is paid
    if (data.status === "PAID" && data.paidAt) {
      await db.transaction.create({
        data: {
          amount: -expense.amount, // Negative amount for outgoing expense
          type: TransactionType.EXPENSE,
          description: `Expense payment: ${expense.title}`,
          chapterId,
          expenseId: expense.id,
          processedAt: data.paidAt,
        },
      });
    }

    return expense;
  },

  deleteExpense: async (expenseId: string, chapterId: string) => {
    return db.expense.delete({
      where: {
        id: expenseId,
        chapterId, // Ensure tenant isolation
      },
    });
  },

  /**
   * Dues Management
   */
  getDuesPayments: async (chapterId: string) => {
    return db.duesPayment.findMany({
      where: { chapterId },
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
  },

  getUserDuesPayments: async (userId: string, chapterId: string) => {
    return db.duesPayment.findMany({
      where: {
        userId,
        chapterId, // Ensure tenant isolation
      },
      orderBy: { dueDate: "desc" },
    });
  },

  getDuesPayment: async (duesPaymentId: string, chapterId: string) => {
    return db.duesPayment.findFirst({
      where: {
        id: duesPaymentId,
        chapterId, // Ensure tenant isolation
      },
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
  },

  createDuesPayment: async (data: {
    amount: number;
    dueDate: Date;
    chapterId: string;
    userId: string;
  }) => {
    return db.duesPayment.create({
      data,
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
  },

  // Create dues payments in bulk for multiple members
  createBulkDuesPayments: async (data: {
    amount: number;
    dueDate: Date;
    chapterId: string;
    memberIds: string[];
  }) => {
    const { amount, dueDate, chapterId, memberIds } = data;
    
    const duesPayments = await db.$transaction(
      memberIds.map((userId) => 
        db.duesPayment.create({
          data: {
            amount,
            dueDate,
            chapterId,
            userId,
          },
        })
      )
    );

    return duesPayments;
  },

  updateDuesPayment: async (
    duesPaymentId: string,
    chapterId: string,
    data: {
      amount?: number;
      dueDate?: Date;
      paidAt?: Date | null;
      stripePaymentId?: string | null;
      stripeInvoiceId?: string | null;
    }
  ) => {
    const duesPayment = await db.duesPayment.update({
      where: {
        id: duesPaymentId,
        chapterId, // Ensure tenant isolation
      },
      data,
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

    // Create a transaction record if the dues payment is completed
    if (data.paidAt && duesPayment.paidAt) {
      await db.transaction.create({
        data: {
          amount: duesPayment.amount, // Positive amount for incoming payment
          type: TransactionType.DUES_PAYMENT,
          description: `Dues payment from ${duesPayment.user.name ?? duesPayment.user.email}`,
          chapterId,
          duesPaymentId: duesPayment.id,
          processedAt: data.paidAt,
        },
      });
    }

    return duesPayment;
  },

  deleteDuesPayment: async (duesPaymentId: string, chapterId: string) => {
    return db.duesPayment.delete({
      where: {
        id: duesPaymentId,
        chapterId, // Ensure tenant isolation
      },
    });
  },

  /**
   * Stripe Payment Processing
   */
  createStripeCheckoutSession: async (duesPaymentId: string, chapterId: string) => {
    // Get the dues payment
    const duesPayment = await db.duesPayment.findFirst({
      where: {
        id: duesPaymentId,
        chapterId, // Ensure tenant isolation
      },
      include: {
        user: true,
        chapter: true,
      },
    });

    if (!duesPayment) {
      throw new Error("Dues payment not found");
    }

    // Make sure the chapter has a Stripe customer ID
    if (!duesPayment.chapter.stripeCustomerId) {
      throw new Error("Chapter is not set up for payments");
    }

    // Create a Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      customer_email: duesPayment.user.email ?? undefined,
      metadata: {
        duesPaymentId: duesPayment.id,
        chapterId: duesPayment.chapterId,
        userId: duesPayment.userId,
      },
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `${duesPayment.chapter.name} - Member Dues`,
              description: `Due date: ${duesPayment.dueDate.toLocaleDateString()}`,
            },
            unit_amount: Math.round(duesPayment.amount * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/${duesPayment.chapter.slug}/admin/finance/dues/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/${duesPayment.chapter.slug}/admin/finance/dues`,
    });

    return { sessionId: session.id, url: session.url };
  },

  // Process successful Stripe payment webhook
  processStripePayment: async (sessionId: string) => {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["payment_intent"],
    });

    if (!session.metadata?.duesPaymentId || !session.metadata?.chapterId) {
      throw new Error("Missing metadata in Stripe session");
    }

    const { duesPaymentId, chapterId } = session.metadata;
    const paymentIntentId = typeof session.payment_intent === 'string' 
      ? session.payment_intent 
      : session.payment_intent?.id;

    if (!paymentIntentId) {
      throw new Error("Payment intent not found");
    }

    // Update dues payment
    return financeService.updateDuesPayment(duesPaymentId, chapterId, {
      paidAt: new Date(),
      stripePaymentId: paymentIntentId,
    });
  },

  /**
   * Transaction Management
   */
  getTransactions: async (
    chapterId: string,
    filters?: {
      startDate?: Date;
      endDate?: Date;
      type?: TransactionType;
    }
  ) => {
    const { startDate, endDate, type } = filters || {};
    
    return db.transaction.findMany({
      where: {
        chapterId,
        ...(startDate && { createdAt: { gte: startDate } }),
        ...(endDate && { createdAt: { lte: endDate } }),
        ...(type && { type }),
      },
      orderBy: { createdAt: "desc" },
      include: {
        expense: true,
        duesPayment: {
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
        },
      },
    });
  },

  createTransaction: async (data: {
    amount: number;
    type: TransactionType;
    description?: string | null;
    metadata?: Prisma.InputJsonValue | null;
    chapterId: string;
    expenseId?: string | null;
    duesPaymentId?: string | null;
    processedAt?: Date | null;
  }) => {
    // Handle JSON null values correctly for Prisma
    const processedData = {
      ...data,
      // Convert null to Prisma.JsonNull for the metadata field
      metadata: data.metadata === null ? Prisma.JsonNull : data.metadata
    };
    
    return db.transaction.create({
      data: processedData,
    });
  },

  /**
   * Finance Dashboard / Summary
   */
  getFinanceSummary: async (chapterId: string) => {
    // Get total incoming dues
    const totalDuesResult = await db.duesPayment.aggregate({
      where: {
        chapterId,
        paidAt: { not: null },
      },
      _sum: { amount: true },
    });

    // Get total expenses
    const totalExpensesResult = await db.expense.aggregate({
      where: {
        chapterId,
        status: "PAID",
      },
      _sum: { amount: true },
    });

    // Get unpaid dues
    const unpaidDuesResult = await db.duesPayment.aggregate({
      where: {
        chapterId,
        paidAt: null,
      },
      _sum: { amount: true },
      _count: true,
    });

    // Get pending expenses
    const pendingExpensesResult = await db.expense.aggregate({
      where: {
        chapterId,
        status: "PENDING",
      },
      _sum: { amount: true },
      _count: true,
    });

    // Get active budgets
    const activeBudgetsCount = await db.budget.count({
      where: {
        chapterId,
        status: "ACTIVE",
      },
    });

    const totalIncome = totalDuesResult._sum.amount || 0;
    const totalExpenses = totalExpensesResult._sum.amount || 0;

    return {
      totalIncome,
      totalExpenses,
      balance: totalIncome - totalExpenses,
      unpaidDues: {
        amount: unpaidDuesResult._sum.amount || 0,
        count: unpaidDuesResult._count,
      },
      pendingExpenses: {
        amount: pendingExpensesResult._sum.amount || 0,
        count: pendingExpensesResult._count,
      },
      activeBudgetsCount,
    };
  },
};
