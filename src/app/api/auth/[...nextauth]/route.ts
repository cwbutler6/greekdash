import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth-options';

// In Next.js 15, the route handlers for API routes must be exported as GET, POST, etc.
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
