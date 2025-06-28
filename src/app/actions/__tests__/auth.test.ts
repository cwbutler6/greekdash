import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createChapterForGoogleUser, checkChapterSlugAvailability } from '../auth';
import { hash } from 'bcrypt';

// Mock dependencies
vi.mock('@/lib/auth', () => ({
  getSession: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  prisma: {
    chapter: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    user: {
      update: vi.fn(),
    },
  },
}));

vi.mock('bcrypt', () => ({
  hash: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}));

// Import mocked modules
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { redirect } from 'next/navigation';

// Mock FormData
class MockFormData {
  data: Record<string, string>;
  
  constructor(data: Record<string, string>) {
    this.data = data;
  }
  
  get(key: string) {
    return this.data[key];
  }
}

describe('Auth Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (hash as ReturnType<typeof vi.fn>).mockResolvedValue('hashedPassword123');
  });
  
  describe('createChapterForGoogleUser', () => {
    it('should create a new chapter for a Google user', async () => {
      // Setup
      const userId = 'user-123';
      const chapterSlug = 'alpha-beta';
      const fullName = 'Alpha Beta';
      
      const formData = new MockFormData({
        chapterSlug,
        fullName,
        email: 'user@example.com',
      }) as unknown as FormData;
      
      const mockSession = {
        user: {
          id: userId,
          email: 'user@example.com',
          name: 'Alpha User',
        },
      };
      
      const mockCreatedChapter = {
        id: 'chapter-123',
        slug: chapterSlug,
        name: "Alpha's Chapter",
        memberships: [
          {
            id: 'membership-123',
            userId,
            role: 'OWNER',
          },
        ],
      };
      
      (getSession as ReturnType<typeof vi.fn>).mockResolvedValue(mockSession);
      (prisma.chapter.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);
      (prisma.chapter.create as ReturnType<typeof vi.fn>).mockResolvedValue(mockCreatedChapter);
      
      // Test
      try {
        await createChapterForGoogleUser(formData);
      } catch {
        // Ignored - redirect throws an error
      }
      
      // Assert
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { password: 'hashedPassword123' },
      });
      
      expect(prisma.chapter.create).toHaveBeenCalledWith({
        data: {
          slug: chapterSlug,
          name: "Alpha's Chapter",
          memberships: {
            create: {
              userId,
              role: 'OWNER',
            },
          },
        },
        include: {
          memberships: true,
        },
      });
      
      expect(redirect).toHaveBeenCalledWith(`/${chapterSlug}/admin`);
    });
    
    it('should throw an error when slug is already taken', async () => {
      // Setup
      const userId = 'user-123';
      const chapterSlug = 'alpha-beta';
      const fullName = 'Alpha Beta';
      
      const formData = new MockFormData({
        chapterSlug,
        fullName,
        email: 'user@example.com',
      }) as unknown as FormData;
      
      const mockSession = {
        user: {
          id: userId,
          email: 'user@example.com',
          name: 'Alpha User',
        },
      };
      
      const existingChapter = {
        id: 'existing-chapter',
        slug: chapterSlug,
      };
      
      (getSession as ReturnType<typeof vi.fn>).mockResolvedValue(mockSession);
      (prisma.chapter.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(existingChapter);
      
      // Test & Assert
      await expect(createChapterForGoogleUser(formData)).rejects.toThrow('Chapter URL is already taken');
    });
    
    it('should throw an error when not authenticated', async () => {
      // Setup
      const chapterSlug = 'alpha-beta';
      const fullName = 'Alpha Beta';
      
      const formData = new MockFormData({
        chapterSlug,
        fullName,
        email: 'user@example.com',
      }) as unknown as FormData;
      
      (getSession as ReturnType<typeof vi.fn>).mockResolvedValue(null);
      
      // Test & Assert
      await expect(createChapterForGoogleUser(formData)).rejects.toThrow('Not authenticated');
    });
    
    it('should throw an error when form data is invalid', async () => {
      // Setup
      const userId = 'user-123';
      
      const formData = new MockFormData({
        chapterSlug: 'a', // Too short
        fullName: 'AB',   // Too short
        email: 'user@example.com',
      }) as unknown as FormData;
      
      const mockSession = {
        user: {
          id: userId,
          email: 'user@example.com',
          name: 'Alpha User',
        },
      };
      
      (getSession as ReturnType<typeof vi.fn>).mockResolvedValue(mockSession);
      
      // Test & Assert
      await expect(createChapterForGoogleUser(formData)).rejects.toThrow('Chapter URL must be at least 3 characters');
    });
  });
  
  describe('checkChapterSlugAvailability', () => {
    it('should return available=true when slug is available', async () => {
      // Setup
      const slug = 'available-slug';
      (prisma.chapter.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);
      
      // Test
      const result = await checkChapterSlugAvailability(slug);
      
      // Assert
      expect(result).toEqual({
        available: true,
        message: 'Available',
      });
    });
    
    it('should return available=false when slug is taken', async () => {
      // Setup
      const slug = 'taken-slug';
      const existingChapter = {
        id: 'chapter-123',
        slug,
      };
      (prisma.chapter.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(existingChapter);
      
      // Test
      const result = await checkChapterSlugAvailability(slug);
      
      // Assert
      expect(result).toEqual({
        available: false,
        message: 'This chapter URL is already taken',
      });
    });
    
    it('should validate slug format', async () => {
      // Setup - invalid slug with special characters
      const invalidSlug = 'invalid@slug';
      
      // Test
      const result = await checkChapterSlugAvailability(invalidSlug);
      
      // Assert
      expect(result).toEqual({
        available: false,
        message: 'Slug can only contain lowercase letters, numbers, and hyphens',
      });
    });
    
    it('should validate slug length', async () => {
      // Setup - slug too short
      const shortSlug = 'ab';
      
      // Test
      const result = await checkChapterSlugAvailability(shortSlug);
      
      // Assert
      expect(result).toEqual({
        available: false,
        message: 'Slug must be at least 3 characters',
      });
    });
  });
});
