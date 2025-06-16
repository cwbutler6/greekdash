import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { prisma } from '@/lib/db';
import { getServerAuthSession } from '@/lib/auth';
import { createTransaction, getTransactions } from '@/lib/treasury';

// Mock dependencies
jest.mock('@/lib/db', () => ({
  prisma: {
    transaction: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    membership: {
      findFirst: jest.fn(),
    },
    chapter: {
      findUnique: jest.fn(),
    },
  },
}));

jest.mock('@/lib/auth', () => ({
  getServerAuthSession: jest.fn(),
}));

describe('Treasury Features', () => {
  const mockChapterSlug = 'alpha-beta-gamma';
  const mockUserId = 'user-123';
  const mockChapterId = 'chapter-123';
  
  const mockTransaction = {
    id: 'trans-123',
    amount: 100.00,
    description: 'Test transaction',
    type: 'DUES',
    status: 'COMPLETED',
    chapterId: mockChapterId,
    createdById: mockUserId,
    createdAt: new Date(),
  };

  const mockUser = { 
    id: mockUserId, 
    name: 'Test User', 
    email: 'treasurer@example.com' 
  };
  
  const mockChapter = { 
    id: mockChapterId, 
    name: 'Alpha Beta Gamma', 
    slug: mockChapterSlug 
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createTransaction', () => {
    it('should prevent transaction creation if user is not authorized', async () => {
      // Mock a regular member without treasurer privileges
      (getServerAuthSession as jest.Mock).mockResolvedValue({
        user: mockUser,
        membership: { 
          role: 'MEMBER', 
          status: 'ACTIVE',
          subscriptionTier: 'BASIC',
          chapterId: mockChapterId
        },
        chapter: mockChapter,
      });

      await expect(createTransaction({
        amount: 100.00,
        description: 'Unauthorized transaction',
        type: 'DUES',
        chapterSlug: mockChapterSlug,
      })).rejects.toThrow('Unauthorized: Only treasurers can create transactions');
      
      // Ensure the transaction was not created
      expect(prisma.transaction.create).not.toHaveBeenCalled();
    });

    it('should create transaction when user has treasurer role', async () => {
      // Mock a treasurer user
      (getServerAuthSession as jest.Mock).mockResolvedValue({
        user: mockUser,
        membership: { 
          role: 'TREASURER', 
          status: 'ACTIVE',
          subscriptionTier: 'BASIC',
          chapterId: mockChapterId
        },
        chapter: mockChapter,
      });
      
      (prisma.transaction.create as jest.Mock).mockResolvedValue(mockTransaction);

      const result = await createTransaction({
        amount: 100.00,
        description: 'Test transaction',
        type: 'DUES',
        chapterSlug: mockChapterSlug,
      });
      
      expect(result).toEqual(mockTransaction);
      
      // Verify transaction was created with the correct chapter context
      expect(prisma.transaction.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          chapterId: mockChapterId,
          createdById: mockUserId,
        }),
      });
    });

    it('should enforce transaction creation in correct chapter only', async () => {
      // Mock treasurer in a different chapter
      const wrongChapterSlug = 'wrong-chapter';
      
      (getServerAuthSession as jest.Mock).mockImplementation((chapterSlug) => {
        if (chapterSlug === mockChapterSlug) {
          return Promise.resolve({
            user: mockUser,
            membership: { 
              role: 'TREASURER', 
              status: 'ACTIVE',
              chapterId: mockChapterId 
            },
            chapter: mockChapter,
          });
        }
        
        // Return null if wrong chapter
        return Promise.resolve(null);
      });
      
      await expect(createTransaction({
        amount: 100.00,
        description: 'Test transaction',
        type: 'DUES',
        chapterSlug: wrongChapterSlug,
      })).rejects.toThrow('Unauthorized');
      
      // Ensure no transaction was created
      expect(prisma.transaction.create).not.toHaveBeenCalled();
    });
  });

  describe('getTransactions', () => {
    it('should only return transactions for the correct chapter', async () => {
      // Mock authenticated user
      (getServerAuthSession as jest.Mock).mockResolvedValue({
        user: mockUser,
        membership: { role: 'MEMBER', status: 'ACTIVE', chapterId: mockChapterId },
        chapter: mockChapter,
      });
      
      const mockTransactions = [mockTransaction];
      (prisma.transaction.findMany as jest.Mock).mockResolvedValue(mockTransactions);
      
      const result = await getTransactions({ chapterSlug: mockChapterSlug });
      
      expect(result).toEqual(mockTransactions);
      
      // Verify query had chapter filter for proper tenant isolation
      expect(prisma.transaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            chapterId: mockChapterId,
          }),
        })
      );
    });
  });
});
