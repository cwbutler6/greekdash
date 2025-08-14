import { db } from "@/lib/db";
import { BudgetStatus, ExpenseStatus, TransactionType, DonationStatus, Prisma } from '@/generated/prisma';
import stripe from "@/lib/stripe";
import { sendEmail } from '@/lib/mail';

// Reusable user select fields to follow DRY principle
const userSelectFields = {
  id: true,
  name: true,
  email: true,
  image: true,
} as const;

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
          select: userSelectFields,
        },
        approvedBy: {
          select: userSelectFields,
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
          select: userSelectFields,
        },
        approvedBy: {
          select: userSelectFields,
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
          select: userSelectFields,
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
          select: userSelectFields,
        },
      },
    });

    // Create a transaction record if the expense is paid
    if (data.status === "PAID" && data.paidAt) {
      await financeService.createTransaction({
        amount: -expense.amount, // Negative amount for outgoing expense
        type: TransactionType.EXPENSE,
        description: `Expense payment: ${expense.title}`,
        chapterId,
        expenseId: expense.id,
        processedAt: data.paidAt,
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
          select: userSelectFields,
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
          select: userSelectFields,
        },
      },
    });
  },

  createDuesPayment: async (data: {
    amount: number;
    dueDate: Date;
    chapterId: string;
    userId: string;
    duesPlanId: string;
  }) => {
    return db.duesPayment.create({
      data,
      include: {
        user: {
          select: userSelectFields,
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
    duesPlanId: string;
  }) => {
    const { amount, dueDate, chapterId, memberIds, duesPlanId } = data;
    
    const duesPayments = await db.$transaction(
      memberIds.map((userId) => 
        db.duesPayment.create({
          data: {
            amount,
            dueDate,
            chapterId,
            userId,
            duesPlanId,
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
          select: userSelectFields,
        },
      },
    });

    // Create a transaction record if the dues payment is completed
    if (data.paidAt && duesPayment.paidAt) {
      await financeService.createTransaction({
        amount: duesPayment.amount, // Positive amount for incoming payment
        type: TransactionType.DUES_PAYMENT,
        description: `Dues payment from ${duesPayment.user.name ?? duesPayment.user.email}`,
        chapterId,
        duesPaymentId: duesPayment.id,
        processedAt: data.paidAt,
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
              select: userSelectFields,
            },
          },
        },
        donation: {
          include: {
            campaign: {
              select: {
                id: true,
                title: true,
                type: true,
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
    donationId?: string | null;
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

    // Get total donations
    const totalDonationsResult = await db.donation.aggregate({
      where: {
        chapterId,
        status: "COMPLETED",
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

    const totalIncome = (totalDuesResult._sum.amount || 0) + (totalDonationsResult._sum.amount || 0);
    const totalExpenses = totalExpensesResult._sum.amount || 0;

    return {
      totalIncome,
      totalExpenses,
      balance: totalIncome - totalExpenses,
      totalDonations: totalDonationsResult._sum.amount || 0,
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

  // Add method to check if user can pay specific dues
  canUserPayDues: async (duesPaymentId: string, userId: string, chapterId: string) => {
    const duesPayment = await db.duesPayment.findFirst({
      where: {
        id: duesPaymentId,
        userId,
        chapterId,
      },
      include: {
        duesPlan: {
          include: {
            assignments: {
              where: {
                userId,
                isActive: true,
              },
            },
          },
        },
      },
    });
  
    if (!duesPayment) return false;
  
    // Allow payment if it's a manual assignment (no plan) or user has active assignment
    return !duesPayment.duesPlan || duesPayment.duesPlan.assignments.length > 0;
  },

  /**
   * Donation Management
   */
  getDonations: async (chapterId: string) => {
    return db.donation.findMany({
      where: { chapterId },
      include: {
        campaign: {
          select: {
            id: true,
            title: true,
            type: true,
          },
        },
        user: {
          select: userSelectFields,
        },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  getDonation: async (donationId: string, chapterId: string) => {
    return db.donation.findFirst({
      where: {
        id: donationId,
        chapterId,
      },
      include: {
        campaign: {
          select: {
            id: true,
            title: true,
            type: true,
          },
        },
        user: {
          select: userSelectFields,
        },
      },
    });
  },

  updateDonation: async (
    donationId: string,
    chapterId: string,
    data: {
      status?: DonationStatus;
      completedAt?: Date | null;
      stripePaymentIntentId?: string | null;
      stripeSessionId?: string | null;
      stripeCheckoutUrl?: string | null;
    }
  ) => {
    const donation = await db.donation.update({
      where: {
        id: donationId,
        chapterId,
      },
      data,
      include: {
        campaign: true,
        chapter: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        user: {
          select: userSelectFields,
        },
      },
    });

    // Create a transaction record if the donation is completed
    if (data.status === "COMPLETED" && data.completedAt) {
      await db.transaction.create({
        data: {
          amount: donation.amount,
          type: TransactionType.DONATION,
          description: `Donation${donation.campaign ? ` for ${donation.campaign.title}` : ''} from ${donation.donorName || donation.donorEmail || 'Anonymous'}`,
          chapterId,
          donationId: donation.id,
          processedAt: data.completedAt,
        },
      });

      // Update campaign current amount if applicable
      if (donation.campaignId) {
        await db.donationCampaign.update({
          where: { id: donation.campaignId },
          data: {
            currentAmount: {
              increment: donation.amount,
            },
          },
        });
      }
    }

    return donation;
  },

  /**
   * Donation Stripe Processing
   */
  createDonationCheckoutSession: async (donationId: string, chapterId: string) => {
    // Get the donation
    const donation = await db.donation.findFirst({
      where: {
        id: donationId,
        chapterId,
      },
      include: {
        campaign: true,
        chapter: true,
      },
    });

    if (!donation) {
      throw new Error("Donation not found");
    }

    // Create product name and description
    const productName = donation.campaign
      ? `${donation.campaign.title} - ${donation.chapter.name}`
      : `Donation to ${donation.chapter.name}`;
    
    const description = donation.campaign
      ? `Support ${donation.campaign.title}`
      : `General donation to ${donation.chapter.name}`;

    // Create a Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      customer_email: donation.donorEmail ?? undefined,
      metadata: {
        donationId: donation.id,
        chapterId: donation.chapterId,
        campaignId: donation.campaignId || '',
        type: 'donation',
      },
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: productName,
              description: description,
            },
            unit_amount: Math.round(donation.amount * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/${donation.chapter.slug}/donate/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/${donation.chapter.slug}/donate`,
    });

    return { sessionId: session.id, url: session.url };
  },

  // Process successful donation payment webhook
  processDonationPayment: async (sessionId: string) => {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["payment_intent"],
    });

    if (!session.metadata?.donationId || !session.metadata?.chapterId) {
      throw new Error("Missing metadata in Stripe session");
    }

    const { donationId, chapterId } = session.metadata;
    const paymentIntentId = typeof session.payment_intent === 'string'
      ? session.payment_intent
      : session.payment_intent?.id;

    if (!paymentIntentId) {
      throw new Error("Payment intent not found");
    }

    // Update donation
    const updatedDonation = await financeService.updateDonation(donationId, chapterId, {
      status: "COMPLETED",
      completedAt: new Date(),
      stripePaymentIntentId: paymentIntentId,
    });

    // Send confirmation email to donor
    if (updatedDonation.donorEmail) {
      try {
        await sendEmail(
          updatedDonation.donorEmail,
          'donationConfirmation',
          {
            donorName: updatedDonation.donorName || 'Donor',
            amount: updatedDonation.amount,
            chapterName: updatedDonation.chapter?.name || 'Chapter',
            campaignTitle: updatedDonation.campaign?.title,
            // Note: Stripe receipt URL would need to be retrieved from payment intent if needed
          }
        );
        
        console.log(`Donation confirmation email sent to ${updatedDonation.donorEmail}`);
      } catch (emailError) {
        // Log email error but don't fail the donation processing
        console.error('Failed to send donation confirmation email:', emailError);
      }
    }

    return updatedDonation;
  },
};
