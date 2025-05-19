import { PrismaClient } from '@/generated/prisma';

/**
 * PrismaClient setup for Next.js with PostgreSQL
 * 
 * This implementation uses the official Prisma solution for the 
 * "prepared statement already exists" error in PostgreSQL + Prisma + Serverless.
 * 
 * Reference: https://www.prisma.io/docs/orm/prisma-client/setup-and-configuration/databases-connections
 */

// Add prisma to the NodeJS global type
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// This is the official pattern recommended by Prisma for serverless environments
// with PostgreSQL to avoid the "prepared statement already exists" error

// Step 1: Define the PrismaClient creation function with proper settings
function getPrismaClient() {
  // Critical: Use DIRECT_URL without pgbouncer for serverless environments
  const directUrl = process.env.DIRECT_URL;
  
  // Create the client with proper settings
  const client = new PrismaClient({
    log: process.env.NODE_ENV === 'development' 
      ? ['query', 'info', 'warn', 'error']
      : ['error'],
    // Using DIRECT_URL is essential to avoid the prepared statement conflicts
    datasources: {
      db: { url: directUrl }
    }
  });
  
  return client;
}

// This is key for avoiding issues in serverless environments like Vercel:
// - In production: Each serverless function instance gets a new PrismaClient
// - In development: We reuse the same instance to avoid connection limit problems

// PrismaClient singleton pattern for Next.js
const prismaGlobal = global as unknown as { prisma: PrismaClient };

// Assign the client based on environment
let prisma: PrismaClient;

// For development, reuse the client across hot reloads
if (process.env.NODE_ENV === 'development') {
  if (!prismaGlobal.prisma) {
    prismaGlobal.prisma = getPrismaClient();
  }
  prisma = prismaGlobal.prisma;
} else {
  // For production, create a new instance per serverless function  
  prisma = getPrismaClient();
}

// Handle clean disconnect
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

export { prisma };

// Export prisma as db as well to maintain backwards compatibility
export const db = prisma;
