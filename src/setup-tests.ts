// This file is used by Vitest to set up the test environment
import { vi } from 'vitest';

// Mock the Next.js environment with a redirect that throws REDIRECT error
const mockRedirect = vi.fn().mockImplementation(() => {
  const error = new Error('REDIRECT');
  error.message = 'REDIRECT';
  throw error;
});

// Mock Next.js router
vi.mock('next/router', () => ({
  useRouter: () => ({
    push: vi.fn(),
    pathname: '/',
    query: {},
    asPath: '/'
  })
}))

// Mock NextAuth
vi.mock('next-auth/react', () => ({
  useSession: () => ({ data: null, status: 'unauthenticated' }),
  signIn: vi.fn(),
  signOut: vi.fn()
}))

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
      findMany: vi.fn(),
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

// REMOVED: The entire vi.mock('@/lib/auth', () => { ... }) block
// This allows tests to import and test the real auth functions
// while still mocking their dependencies (getServerSession, prisma, redirect)
