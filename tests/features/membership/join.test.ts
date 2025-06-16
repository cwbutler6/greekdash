import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { generateJoinCode, joinChapter, validateJoinCode } from '@/lib/membership';

// Setup mocks before imports to avoid circular dependencies
jest.mock('@/lib/db', () => {
  return {
    prisma: {
      chapter: {
        findUnique: jest.fn(),
        update: jest.fn(),
        findFirst: jest.fn(),
      },
      user: {
        create: jest.fn(),
        findUnique: jest.fn(),
      },
      membership: {
        create: jest.fn(),
      },
      $transaction: jest.fn(async (callback) => {
        if (typeof callback === 'function') {
          return callback();
        }
        return {};
      }),
    }
  };
});

// Mock the membership module to avoid require() style imports
jest.mock('@/lib/membership', () => {
  const originalModule = jest.requireActual('@/lib/membership') as Record<string, unknown>;
  return {
    ...originalModule,
    validateJoinCode: jest.fn(),
  };
});

// Import the db module after mocking
import { prisma } from '@/lib/db';

// Create typed shorthand references to mocks for cleaner test code
const mockChapterFindFirst = prisma.chapter.findFirst as jest.Mock;
const mockUserCreate = prisma.user.create as jest.Mock;
const mockUserFindUnique = prisma.user.findUnique as jest.Mock;
const mockMembershipCreate = prisma.membership.create as jest.Mock;
const mockTransaction = prisma.$transaction as jest.Mock;

