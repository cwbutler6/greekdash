import { PrismaClient } from '@/generated/prisma';

/**
 * PrismaClient setup for Next.js with Vercel serverless environments
 * 
 * This implementation addresses the "prepared statement already exists" error
 * that commonly occurs with PostgreSQL in serverless environments.
 */

// Add prisma to the NodeJS global type
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

/**
 * Create a prisma client with specific log settings based on environment
 * This approach follows Prisma's recommended pattern for Next.js
 */
function createPrismaClient() {
  const client = new PrismaClient({
    log: process.env.NODE_ENV === 'development' 
      ? ['query', 'info', 'warn', 'error']
      : ['error'],
    // Setting connection pool settings to minimize prepared statement conflicts
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  });

  // Add PostgreSQL retry logic
  client.$use(async (params, next) => {
    try {
      return await next(params);
    } catch (error: unknown) {
      // Type guard for error objects with code property
      interface PostgresError extends Error {
        code?: string;
      }
      
      // Cast error to our specific type
      const pgError = error as PostgresError;
      
      // Retry on "prepared statement already exists" PostgreSQL error
      if (pgError.code === '42P05' || pgError.message?.includes('prepared statement')) {
        // Add a small delay to allow cleanup
        await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100));
        // Try one more time
        return await next(params);
      }
      throw error;
    }
  });

  return client;
}

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit during hot reloads
const prisma = global.prisma || createPrismaClient();

// Important for Next.js: Set the global instance
if (process.env.NODE_ENV !== 'production') global.prisma = prisma;

// Handle graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

export { prisma };

// Export prisma as db as well to maintain backwards compatibility
export const db = prisma;
