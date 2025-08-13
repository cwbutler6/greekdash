import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { MockedFunction } from 'vitest';
import { financeService } from '@/lib/services/finance-service';
import { db } from '@/lib/db';
import { BudgetStatus, ExpenseStatus, TransactionType, DuesStatus } from '@/generated/prisma';

// Mock the database
vi.mock('@/lib/db', () => ({
  db: {
    budget: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    expense: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    transaction: {
      create: vi.fn(),
    },
    duesPayment: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
    },
  },
}));

// Mock Stripe
vi.mock('@/lib/stripe', () => ({
  default: {},
}));

// Type the mocked database properly
const mockDb = {
  budget: {
    findMany: vi.mocked(db.budget.findMany) as MockedFunction<typeof db.budget.findMany>,
    findFirst: vi.mocked(db.budget.findFirst) as MockedFunction<typeof db.budget.findFirst>,
    create: vi.mocked(db.budget.create) as MockedFunction<typeof db.budget.create>,
    update: vi.mocked(db.budget.update) as MockedFunction<typeof db.budget.update>,
    delete: vi.mocked(db.budget.delete) as MockedFunction<typeof db.budget.delete>,
  },
  expense: {
    findMany: vi.mocked(db.expense.findMany) as MockedFunction<typeof db.expense.findMany>,
    findFirst: vi.mocked(db.expense.findFirst) as MockedFunction<typeof db.expense.findFirst>,
    create: vi.mocked(db.expense.create) as MockedFunction<typeof db.expense.create>,
    update: vi.mocked(db.expense.update) as MockedFunction<typeof db.expense.update>,
    delete: vi.mocked(db.expense.delete) as MockedFunction<typeof db.expense.delete>,
  },
  transaction: {
    create: vi.mocked(db.transaction.create) as MockedFunction<typeof db.transaction.create>,
  },
  duesPayment: {
    findMany: vi.mocked(db.duesPayment.findMany) as MockedFunction<typeof db.duesPayment.findMany>,
    findFirst: vi.mocked(db.duesPayment.findFirst) as MockedFunction<typeof db.duesPayment.findFirst>,
  },
};

