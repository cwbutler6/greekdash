import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import {
  getSession,
  getCurrentUser,
  requireAuth,
  requireChapterAccess,
  requireChapterAdmin
} from '@/lib/auth';
import { Session } from 'next-auth';

// Mock data
const mockUser = {
  id: 'user-1',
  name: 'Test User',
  email: 'test@example.com',
  memberships: [{
    id: 'membership-1',
    role: 'MEMBER',
    chapterId: 'chapter-1',
    chapterSlug: 'test-chapter',
    userId: 'user-1'
  }]
};

const mockAdminUser = {
  id: 'admin-1',
  name: 'Admin User',
  email: 'admin@example.com',
  memberships: [{
    id: 'membership-2',
    role: 'ADMIN',
    chapterId: 'chapter-1',
    chapterSlug: 'test-chapter',
    userId: 'admin-1'
  }]
};

const mockChapter = {
  id: 'chapter-1',
  name: 'Test Chapter',
  slug: 'test-chapter',
  joinCode: 'test-join-code',
  publicInfo: 'Test chapter public info',
  primaryColor: '#000000',
  schoolName: 'Test University',
  createdAt: new Date('2023-01-01'),
  updatedAt: new Date('2023-01-01'),
  stripeCustomerId: 'cus_test123',
  chapterTreasuryBalance: 0,
  autoInvestEnabled: false,
  autoInvestStrategy: null,
  walletAddress: null,
  walletPrivateKey: null,
  treasuryLastYield: null,
  treasuryLastYieldDate: null
};

