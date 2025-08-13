// Rate limiting utility for spam protection

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  keyGenerator?: (identifier: string) => string;
}

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

// In-memory store (use Redis in production)
const rateLimitStore = new Map<string, RateLimitRecord>();

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000); // Clean every 5 minutes

export class RateLimiter {
  private config: RateLimitConfig;
  
  constructor(config: RateLimitConfig) {
    this.config = {
      keyGenerator: (id) => id,
      ...config,
    };
  }
  
  check(identifier: string): { allowed: boolean; resetTime?: number; remaining?: number } {
    const now = Date.now();
    const key = this.config.keyGenerator!(identifier);
    const record = rateLimitStore.get(key);
    
    if (!record || now > record.resetTime) {
      // Reset or create new record
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + this.config.windowMs,
      });
      return { 
        allowed: true, 
        remaining: this.config.maxRequests - 1 
      };
    }
    
    if (record.count >= this.config.maxRequests) {
      return { 
        allowed: false, 
        resetTime: record.resetTime,
        remaining: 0 
      };
    }
    
    // Increment count
    record.count++;
    rateLimitStore.set(key, record);
    
    return { 
      allowed: true, 
      remaining: this.config.maxRequests - record.count 
    };
  }
  
  reset(identifier: string): void {
    const key = this.config.keyGenerator!(identifier);
    rateLimitStore.delete(key);
  }
}

// Pre-configured rate limiters for different use cases
export const contactFormLimiter = new RateLimiter({
  maxRequests: 5,
  windowMs: 15 * 60 * 1000, // 15 minutes
  keyGenerator: (ip) => `contact_${ip}`,
});

export const joinFormLimiter = new RateLimiter({
  maxRequests: 3,
  windowMs: 60 * 60 * 1000, // 1 hour
  keyGenerator: (ip) => `join_${ip}`,
});

export const generalApiLimiter = new RateLimiter({
  maxRequests: 100,
  windowMs: 15 * 60 * 1000, // 15 minutes
  keyGenerator: (ip) => `api_${ip}`,
});

// Utility to extract client IP from request
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  
  if (cfConnectingIP) {
    return cfConnectingIP;
  }
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  return 'unknown';
}

// Honeypot validation utility
export function validateHoneypot(data: Record<string, string | undefined>, honeypotFields: string[]): boolean {
  return honeypotFields.every(field => !data[field] || data[field] === '');
}

// Form timing validation
export function validateFormTiming(startTime: number, minTime: number = 3000): boolean {
  const duration = Date.now() - startTime;
  return duration >= minTime;
}

// Input sanitization
export function sanitizeInput(input: string): string {
  return input
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .trim();
}