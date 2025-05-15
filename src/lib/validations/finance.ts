import * as z from "zod";
import { TransactionType, ExpenseStatus, BudgetStatus } from "@/generated/prisma";
// Budget schema
export const budgetSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional().nullable(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  amount: z.coerce.number().positive("Budget amount must be positive"),
  status: z.nativeEnum(BudgetStatus).default("PLANNING"),
  chapterId: z.string().cuid("Invalid chapter ID"),
});

// Expense schema
export const expenseSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional().nullable(),
  amount: z.coerce.number().positive("Expense amount must be positive"),
  receiptUrl: z.string().url().optional().nullable(),
  status: z.nativeEnum(ExpenseStatus).default("PENDING"),
  budgetId: z.string().cuid("Invalid budget ID").optional().nullable(),
  chapterId: z.string().cuid("Invalid chapter ID"),
});

// Expense approval schema
export const expenseApprovalSchema = z.object({
  expenseId: z.string().cuid("Invalid expense ID"),
  status: z.enum(["APPROVED", "DENIED", "PAID"]),
  chapterId: z.string().cuid("Invalid chapter ID"),
});

// Dues payment schema
export const duesPaymentSchema = z.object({
  amount: z.coerce.number().positive("Payment amount must be positive"),
  dueDate: z.coerce.date(),
  userId: z.string().cuid("Invalid user ID"),
  chapterId: z.string().cuid("Invalid chapter ID"),
});

// Transaction schema
export const transactionSchema = z.object({
  amount: z.coerce.number(),
  type: z.nativeEnum(TransactionType),
  description: z.string().optional().nullable(),
  metadata: z.record(z.any()).optional().nullable(),
  chapterId: z.string().cuid("Invalid chapter ID"),
  expenseId: z.string().cuid("Invalid expense ID").optional().nullable(),
  duesPaymentId: z.string().cuid("Invalid dues payment ID").optional().nullable(),
});

// Schema for bulk creating dues payments
export const bulkDuesPaymentSchema = z.object({
  amount: z.coerce.number().positive("Payment amount must be positive"),
  dueDate: z.coerce.date(),
  chapterId: z.string().cuid("Invalid chapter ID"),
  memberIds: z.array(z.string().cuid("Invalid member ID")),
});

// Schema for making a payment via Stripe
export const stripePaymentSchema = z.object({
  duesPaymentId: z.string().cuid("Invalid dues payment ID"),
  chapterId: z.string().cuid("Invalid chapter ID"),
});

// Schema for filtering transactions
export const transactionFilterSchema = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  type: z.nativeEnum(TransactionType).optional(),
  chapterId: z.string().cuid("Invalid chapter ID"),
});
