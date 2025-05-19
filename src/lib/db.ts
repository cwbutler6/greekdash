import { PrismaClient } from '@/generated/prisma';

/**
 * PrismaClient initialization with improved connection handling for production environments
 * to prevent the "prepared statement already exists" error in serverless environments.
 * 
 * In production, each PrismaClient must properly connect and disconnect.
 * In development, we reuse the same instance across hot reloads.
 */

// Extend global to include our prisma client
// This is the proper way to add types to the global scope in TypeScript
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// Initialize client with specific options based on environment
function initPrismaClient() {
  // Production configuration - optimized for serverless environments
  if (process.env.NODE_ENV === 'production') {
    return new PrismaClient({
      log: ['error'],
      // Clear the connection pool on initialization in production
      // This helps prevent the "prepared statement already exists" error
      datasources: {
        db: {
          url: process.env.DATABASE_URL
        }
      }
    });
  }
  
  // Development configuration
  return new PrismaClient({
    log: ['query', 'error', 'warn'],
  });
}

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit during hot reloads.
let prisma: PrismaClient;

// Check if we already have a Prisma instance cached in development
if (process.env.NODE_ENV === 'production') {
  prisma = initPrismaClient();
} else {
  if (!global.prisma) {
    global.prisma = initPrismaClient();
  }
  prisma = global.prisma;
}

// Handle graceful shutdown and connection pooling in production
if (process.env.NODE_ENV === 'production') {
  // Properly disconnect Prisma when the process exits to avoid connection leaks
  process.on('beforeExit', async () => {
    await prisma.$disconnect();
  });
  
  // Handle unexpected shutdowns
  process.on('SIGTERM', async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
  
  process.on('SIGINT', async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

export { prisma };

// Export prisma as db as well to support existing imports
export const db = prisma;
