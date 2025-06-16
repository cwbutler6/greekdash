// jest.setup.js
// Next.js 15 requires using import syntax
import '@testing-library/jest-dom';

// Add custom matchers
expect.extend({
  toHaveBeenCalledWithChapterContext: (received, chapterSlug) => {
    const calls = received.mock.calls;
    const match = calls.some(call => 
      call.some(arg => 
        (arg && typeof arg === 'object' && 
         ((arg.chapterSlug === chapterSlug) || 
          (arg.where && arg.where.chapter && arg.where.chapter.slug === chapterSlug)))
      )
    );
    
    if (match) {
      return {
        pass: true,
        message: () => `expected ${received.getMockName()} not to be called with chapter context ${chapterSlug}`,
      };
    } else {
      return {
        pass: false,
        message: () => `expected ${received.getMockName()} to be called with chapter context ${chapterSlug}`,
      };
    }
  },
});

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    pathname: '',
  })),
  useSearchParams: jest.fn(() => new URLSearchParams()),
  usePathname: jest.fn(() => ''),
  useParams: jest.fn(() => Promise.resolve({})),
}));

// Mock NextAuth session
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(() => 
    Promise.resolve({
      user: {
        id: 'test-user-id',
        name: 'Test User',
        email: 'test@example.com',
      },
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    })
  ),
}));

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(() => ({
    data: {
      user: {
        id: 'test-user-id',
        name: 'Test User',
        email: 'test@example.com',
      },
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    },
    status: 'authenticated',
  })),
  getSession: jest.fn(() => 
    Promise.resolve({
      user: {
        id: 'test-user-id',
        name: 'Test User',
        email: 'test@example.com',
      },
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    })
  ),
  signIn: jest.fn(),
  signOut: jest.fn(),
}));

// Mock Stripe
jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    webhooks: {
      constructEvent: jest.fn(),
    },
    subscriptions: {
      retrieve: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
    customers: {
      create: jest.fn(),
      retrieve: jest.fn(),
    },
    checkout: {
      sessions: {
        create: jest.fn(),
      },
    },
  }));
});

// Mock Prisma
jest.mock('@/lib/db', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    membership: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    chapter: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
    },
    subscription: {
      create: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
    },
    transaction: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    joinCode: {
      create: jest.fn(),
      findFirst: jest.fn(),
    },
    payment: {
      create: jest.fn(),
    },
    $transaction: jest.fn(callback => callback()),
  },
}));

// Mock multi-tenant context with chapter slug
global.chapterContext = {
  chapterSlug: 'test-chapter',
};

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});

