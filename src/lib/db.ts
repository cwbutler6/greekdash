import { PrismaClient } from '@/generated/prisma';

// Define our own LogLevel enum since it's not exported from Prisma anymore
enum LogLevel {
  INFO = 'info',
  QUERY = 'query',
  WARN = 'warn',
  ERROR = 'error'
}

// Define our own LogDefinition type
type LogDefinition = {
  level: LogLevel;
  emit: 'stdout' | 'event';
};

/**
 * PrismaClient setup for Vercel serverless environments
 * 
 * This implementation follows Vercel's recommended best practices for
 * PostgreSQL connection pooling in serverless environments.
 * 
 * For more info: https://www.prisma.io/docs/orm/prisma-client/setup-and-configuration/databases-connections/connection-pool
 */

// Add prisma to NodeJS global type
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// Define log levels based on environment
const logOptions: (LogLevel | LogDefinition)[] = 
  process.env.NODE_ENV === 'development' 
    ? [LogLevel.QUERY, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR] 
    : [LogLevel.ERROR];

/**
 * Initialize PrismaClient with settings optimized for Vercel serverless deployment
 * and PostgreSQL connection pooling
 */
function createPrismaClient() {
  return new PrismaClient({
    log: logOptions,
  });
}

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit during hot-reloads.
let prisma: PrismaClient;

if (process.env.NODE_ENV === 'production') {
  // In production, create a new instance for each serverless function
  prisma = createPrismaClient();
} else {
  // In development, reuse the same instance across hot reloads
  if (!global.prisma) {
    global.prisma = createPrismaClient();
  }
  prisma = global.prisma;
}

// Handle shutdown gracefully in production
if (process.env.NODE_ENV === 'production') {
  process.on('beforeExit', async () => {
    await prisma.$disconnect();
  });
}

export { prisma };

// Export prisma as db as well to support existing imports
export const db = prisma;