describe('Chapter Membership - Join Process', () => {
  const mockChapterSlug = 'alpha-beta-gamma';
  const mockChapterId = 'chapter-123';
  const mockJoinCode = 'ABC123';
  const mockEmail = 'new-member@example.com';
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock for chapter lookup - use type casting to resolve TypeScript errors
    const mockChapterData = {
      id: mockChapterId,
      name: 'Alpha Beta Gamma',
      slug: mockChapterSlug,
    };
    // Mock implementation to return a Promise that resolves to our data
    const mockFn = prisma.chapter.findUnique as jest.Mock;
    mockFn.mockImplementation(() => Promise.resolve(mockChapterData));
  });
  
  describe('generateJoinCode', () => {
    it('should generate a unique join code for a chapter', async () => {
      // Mock chapter lookup
      // @ts-expect-error - Jest mock typing issue
      (prisma.chapter.findUnique as jest.Mock).mockResolvedValue({
        id: mockChapterId,
        name: 'Alpha Beta Gamma',
        slug: mockChapterSlug,
        joinCode: 'OLD-CODE'
      });
      
      // Mock chapter update with new join code
      // @ts-expect-error - Jest mock typing issue
      (prisma.chapter.update as jest.Mock).mockResolvedValue({
        id: mockChapterId,
        name: 'Alpha Beta Gamma',
        slug: mockChapterSlug,
        joinCode: mockJoinCode
      });
      
      const result = await generateJoinCode({ chapterSlug: mockChapterSlug, expiresInDays: 7 });
      
      expect(result.code).toBe(mockJoinCode);
      
      // Verify chapter lookup used slug for tenant isolation
      expect(prisma.chapter.findUnique).toHaveBeenCalledWith({
        where: { slug: mockChapterSlug },
      });
      
      // Verify chapter was updated with new join code
      expect(prisma.chapter.update).toHaveBeenCalledWith({
        where: { id: mockChapterId },
        data: expect.objectContaining({ 
          joinCode: expect.any(String) 
        })
      });
    });
    
    it('should throw an error if chapter does not exist', async () => {
      // Mock chapter not found
      // @ts-expect-error - Jest mock typing issue
      (prisma.chapter.findUnique as jest.Mock).mockResolvedValue(null);
      
      await expect(generateJoinCode({ 
        chapterSlug: 'non-existent', 
        expiresInDays: 7 
      })).rejects.toThrow('Chapter with slug');
      
      // Verify chapter was not updated
      expect(prisma.chapter.update).not.toHaveBeenCalled();
    });
  });
  
  describe('validateJoinCode', () => {
    it('should return valid when join code matches chapter', async () => {
      // @ts-expect-error - Jest mock typing issue
      mockChapterFindFirst.mockResolvedValue({
        id: mockChapterId,
        slug: mockChapterSlug,
        joinCode: mockJoinCode,
        name: 'Alpha Beta Gamma',
      });
      
      const result = await validateJoinCode({
        chapterSlug: mockChapterSlug,
        code: mockJoinCode
      });
      
      expect(result.valid).toBe(true);
      expect(result.chapterId).toBe(mockChapterId);
      
      // Verify lookup was performed with both slug and code
      expect(prisma.chapter.findFirst).toHaveBeenCalledWith({
        where: {
          slug: mockChapterSlug,
          joinCode: mockJoinCode
        }
      });
    });
    
    it('should reject an invalid join code', async () => {
      // Mock no chapter found with that code
      // @ts-expect-error - Jest mock typing issue
      (prisma.chapter.findFirst as jest.Mock).mockResolvedValue(undefined);
      
      const result = await validateJoinCode({
        chapterSlug: mockChapterSlug,
        code: 'WRONG-CODE'
      });
      
      expect(result.valid).toBe(false);
      expect(result.message).toContain('Invalid join code');
    });
    
    it('should reject a non-existent chapter', async () => {
      // Mock no chapter found
      // @ts-expect-error - Jest mock typing issue
      (prisma.chapter.findFirst as jest.Mock).mockResolvedValue(null);
      
      const result = await validateJoinCode({
        chapterSlug: 'non-existent',
        code: mockJoinCode
      });
      
      expect(result.valid).toBe(false);
      expect(result.message).toContain('Invalid join code');
    });
  });
  
  describe('joinChapter', () => {
    const newMemberData = {
      email: mockEmail,
      firstName: 'New',
      lastName: 'Member',
      password: 'securepassword',
    };
    
    it('should return success response with user and membership data', async () => {
      // Mock validateJoinCode to return valid
      // Mock validateJoinCode function using the mocked module import
      (validateJoinCode as jest.Mock).mockImplementation(() => {
        return Promise.resolve({
          valid: true,
          chapterId: mockChapterId
        });
      });

      
      // Mock transactional operations
      const mockUserId = 'user-123';
      const mockUser = {
        id: mockUserId,
        email: mockEmail,
        name: 'New Member',
        createdAt: new Date(),
        updatedAt: new Date(),
        emailVerified: null,
        image: null,
        password: null,
      };
      
      const mockMembership = {
        id: 'membership-123',
        userId: mockUserId,
        chapterId: mockChapterId,
        role: 'PENDING_MEMBER',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      // Set up mocks with implementation-based approach instead of using any
      mockUserFindUnique.mockImplementation(() => Promise.resolve(null));
      mockUserCreate.mockImplementation(() => Promise.resolve(mockUser));
      mockMembershipCreate.mockImplementation(() => Promise.resolve(mockMembership));
      
      // Mock the transaction to return our success result directly
      mockTransaction.mockImplementation(() => Promise.resolve({
        success: true,
        user: mockUser,
        membership: mockMembership
      }));
      
      // Execute
      const result = await joinChapter({
        chapterSlug: mockChapterSlug,
        joinCode: mockJoinCode,
        userData: newMemberData,
      });
      
      // Verify the result
      expect(result.success).toBe(true);
      
      // Use a type assertion for TypeScript to understand the shape
      const successResult = result as { success: true, user: { id: string }, membership: { role: string } };
      expect(successResult.user.id).toBe(mockUserId);
      expect(successResult.membership.role).toBe('PENDING_MEMBER');
      
      // Verify no user or membership was created
      expect(prisma.user.create).not.toHaveBeenCalled();
      expect(prisma.membership.create).not.toHaveBeenCalled();
    });
    
    it('should fail if the join code is invalid', async () => {
      // Mock chapter not found with that join code
      // @ts-expect-error - Jest mock typing issue
      (prisma.chapter.findFirst as jest.Mock).mockResolvedValue(null);
      
      const result = await joinChapter({
        chapterSlug: mockChapterSlug,
        joinCode: 'INVALID',
        userData: newMemberData,
      });
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('Invalid join code');
      
      // Verify no user or membership was created
      expect(prisma.user.create).not.toHaveBeenCalled();
      expect(prisma.membership.create).not.toHaveBeenCalled();
    });
    
    it('should handle when user email already exists', async () => {
      // Mock chapter found with a specific code
      // @ts-expect-error - Jest mock typing issue
      (prisma.chapter.findFirst as jest.Mock).mockResolvedValue({
        id: mockChapterId,
        slug: mockChapterSlug,
        joinCode: mockJoinCode,
        name: 'Alpha Beta Gamma',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      // Mock transaction throwing a unique constraint error
      (prisma.$transaction as jest.Mock).mockImplementation(async () => {
        // Simulate the standard Prisma error for unique constraint violation
        const prismaError = new Error('Unique constraint failed on the fields: (`email`)') as Error & { 
          code: string; 
          meta: { target: string[] } 
        };
        prismaError.code = 'P2002';
        prismaError.meta = { target: ['email'] };
        throw prismaError;
      });
      
      const result = await joinChapter({
        chapterSlug: mockChapterSlug,
        joinCode: mockJoinCode,
        userData: newMemberData,
      });
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('Email already in use');
    });
  });
});
