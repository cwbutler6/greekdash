import { PrismaAdapter } from "@auth/prisma-adapter";
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { compare } from "bcrypt";

import { MembershipRole } from "@/generated/prisma";

import { prisma } from "@/lib/db";

// Extend the built-in next-auth types
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      isNewUser?: boolean;
      memberships: {
        id: string;
        role: string;
        chapterId: string;
        chapterSlug: string;
      }[];
    };
  }
}

// NextAuth configuration options moved to a separate file for Next.js 15 compatibility
export const authOptions: NextAuthOptions = {
  // Use PrismaAdapter to enable account linking between providers
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      allowDangerousEmailAccountLinking: true,
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          // Store whether this user was created via OAuth
          emailVerified: new Date(),
        };
      },
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials");
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email,
          },
        });

        if (!user || !user.password) {
          throw new Error("Invalid credentials");
        }

        const isCorrectPassword = await compare(
          credentials.password,
          user.password
        );

        if (!isCorrectPassword) {
          throw new Error("Invalid credentials");
        }

        return user;
      },
    }),
  ],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  debug: process.env.NODE_ENV === "development",
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async signIn({ user, account }) {
      // Track sign-ins for debugging and enhance social login detection
      if (account?.provider && account.provider !== 'credentials') {
        console.log(`Social sign-in detected from ${account.provider}`, { 
          userId: user.id,
          email: user.email,
          name: user.name,
          provider: account.provider
        });
        
        // For social logins, we'll check if this user needs the special onboarding flow
        try {
          // Check if user has any memberships
          const existingMemberships = await prisma.membership.findMany({
            where: { userId: user.id }
          });
          
          if (existingMemberships.length === 0) {
            console.log(`Social user ${user.id} has no memberships - will use social onboarding`);
          }
        } catch (error) {
          console.error('Error checking memberships during signIn:', error);
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      // Add extensive debug logging to trace the issue
      console.log('JWT CALLBACK RECEIVED:', {
        hasUser: !!user,
        userEmail: user?.email,
        userId: user?.id,
        hasAccount: !!account,
        accountProvider: account?.provider,
        tokenEmail: token?.email,
        initialToken: JSON.stringify(token).substring(0, 100),
      });
      
      if (user) {
        // For OAuth sign-ins, we ALWAYS prioritize the email from the OAuth provider
        // This is critical for proper account linking
        const userEmail = user.email;
        console.log('AUTH DEBUG - User Object:', {
          id: user.id,
          email: user.email,
          provider: account?.provider,
        });
        
        // Store user ID and primary email on token
        token.id = user.id;
        token.email = userEmail;
        
        // STEP 1: Find direct memberships by user ID
        let userMemberships = await prisma.membership.findMany({
          where: { userId: user.id },
          include: { chapter: true }
        });
        
        // STEP 2: If this is an OAuth sign-in, check for existing accounts with the same email
        if (account?.provider && userEmail) {
          console.log(`Auth: Checking account linking for ${userEmail}`);
          
          // Look for ANY users with this email that might have memberships
          // This is the key to proper account linking - when users sign in with different methods
          const existingUsers = await prisma.user.findMany({
            where: { 
              email: userEmail,
              // Don't include the current user
              NOT: { id: user.id }
            },
            include: {
              memberships: { include: { chapter: true } }
            }
          });
          
          // Filter to find users who have memberships (these are the ones we care about)
          const usersWithMemberships = existingUsers.filter(u => u.memberships.length > 0);
          
          if (usersWithMemberships.length > 0) {
            console.log(`Auth: Found ${usersWithMemberships.length} existing account(s) with memberships for email ${userEmail}`);
            
            // For each user with memberships, transfer them to the current user
            for (const existingUser of usersWithMemberships) {
              console.log(`Auth: Linking accounts by transferring ${existingUser.memberships.length} memberships from user ${existingUser.id} to ${user.id}`);
              
              // Transfer each membership to the current user
              for (const membership of existingUser.memberships) {
                try {
                  await prisma.membership.update({
                    where: { id: membership.id },
                    data: { userId: user.id }
                  });
                } catch (error) {
                  console.error(`Error transferring membership ${membership.id}:`, error);
                }
              }
            }
            
            // After transferring, get the updated memberships
            userMemberships = await prisma.membership.findMany({
              where: { userId: user.id },
              include: { chapter: true }
            });
          }
        }

        // Map memberships to the token format
        token.memberships = userMemberships.map((membership) => ({
          id: membership.id,
          role: membership.role,
          chapterId: membership.chapterId,
          chapterSlug: membership.chapter.slug,
        }));
        
        // Set new user flag based on whether we found any memberships
        console.log('Setting user token info', { 
          userId: user.id, 
          email: userEmail,
          provider: account?.provider,
          hasMemberships: userMemberships.length > 0,
          membershipCount: userMemberships.length,
          membershipIds: userMemberships.map((m) => m.id)
        });
        
        // Determine if this is a new user from a social login
        // 1. Must have no memberships
        // 2. Must be from an OAuth provider (not credentials)
        // 3. Check if the account was just created
        const isNewUser = 
          userMemberships.length === 0 && 
          account?.provider && 
          account.provider !== 'credentials';
        
        if (isNewUser) {
          console.log(`New social user detected from ${account?.provider}`, { userId: user.id, email: userEmail });
        }
        
        token.isNewUser = isNewUser;
        
        console.log('isNewUser flag set to:', isNewUser, 
          isNewUser ? '(will be sent to signup)' : '(has existing memberships)');
        if (isNewUser) {
          console.log(`Found 0 existing memberships for ${userEmail}`);
        } else {
          console.log(`Found ${userMemberships.length} existing membership(s) for ${userEmail}`);
        }
        
        // Note: We don't need to set token.memberships again as we already did this above
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        // Get memberships from token
        if (token.id) {
          session.user.id = token.id;
          session.user.memberships = token.memberships as {
            id: string;
            role: MembershipRole;
            chapterId: string;
            chapterSlug: string;
          }[];
          
          // Pass new user flag to client if present
          session.user.isNewUser = token.isNewUser === true;
          
          // Log the session creation for debugging
          console.log('Session created/updated for user', { 
            userId: session.user.id,
            isNewUser: session.user.isNewUser,
            tokenIsNewUser: token.isNewUser 
          });
        }
      }
      return { ...session };
    },
    async redirect({ url, baseUrl }) {
      // Enhanced logging for debugging
      console.log(`NextAuth redirect called with: ${url}`, { baseUrl });
      
      // Special handling for OAuth callbacks
      const isAuthCallback = url.includes('/api/auth/callback/');
      
      if (isAuthCallback) {
        // Extract the provider from the URL (google, github, etc.)
        const providerMatch = url.match(/\/api\/auth\/callback\/([^\/]+)/);
        const provider = providerMatch ? providerMatch[1] : 'social';
        
        console.log(`OAuth callback detected for provider: ${provider}`);
        return `${baseUrl}/social-signup?provider=${provider}`;
      }
      
      // REMOVE CIRCULAR DEPENDENCY - no longer attempting to get session within authOptions
      // since that creates a recursive call loop
      
      // SIMPLE APPROACH: Standard NextAuth redirect rules without circular references
      try {
        // For relative URLs from the app
        if (url.startsWith("/")) {
          return `${baseUrl}${url}`;
        }
        
        // For absolute URLs from the same origin
        try {
          const urlOrigin = new URL(url).origin;
          if (urlOrigin === baseUrl) {
            return url;
          }
        } catch {
          // URL parsing error, fall back to baseUrl
          console.log('Invalid URL format, falling back to base URL');
        }
        
        // Default fallback for safety
        return baseUrl;
      } catch (error) {
        console.error('Error in redirect callback:', error);
        return baseUrl; // Safe fallback in case of errors
      }
    }
  }
};
