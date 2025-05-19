import { PrismaClient } from '@/generated/prisma';

/**
 * Enhanced PrismaClient for serverless environments
 * 
 * This implementation specifically addresses the "prepared statement already exists" error
 * by utilizing connection pooling best practices specific to serverless environments.
 */

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// PrismaClient singleton implementation for optimal connection management

// Custom PrismaClient with enhanced error handling for prepared statements
class PrismaClientSingleton extends PrismaClient {
  constructor() {
    // Pass environment-specific configuration options
    super({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
      datasources: {
        db: {
          url: process.env.DATABASE_URL
        }
      }
      // Note: We rely on connection middleware for handling prepared statement errors
      // rather than engine configuration
    });

    // Apply custom middleware to handle connection issues
    if (process.env.NODE_ENV === 'production') {
      this.$use(async (params, next) => {
        try {
          return await next(params);
        } catch (error) {
          // Type guard for error objects with message property
          const isErrorWithMessage = (err: unknown): err is { message: string } => 
            typeof err === 'object' && err !== null && 'message' in err && 
            typeof (err as { message: unknown }).message === 'string';
          
          // Specifically handle the "prepared statement already exists" error
          if (isErrorWithMessage(error) && 
              (error.message.includes('prepared statement') || 
              (error.message.includes('ConnectorError') && 
               error.message.includes('42P05')))) {
            // Log the error for debugging
            console.error('Prepared statement error encountered, reconnecting...', error);
            
            // Attempt to disconnect and reconnect the client
            await this.$disconnect();
            
            // Add small delay to ensure connection is properly terminated
            await new Promise(resolve => setTimeout(resolve, 50));
            
            // Reconnect
            await this.$connect();
            
            // Retry the query
            return await next(params);
          }
          
          // Re-throw other errors
          throw error;
        }
      });
    }
  }
}

// Factory function to ensure singleton instance
function getPrismaClient(): PrismaClient {
  if (process.env.NODE_ENV === 'production') {
    // In production, create a new instance for each serverless function
    // with custom error handling
    return new PrismaClientSingleton();
  } else {
    // In development, reuse the same instance to avoid connection limit issues
    if (!global.prisma) {
      global.prisma = new PrismaClientSingleton();
    }
    return global.prisma;
  }
}

// Initialize the Prisma client
const prisma = getPrismaClient();

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
