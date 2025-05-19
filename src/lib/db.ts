import { PrismaClient } from '@/generated/prisma';

/**
 * PrismaClient setup for Next.js with direct database connections
 * 
 * This implementation uses direct connections instead of pooling to avoid
 * the "prepared statement already exists" error in PostgreSQL.
 */

// Add prisma to the NodeJS global type
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

/**
 * Create a prisma client with direct connections
 * This approach minimizes connection pooling issues in serverless environments
 */
function createPrismaClient() {
  // Use DIRECT_URL for direct PostgreSQL connections
  // This bypasses PgBouncer and connects directly to PostgreSQL
  const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL || '';
  
  // No need to add connection_limit=1 to DIRECT_URL as it's already a direct connection
  // but we'll handle both DIRECT_URL and fallback to DATABASE_URL with params
  const url = connectionString.includes('pgbouncer=true')
    ? `${connectionString}&connection_limit=1&pool_timeout=0` 
    : connectionString;
  
  const client = new PrismaClient({
    log: process.env.NODE_ENV === 'development' 
      ? ['query', 'info', 'warn', 'error']
      : ['error'],
    datasources: {
      db: { url }
    }
  });

  // Simple retry logic for direct connections
  // Even with direct connections, we still need to handle potential prepared statement conflicts
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
      
      // Only retry on prepared statement conflicts
      if (pgError.code === '42P05') {
        // Short delay before retry
        await new Promise(resolve => setTimeout(resolve, 20));
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