describe('financeService', () => {
  const testChapterId = 'chapter-123';
  const testUserId = 'user-123';
  
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Budget Management', () => {
    describe('getBudgets', () => {
      it('should fetch budgets for a chapter ordered by start date', async () => {
        const mockBudgets = [
          { 
            id: '1', 
            name: 'Q1 Budget', 
            description: 'Q1 budget description',
            startDate: new Date('2024-01-01'),
            endDate: new Date('2024-03-31'),
            amount: 5000,
            status: BudgetStatus.ACTIVE,
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-01'),
            chapterId: testChapterId
          },
          { 
            id: '2', 
            name: 'Q2 Budget', 
            description: 'Q2 budget description',
            startDate: new Date('2024-04-01'),
            endDate: new Date('2024-06-30'),
            amount: 7500,
            status: BudgetStatus.ACTIVE,
            createdAt: new Date('2024-04-01'),
            updatedAt: new Date('2024-04-01'),
            chapterId: testChapterId
          },
        ];
        
        mockDb.budget.findMany.mockResolvedValue(mockBudgets);
        
        const result = await financeService.getBudgets(testChapterId);
        
        expect(mockDb.budget.findMany).toHaveBeenCalledWith({
          where: { chapterId: testChapterId },
          orderBy: { startDate: 'desc' },
        });
        expect(result).toEqual(mockBudgets);
      });
    });

    describe('getBudget', () => {
      it('should fetch a specific budget with tenant isolation', async () => {
        const mockBudget = {
          id: 'budget-1',
          name: 'Test Budget',
          description: 'Test budget description',
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-12-31'),
          amount: 10000,
          status: BudgetStatus.ACTIVE,
          createdAt: new Date(),
          updatedAt: new Date(),
          chapterId: testChapterId,
          expenses: [],
        };
        
        mockDb.budget.findFirst.mockResolvedValue(mockBudget);
        
        const result = await financeService.getBudget('budget-1', testChapterId);
        
        expect(mockDb.budget.findFirst).toHaveBeenCalledWith({
          where: {
            id: 'budget-1',
            chapterId: testChapterId,
          },
          include: {
            expenses: true,
          },
        });
        expect(result).toEqual(mockBudget);
      });
    });

    describe('createBudget', () => {
      it('should create a new budget with valid data', async () => {
        const budgetData = {
          name: 'New Budget',
          description: 'Test budget description',
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-12-31'),
          amount: 10000,
          status: BudgetStatus.ACTIVE,
          chapterId: testChapterId,
        };
        
        const mockCreatedBudget = { 
          id: 'budget-new', 
          ...budgetData,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01')
        };
        mockDb.budget.create.mockResolvedValue(mockCreatedBudget);
        
        const result = await financeService.createBudget(budgetData);
        
        expect(mockDb.budget.create).toHaveBeenCalledWith({
          data: budgetData,
        });
        expect(result).toEqual(mockCreatedBudget);
      });
    });

    describe('updateBudget', () => {
      it('should update budget with tenant isolation', async () => {
        const updateData = {
          name: 'Updated Budget',
          amount: 15000,
        };
        
        const mockUpdatedBudget = {
          id: 'budget-1',
          chapterId: testChapterId,
          description: 'Updated budget description',
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-12-31'),
          status: BudgetStatus.ACTIVE,
          createdAt: new Date(),
          updatedAt: new Date(),
          ...updateData,
        };
        
        mockDb.budget.update.mockResolvedValue(mockUpdatedBudget);
        
        const result = await financeService.updateBudget('budget-1', testChapterId, updateData);
        
        expect(mockDb.budget.update).toHaveBeenCalledWith({
          where: {
            id: 'budget-1',
            chapterId: testChapterId,
          },
          data: updateData,
        });
        expect(result).toEqual(mockUpdatedBudget);
      });
    });

    describe('deleteBudget', () => {
      it('should delete budget with tenant isolation', async () => {
        const mockDeletedBudget = {
          id: 'budget-1',
          chapterId: testChapterId,
          name: 'Deleted Budget',
          description: 'Budget to be deleted',
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-12-31'),
          amount: 10000,
          status: BudgetStatus.ACTIVE,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        mockDb.budget.delete.mockResolvedValue(mockDeletedBudget);
        
        const result = await financeService.deleteBudget('budget-1', testChapterId);
        
        expect(mockDb.budget.delete).toHaveBeenCalledWith({
          where: {
            id: 'budget-1',
            chapterId: testChapterId,
          },
        });
        expect(result).toEqual(mockDeletedBudget);
      });
    });
  });

  describe('Expense Management', () => {
    describe('getExpenses', () => {
      it('should fetch expenses with user and budget details', async () => {
        const mockExpenses = [
          {
            id: 'expense-1',
            title: 'Office Supplies',
            description: 'Office supplies for chapter',
            amount: 150,
            status: ExpenseStatus.PENDING,
            chapterId: testChapterId,
            receiptUrl: 'https://example.com/receipt.pdf',
            submittedAt: new Date('2024-01-10'),
            approvedAt: null,
            paidAt: null,
            budgetId: null,
            submittedById: testUserId,
            approvedById: null,
            submittedBy: { id: testUserId, name: 'John Doe', email: 'john@example.com', image: null },
            approvedBy: null,
            budget: null,
          },
        ];
        
        mockDb.expense.findMany.mockResolvedValue(mockExpenses);
        
        const result = await financeService.getExpenses(testChapterId);
        
        expect(mockDb.expense.findMany).toHaveBeenCalledWith({
          where: { chapterId: testChapterId },
          orderBy: { submittedAt: 'desc' },
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
        expect(result).toEqual(mockExpenses);
      });
    });

    describe('createExpense', () => {
      it('should create a new expense with required fields', async () => {
        const expenseData = {
          title: 'New Expense',
          description: 'Test expense',
          amount: 200,
          receiptUrl: 'https://example.com/receipt.pdf',
          status: ExpenseStatus.PENDING,
          chapterId: testChapterId,
          budgetId: 'budget-1',
          submittedById: testUserId,
        };
        
        const mockCreatedExpense = {
          id: 'expense-new',
          ...expenseData,
          submittedAt: new Date('2024-01-10'),
          approvedAt: null,
          paidAt: null,
          approvedById: null,
          submittedBy: { id: testUserId, name: 'John Doe', email: 'john@example.com', image: null },
          budget: { id: 'budget-1', name: 'Test Budget' },
        };
        
        mockDb.expense.create.mockResolvedValue(mockCreatedExpense);
        
        const result = await financeService.createExpense(expenseData);
        
        expect(mockDb.expense.create).toHaveBeenCalledWith({
          data: expenseData,
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
        expect(result).toEqual(mockCreatedExpense);
      });
    });

    describe('updateExpense', () => {
      it('should update expense and create transaction when paid', async () => {
        const updateData = {
          status: ExpenseStatus.PAID,
          paidAt: new Date('2024-01-15'),
          approvedById: 'admin-123',
        };
        
        const mockExpense = {
          id: 'expense-1',
          title: 'Test Expense',
          description: 'Test expense description',
          amount: 150,
          status: ExpenseStatus.PENDING,
          chapterId: testChapterId,
          receiptUrl: 'https://example.com/receipt.pdf',
          submittedAt: new Date('2024-01-10'),
          approvedAt: null,
          paidAt: null,
          budgetId: null,
          submittedById: testUserId,
          approvedById: null,
          submittedBy: { id: testUserId, name: 'John Doe', email: 'john@example.com', image: null },
        };
        
        const mockTransaction = {
          id: 'transaction-1',
          amount: -150,
          type: TransactionType.EXPENSE,
          description: 'Expense payment: Test Expense',
          chapterId: testChapterId,
          expenseId: 'expense-1',
          processedAt: updateData.paidAt,
          createdAt: new Date('2024-01-10'),
          metadata: {},
          duesPaymentId: null,
        };
        
        mockDb.expense.update.mockResolvedValue(mockExpense);
        mockDb.transaction.create.mockResolvedValue(mockTransaction);
        
        const result = await financeService.updateExpense('expense-1', testChapterId, updateData);
        
        expect(mockDb.expense.update).toHaveBeenCalledWith({
          where: {
            id: 'expense-1',
            chapterId: testChapterId,
          },
          data: updateData,
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
        
        expect(mockDb.transaction.create).toHaveBeenCalledWith({
          data: {
            amount: -150,
            type: TransactionType.EXPENSE,
            description: 'Expense payment: Test Expense',
            chapterId: testChapterId,
            expenseId: 'expense-1',
            processedAt: updateData.paidAt,
          },
        });
        
        expect(result).toEqual(mockExpense);
      });

      it('should update expense without creating transaction when not paid', async () => {
        const updateData = {
          status: ExpenseStatus.APPROVED,
          approvedById: 'admin-123',
        };
        
        const mockExpense = {
          id: 'expense-1',
          title: 'Test Expense',
          description: 'Test expense description',
          amount: 150,
          status: ExpenseStatus.PENDING,
          chapterId: testChapterId,
          receiptUrl: 'https://example.com/receipt.pdf',
          submittedAt: new Date('2024-01-10'),
          approvedAt: null,
          paidAt: null,
          budgetId: null,
          submittedById: testUserId,
          approvedById: null,
          submittedBy: { id: testUserId, name: 'John Doe', email: 'john@example.com', image: null },
        };
        
        mockDb.expense.update.mockResolvedValue(mockExpense);
        
        const result = await financeService.updateExpense('expense-1', testChapterId, updateData);
        
        expect(mockDb.expense.update).toHaveBeenCalledWith({
          where: {
            id: 'expense-1',
            chapterId: testChapterId,
          },
          data: updateData,
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
        
        expect(mockDb.transaction.create).not.toHaveBeenCalled();
        expect(result).toEqual(mockExpense);
      });
    });
  });

  describe('Dues Management', () => {
    describe('getDuesPayments', () => {
      it('should fetch dues payments with user details', async () => {
        const mockDuesPayments = [
          {
            id: 'dues-1',
            amount: 100,
            status: DuesStatus.PENDING,
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-01'),
            chapterId: testChapterId,
            userId: testUserId,
            paidAt: null,
            dueDate: new Date('2024-01-31'),
            processedAt: null,
            metadata: {},
            duesPlanId: 'plan-1',
            notes: null,
            customAmount: null,
            stripePaymentIntentId: null,
            stripeCheckoutUrl: null,
            user: { id: testUserId, name: 'John Doe', email: 'john@example.com', image: null },
          },
        ];
        
        mockDb.duesPayment.findMany.mockResolvedValue(mockDuesPayments);
        
        const result = await financeService.getDuesPayments(testChapterId);
        
        expect(mockDb.duesPayment.findMany).toHaveBeenCalledWith({
          where: { chapterId: testChapterId },
          orderBy: { dueDate: 'desc' },
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
        expect(result).toEqual(mockDuesPayments);
      });
    });

    describe('getUserDuesPayments', () => {
      it('should fetch dues payments for a specific user with tenant isolation', async () => {
        const mockUserDuesPayments = [
          {
            id: 'dues-1',
            amount: 100,
            status: DuesStatus.PENDING,
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-01'),
            chapterId: testChapterId,
            userId: testUserId,
            paidAt: null,
            dueDate: new Date('2024-01-31'),
            processedAt: null,
            metadata: {},
            duesPlanId: 'plan-1',
            notes: null,
            customAmount: null,
            stripePaymentIntentId: null,
            stripeCheckoutUrl: null,
          },
        ];
        
        mockDb.duesPayment.findMany.mockResolvedValue(mockUserDuesPayments);
        
        const result = await financeService.getUserDuesPayments(testUserId, testChapterId);
        
        expect(mockDb.duesPayment.findMany).toHaveBeenCalledWith({
          where: {
            userId: testUserId,
            chapterId: testChapterId,
          },
          orderBy: { dueDate: 'desc' },
        });
        expect(result).toEqual(mockUserDuesPayments);
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      const dbError = new Error('Database connection failed');
      mockDb.budget.findMany.mockRejectedValue(dbError);
      
      await expect(financeService.getBudgets(testChapterId)).rejects.toThrow('Database connection failed');
    });

    it('should handle empty results', async () => {
      mockDb.budget.findMany.mockResolvedValue([]);
      
      const result = await financeService.getBudgets(testChapterId);
      
      expect(result).toEqual([]);
    });

    it('should handle null budget result', async () => {
      mockDb.budget.findFirst.mockResolvedValue(null);
      
      const result = await financeService.getBudget('non-existent', testChapterId);
      
      expect(result).toBeNull();
    });
  });

  describe('Tenant Isolation', () => {
    it('should always include chapterId in where clauses for security', async () => {
      await financeService.getBudget('budget-1', testChapterId);
      await financeService.updateBudget('budget-1', testChapterId, { name: 'Updated' });
      await financeService.deleteBudget('budget-1', testChapterId);
      
      // Verify all calls include chapterId for tenant isolation
      expect(mockDb.budget.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ chapterId: testChapterId })
        })
      );
      
      expect(mockDb.budget.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ chapterId: testChapterId })
        })
      );
      
      expect(mockDb.budget.delete).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ chapterId: testChapterId })
        })
      );
    });
  });
});