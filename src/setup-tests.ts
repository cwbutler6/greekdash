// This file is used by Vitest to set up the test environment
import { vi } from 'vitest';

// Mock the Next.js environment with a redirect that throws REDIRECT error
const mockRedirect = vi.fn().mockImplementation(() => {
  const error = new Error('REDIRECT');
  error.message = 'REDIRECT';
  throw error;
});

vi.mock('next/navigation', () => ({
  redirect: mockRedirect,
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    pathname: '/',
    query: {},
  })),
  usePathname: vi.fn(() => '/'),
  useSearchParams: vi.fn(() => new URLSearchParams()),
}));

// Create a reusable mock Prisma client
const createMockPrismaClient = () => {
  return {
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(), // Added findMany method for user model
      create: vi.fn(),
      update: vi.fn(),
      upsert: vi.fn(),
      delete: vi.fn(),
      count: vi.fn()
    },
    chapter: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      upsert: vi.fn(),
      delete: vi.fn(),
      count: vi.fn()
    },
    membership: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      upsert: vi.fn(),
      delete: vi.fn(),
      count: vi.fn()
    },
    invitation: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      upsert: vi.fn(),
      delete: vi.fn(),
      count: vi.fn()
    },
    subscription: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      upsert: vi.fn(),
      count: vi.fn()
    },
    payment: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn()
    },
    $transaction: vi.fn((callback) => callback(mockPrismaClient)),
    $connect: vi.fn(),
    $disconnect: vi.fn()
  };
};

// Create the mock client instance
const mockPrismaClient = createMockPrismaClient();

// Setup for server components - comprehensive Prisma mock
vi.mock('@/lib/db', () => {
  return {
    prisma: mockPrismaClient,
    db: mockPrismaClient
  };
});

// Mock NextAuth session
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(() => Promise.resolve(null)),
}));

// Mock the auth.ts module with working implementations for tests
vi.mock('@/lib/auth', () => {
  const getCurrentUserMock = vi.fn();
  
  return {
    getCurrentUser: getCurrentUserMock,
    getSession: vi.fn(),
    
    // Return a proper implementation that matches the real function
    requireAuth: vi.fn().mockImplementation(async () => {
      const user = await getCurrentUserMock();
      if (!user) {
        mockRedirect('/login');
        throw new Error('Not authenticated');
      }
      return user;
    }),
    
    // Implement requireChapterAccess to match the real function and actually return the expected object
    requireChapterAccess: vi.fn().mockImplementation(async (chapterSlug) => {
      const user = await getCurrentUserMock();
      if (!user) {
        mockRedirect('/login');
        throw new Error('REDIRECT');
      }
      
      // Check if user has access to this chapter
      const membership = user?.memberships?.find((m: { chapterSlug: string }) => m.chapterSlug === chapterSlug);
      if (!membership) {
        if (user.memberships && user.memberships.length > 0) {
          const firstMembership = user.memberships[0];
          const redirectPath = firstMembership.role === 'ADMIN' || firstMembership.role === 'OWNER'
            ? `/${firstMembership.chapterSlug}/admin`
            : `/${firstMembership.chapterSlug}/portal`;
          mockRedirect(redirectPath);
        } else {
          mockRedirect('/');
        }
        throw new Error('REDIRECT');
      }
      
      return {
        user,
        membership: {
          id: membership.id,
          role: membership.role,
          chapterId: membership.chapterId,
          chapterSlug: membership.chapterSlug, // Add this line
          userId: user.id,
        }
      };
    }),
    
    // Implement requireChapterAdmin to match the real function
    requireChapterAdmin: vi.fn(async (chapterSlug: string) => {
      const user = await getCurrentUserMock();
      if (!user) {
        mockRedirect('/login');
        throw new Error('REDIRECT');
      }
      
      // Check chapter existence FIRST
      const mockChapterFindUnique = mockPrismaClient.chapter.findUnique as ReturnType<typeof vi.fn>;
      const chapter = await mockChapterFindUnique({
        where: { slug: chapterSlug },
      });
      
      if (!chapter) {
        mockRedirect('/');
        throw new Error('REDIRECT');
      }
      
      // Then check membership and role
      const membership = user.memberships?.find((m: { chapterSlug: string }) => m.chapterSlug === chapterSlug);
      if (!membership) {
        mockRedirect('/');
        throw new Error('REDIRECT');
      }
      
      if (membership.role !== 'ADMIN' && membership.role !== 'OWNER') {
        mockRedirect(`/${chapterSlug}/portal`);
        throw new Error('REDIRECT');
      }
      
      return { 
        user, 
        membership: {
          id: membership.id,
          role: membership.role,
          chapterId: membership.chapterId,
          chapterSlug: membership.chapterSlug,
          userId: user.id,
        }, 
        chapter 
      };
    }),
    
    getChapterContext: vi.fn((params) => ({
      chapterSlug: params.chapterSlug
    }))
  };
});
