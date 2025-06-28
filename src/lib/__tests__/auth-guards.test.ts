import { vi } from 'vitest';
import { MembershipRole } from '@/generated/prisma';

// Import the modules under test - they're already mocked in setup-tests.ts
import { getCurrentUser, requireAuth, requireChapterAccess, requireChapterAdmin } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';

// Get references to the mocked functions using vi.mocked for type safety
const mockRedirect = vi.mocked(redirect);
const mockGetCurrentUser = vi.mocked(getCurrentUser);
const mockChapterFindUnique = vi.mocked(prisma.chapter.findUnique);

describe('Auth Guards', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Setup user with proper structure including memberships
  const mockUserWithMemberships = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    memberships: [
      {
        id: 'membership-1',
        role: MembershipRole.MEMBER,
        chapterId: 'chapter-1',
        chapterSlug: 'alpha-beta'
      }
    ]
  };

  const mockUserWithNoMemberships = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    memberships: []
  };

  const mockUserWithOtherMemberships = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    memberships: [
      {
        id: 'membership-2',
        role: MembershipRole.MEMBER,
        chapterId: 'chapter-2',
        chapterSlug: 'beta-gamma'
      }
    ]
  };

  const mockUserWithAdminRole = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    memberships: [
      {
        id: 'membership-1',
        role: MembershipRole.ADMIN,
        chapterId: 'chapter-1',
        chapterSlug: 'alpha-beta'
      }
    ]
  };

  const mockUserWithOwnerRole = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    memberships: [
      {
        id: 'membership-1',
        role: MembershipRole.OWNER,
        chapterId: 'chapter-1',
        chapterSlug: 'alpha-beta'
      }
    ]
  };

  describe('requireAuth', () => {
    it('should return the user when authenticated', async () => {
      mockGetCurrentUser.mockResolvedValue(mockUserWithMemberships);
      
      const result = await requireAuth();
      
      expect(result).toEqual(mockUserWithMemberships);
      expect(mockRedirect).not.toHaveBeenCalled();
    });
    
    it('should redirect to login when not authenticated', async () => {
      mockGetCurrentUser.mockResolvedValue(null);
      
      await expect(requireAuth()).rejects.toThrow('REDIRECT');
      expect(mockRedirect).toHaveBeenCalledWith('/login');
    });
  });
  
  describe('requireChapterAccess', () => {
    const chapterSlug = 'alpha-beta';
    
    it('should grant access when user is in the chapter', async () => {
      mockGetCurrentUser.mockResolvedValue(mockUserWithMemberships);
      
      const result = await requireChapterAccess(chapterSlug);
      
      expect(result.user).toEqual(mockUserWithMemberships);
      expect(result.membership.chapterSlug).toBe(chapterSlug);
      expect(mockRedirect).not.toHaveBeenCalled();
    });
    
    it('should redirect when user has memberships but not in the requested chapter', async () => {
      mockGetCurrentUser.mockResolvedValue(mockUserWithOtherMemberships);
      
      await expect(requireChapterAccess(chapterSlug)).rejects.toThrow('REDIRECT');
      expect(mockRedirect).toHaveBeenCalledWith(`/${mockUserWithOtherMemberships.memberships[0].chapterSlug}/portal`);
    });
    
    it('should redirect to home when user has no memberships', async () => {
      mockGetCurrentUser.mockResolvedValue(mockUserWithNoMemberships);
      
      await expect(requireChapterAccess(chapterSlug)).rejects.toThrow('REDIRECT');
      expect(mockRedirect).toHaveBeenCalledWith('/');
    });
  });
  
  describe('requireChapterAdmin', () => {
    const chapterSlug = 'alpha-beta';
    
    it('should grant access when user is an admin of the chapter', async () => {
      mockGetCurrentUser.mockResolvedValue(mockUserWithAdminRole);
      mockChapterFindUnique.mockResolvedValue({
        id: 'chapter-1',
        slug: chapterSlug,
        name: 'Alpha Beta Chapter'
      });
      
      const result = await requireChapterAdmin(chapterSlug);
      
      expect(result.user).toEqual(mockUserWithAdminRole);
      expect(result.membership.role).toBe(MembershipRole.ADMIN);
      expect(mockRedirect).not.toHaveBeenCalled();
    });
    
    it('should grant access when user is an owner of the chapter', async () => {
      mockGetCurrentUser.mockResolvedValue(mockUserWithOwnerRole);
      mockChapterFindUnique.mockResolvedValue({
        id: 'chapter-1',
        slug: chapterSlug,
        name: 'Alpha Beta Chapter'
      });
      
      const result = await requireChapterAdmin(chapterSlug);
      
      expect(result.user).toEqual(mockUserWithOwnerRole);
      expect(result.membership.role).toBe(MembershipRole.OWNER);
      expect(mockRedirect).not.toHaveBeenCalled();
    });
    
    it('should redirect to portal when user is a regular member of the chapter', async () => {
      mockGetCurrentUser.mockResolvedValue(mockUserWithMemberships);
      
      await expect(requireChapterAdmin(chapterSlug)).rejects.toThrow('REDIRECT');
      expect(mockRedirect).toHaveBeenCalledWith(`/${chapterSlug}/portal`);
    });
    
    it('should redirect to home when chapter does not exist', async () => {
      mockGetCurrentUser.mockResolvedValue(mockUserWithMemberships);
      mockChapterFindUnique.mockResolvedValue(null);
      
      await expect(requireChapterAdmin(chapterSlug)).rejects.toThrow('REDIRECT');
      expect(mockRedirect).toHaveBeenCalledWith('/');
    });
  });
});