describe('Auth Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('getSession', () => {
    it('should return session from getServerSession', async () => {
      const mockSession = { user: mockUser };
      vi.mocked(getServerSession).mockResolvedValue(mockSession);

      const result = await getSession();

      expect(result).toEqual(mockSession);
      expect(getServerSession).toHaveBeenCalledWith(expect.any(Object));
    });

    it('should return null when no session exists', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);

      const result = await getSession();

      expect(result).toBeNull();
    });
  });

  describe('getCurrentUser', () => {
    it('should return user from session', async () => {
      const mockSession = { user: mockUser };
      vi.mocked(getServerSession).mockResolvedValue(mockSession);

      const result = await getCurrentUser();

      expect(result).toEqual(mockUser);
    });

    it('should return undefined when no session exists', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);

      const result = await getCurrentUser();

      expect(result).toBeUndefined();
    });

    it('should return undefined when session has no user', async () => {
      vi.mocked(getServerSession).mockResolvedValue({ user: undefined });

      const result = await getCurrentUser();

      expect(result).toBeUndefined();
    });
  });

  describe('requireAuth', () => {
    it('should return user when authenticated', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: mockUser,
        expires: '2024-12-31T23:59:59.999Z',
      } as Session);

      const result = await requireAuth();
      expect(result).toEqual(mockUser);
    });

    it('should redirect to login when not authenticated', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);

      await expect(requireAuth()).rejects.toThrow('REDIRECT');
      expect(redirect).toHaveBeenCalledWith('/login');
    });

    it('should redirect to login when session has no user', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        expires: '2024-12-31T23:59:59.999Z',
      } as Session);

      await expect(requireAuth()).rejects.toThrow('REDIRECT');
      expect(redirect).toHaveBeenCalledWith('/login');
    });
  });

  describe('requireChapterAccess', () => {
    it('should return user and membership when user has access', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: mockUser,
        expires: '2024-12-31T23:59:59.999Z',
      } as Session);

      const result = await requireChapterAccess('test-chapter');
      expect(result).toEqual({
        user: mockUser,
        membership: {
          id: 'membership-1',
          role: 'MEMBER',
          chapterId: 'chapter-1',
          chapterSlug: 'test-chapter',
          userId: 'user-1',
        },
      });
    });

    it('should redirect to login when not authenticated', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);

      await expect(requireChapterAccess('test-chapter')).rejects.toThrow('REDIRECT');
      expect(redirect).toHaveBeenCalledWith('/login');
    });

    it('should redirect to user\'s chapter when accessing different chapter', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: mockUser,
        expires: '2024-12-31T23:59:59.999Z',
      } as Session);

      await expect(requireChapterAccess('other-chapter')).rejects.toThrow('REDIRECT');
      expect(redirect).toHaveBeenCalledWith('/test-chapter/portal');
    });

    it('should redirect admin to admin page when accessing different chapter', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: mockAdminUser,
        expires: '2024-12-31T23:59:59.999Z',
      } as Session);

      await expect(requireChapterAccess('other-chapter')).rejects.toThrow('REDIRECT');
      expect(redirect).toHaveBeenCalledWith('/test-chapter/admin');
    });

    it('should redirect to home when user has no memberships', async () => {
      const userWithNoMemberships = { ...mockUser, memberships: [] };
      vi.mocked(getServerSession).mockResolvedValue({
        user: userWithNoMemberships,
        expires: '2024-12-31T23:59:59.999Z',
      } as Session);

      await expect(requireChapterAccess('test-chapter')).rejects.toThrow('REDIRECT');
      expect(redirect).toHaveBeenCalledWith('/');
    });
  });

  describe('requireChapterAdmin', () => {
    it('should return user, membership, and chapter when user is admin', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: mockAdminUser,
        expires: '2024-12-31T23:59:59.999Z',
      } as Session);
      vi.mocked(prisma.chapter.findUnique).mockResolvedValue(mockChapter);

      const result = await requireChapterAdmin('test-chapter');
      expect(result).toEqual({
        user: mockAdminUser,
        membership: {
          id: 'membership-2',
          role: 'ADMIN',
          chapterId: 'chapter-1',
          chapterSlug: 'test-chapter',
          userId: 'admin-1',
        },
        chapter: mockChapter,
      });
    });

    it('should redirect to login when not authenticated', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);

      await expect(requireChapterAdmin('test-chapter')).rejects.toThrow('REDIRECT');
      expect(redirect).toHaveBeenCalledWith('/login');
    });

    it('should redirect to home when chapter does not exist', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: mockAdminUser,
        expires: '2024-12-31T23:59:59.999Z',
      } as Session);
      vi.mocked(prisma.chapter.findUnique).mockResolvedValue(null);

      await expect(requireChapterAdmin('nonexistent-chapter')).rejects.toThrow('REDIRECT');
      expect(redirect).toHaveBeenCalledWith('/');
    });

    it('should redirect to portal when user is not admin', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: mockUser,
        expires: '2024-12-31T23:59:59.999Z',
      } as Session);
      vi.mocked(prisma.chapter.findUnique).mockResolvedValue(mockChapter);

      await expect(requireChapterAdmin('test-chapter')).rejects.toThrow('REDIRECT');
      expect(redirect).toHaveBeenCalledWith('/test-chapter/portal');
    });

    it('should redirect to home when user has no access to chapter', async () => {
      const userWithNoAccess = {
        ...mockUser,
        memberships: [],
      };
      vi.mocked(getServerSession).mockResolvedValue({
        user: userWithNoAccess,
        expires: '2024-12-31T23:59:59.999Z',
      } as Session);
      vi.mocked(prisma.chapter.findUnique).mockResolvedValue(mockChapter);

      await expect(requireChapterAdmin('test-chapter')).rejects.toThrow('REDIRECT');
      expect(redirect).toHaveBeenCalledWith('/');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle database errors gracefully in requireChapterAdmin', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: mockAdminUser,
        expires: '2024-12-31T23:59:59.999Z',
      } as Session);
      vi.mocked(prisma.chapter.findUnique).mockRejectedValue(new Error('Database error'));

      await expect(requireChapterAdmin('test-chapter')).rejects.toThrow('Database error');
    });

    it('should handle malformed session data', async () => {
      // Create a user with missing memberships property
      const malformedUser = { 
        id: '1', 
        name: 'Test', 
        email: 'test@example.com'
        // Missing memberships property
      };
      vi.mocked(getServerSession).mockResolvedValue({
        user: malformedUser,
        expires: '2024-12-31T23:59:59.999Z',
      } as Session);

      await expect(requireChapterAccess('test-chapter')).rejects.toThrow('REDIRECT');
      expect(redirect).toHaveBeenCalledWith('/');
    });

    it('should handle empty memberships array', async () => {
      const userWithEmptyMemberships = {
        ...mockUser,
        memberships: [],
      };
      vi.mocked(getServerSession).mockResolvedValue({
        user: userWithEmptyMemberships,
        expires: '2024-12-31T23:59:59.999Z',
      } as Session);

      await expect(requireChapterAccess('test-chapter')).rejects.toThrow('REDIRECT');
      expect(redirect).toHaveBeenCalledWith('/');
    });

    it('should handle multiple memberships correctly', async () => {
      const userWithMultipleMemberships = {
        ...mockUser,
        memberships: [
          mockUser.memberships[0],
          {
            id: 'membership-3',
            role: 'ADMIN',
            chapterId: 'chapter-2',
            chapterSlug: 'other-chapter',
            userId: 'user-1'
          }
        ]
      };
      const mockSession = { 
        user: userWithMultipleMemberships,
        expires: '2024-12-31T23:59:59.999Z',
      };
      vi.mocked(getServerSession).mockResolvedValue(mockSession as Session);
      
      const result = await requireChapterAccess('other-chapter');
      
      expect(result.membership.chapterSlug).toBe('other-chapter');
      expect(result.membership.role).toBe('ADMIN');
    });
  });
});

