import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { getServerSession } from 'next-auth';
import { getServerAuthSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Mock dependencies
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
    membership: {
      findFirst: jest.fn(),
    },
    chapter: {
      findUnique: jest.fn(),
    },
  },
}));

describe('Authentication', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return null when no session exists', async () => {
    // Mock session returns null
      // @ts-expect-error - Jest mock typing issue
    (getServerSession as jest.Mock).mockResolvedValue(null);
    
    const result = await getServerAuthSession();
    
    expect(result).toBeNull();
    expect(getServerSession).toHaveBeenCalled();
  });

  it('should return user and chapter data when session exists', async () => {
    // Mock session with user
    (getServerSession as jest.Mock).mockResolvedValue({
      user: {
        id: 'user-123',
        email: 'test@example.com',
      },
      expires: new Date().toISOString(),
    });
    
    // Mock database queries
    const mockUser = { id: 'user-123', name: 'Test User', email: 'test@example.com' };
    const mockMembership = { 
      id: 'membership-123', 
      userId: 'user-123', 
      chapterId: 'chapter-123', 
      role: 'MEMBER',
      status: 'ACTIVE',
      subscriptionTier: 'BASIC'
    };
    const mockChapter = { id: 'chapter-123', name: 'Test Chapter', slug: 'test-chapter' };
    
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
    (prisma.membership.findFirst as jest.Mock).mockResolvedValue(mockMembership);
    (prisma.chapter.findUnique as jest.Mock).mockResolvedValue(mockChapter);
    
    const result = await getServerAuthSession();
    
    expect(result).toEqual({
      user: mockUser,
      membership: mockMembership,
      chapter: mockChapter,
    });
    
    // Verify session was checked
    expect(getServerSession).toHaveBeenCalled();
    
    // Verify queries included chapter context for tenant isolation
    expect(prisma.membership.findFirst as jest.Mock).toHaveBeenCalledWith({
      where: {
        userId: 'user-123',
        chapter: { slug: expect.any(String) },
      },
      include: { chapter: true },
    });
  });
  
  it('should enforce chapter tenant isolation in auth flow', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: 'user-123' },
      expires: new Date().toISOString(),
    });
    
    await getServerAuthSession('specific-chapter');
    
    // Check that the membership query included the chapter slug for tenant isolation
    expect(prisma.membership.findFirst as jest.Mock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          chapter: { slug: 'specific-chapter' },
        }),
      })
    );
  });
});
