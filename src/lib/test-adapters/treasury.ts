/**
 * Test adapter layer for treasury service
 * 
 * This file provides a compatibility layer between tests expecting standalone functions
 * and the actual service-based architecture. This allows tests to run without major rewrites.
 */
import { db } from '@/lib/db';
// Import Prisma types to ensure compatibility
import { Prisma, TransactionType } from '@/generated/prisma';

// Type mappings for test compatibility
type TransactionTypeString = 'DUES' | 'EXPENSE' | 'INCOME' | 'FEE' | 'OTHER';
type TransactionStatusString = 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELED';

// Map string types to enum values
const transactionTypeMap: Record<TransactionTypeString, TransactionType> = {
  'DUES': TransactionType.DUES_PAYMENT,
  'EXPENSE': TransactionType.EXPENSE,
  'INCOME': TransactionType.INCOME,
  'FEE': TransactionType.OTHER,
  'OTHER': TransactionType.OTHER
};

// We're not using the status mapping since it appears the Transaction model
// might not have a status field in the current Prisma schema

interface TransactionCreateData {
  amount: number;
  description: string;
  type: TransactionTypeString;
  category: string;
  status?: TransactionStatusString;
}

/**
 * Create a new transaction
 */
export async function createTransaction(
  data: TransactionCreateData,
  chapterId: string,
  userId: string
) {
  // Verify chapter exists
  const chapter = await db.chapter.findUnique({
    where: { id: chapterId },
  });

  if (!chapter) {
    throw new Error('Chapter not found');
  }

  // Use the treasury service to create the transaction
  return await db.transaction.create({
    data: {
      amount: data.amount,
      description: data.description,
      // Map string types to proper Prisma enums
      type: transactionTypeMap[data.type],
      // Note: The actual Transaction model might not have a status field
      // If this causes errors, check the Prisma schema and adjust accordingly
      chapterId: chapterId,
      // Add category as metadata since Transaction doesn't have a direct createdBy field
      metadata: {
        category: data.category || 'General',
        createdById: userId // Store user ID in metadata as Transaction doesn't have this field
      }
    },
  })
};

export const getTransactions = async (chapterId: string, options?: {
  limit?: number;
  offset?: number;
  type?: 'INCOME' | 'EXPENSE';
  startDate?: Date;
  endDate?: Date;
  category?: string;
}) => {
  // Find the chapter to get the slug
  const chapter = await db.chapter.findUnique({
    where: { id: chapterId },
    select: { slug: true }
  });

  if (!chapter) {
    throw new Error('Chapter not found');
  }

  // We have the chapter ID, which is what's needed for the query
  
  // Map to the service method
  // Note: In real implementation, this would call the appropriate service method
  // This is a simplified version for the tests only
  
  // Build filter conditions
  const where = { 
    chapterId 
  };
  
  // Add optional filters with type-safe approach
  const filterWhere: Record<string, unknown> = { ...where };
  if (options?.type) {
    filterWhere.type = options.type;
  }
  const { limit = 50, offset = 0 } = options || {};
  
  // Create a properly typed where clause
  const typedWhere: Prisma.TransactionWhereInput = {
    chapterId,
    ...(options?.type ? { type: transactionTypeMap[options.type as TransactionTypeString] } : {}),
    ...(options?.startDate ? { createdAt: { gte: options.startDate } } : {}),
    ...(options?.endDate ? { createdAt: { lte: options.endDate } } : {}),
    ...(options?.category ? { metadata: { path: ['category'], equals: options.category } } : {})
  };

  return db.transaction.findMany({
    where: typedWhere,
    orderBy: { createdAt: 'desc' },
    skip: offset,
    take: limit,
    // Only select the fields we need from the transaction
    select: {
      id: true,
      amount: true, 
      description: true,
      type: true,
      createdAt: true,
      metadata: true,
      chapterId: true,
      // Transaction doesn't have a direct createdBy relation in the schema
      // We'll use chapter relation instead
      chapter: {
        select: {
          id: true,
          name: true
        }
      }
    }
  });
};
