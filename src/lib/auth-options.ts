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
      // Always allow sign in to proceed, but track sign-ins for debugging
      if (account?.provider) {
        console.log(`${account.provider} sign-in detected`, { userId: user.id });
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
        
        // Mark as new user only if they have no memberships
        // Important: Only set isNewUser flag for OAuth sign-ins, not for credentials sign-ins
        const isNewUser = userMemberships.length === 0 && account?.provider !== 'credentials';
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
      try {
        // Start with basic security checks
        // Block external redirects for security
        if (!url.startsWith("/") && new URL(url).origin !== baseUrl) {
          console.log('Security: Blocked redirect to external URL');
          return baseUrl;
        }
        
        // Special handling for Google OAuth flow completion
        // We need to determine where to send users after they authenticate
        if (url === '/' || url === baseUrl || url.includes('/api/auth/callback/google')) {
          console.log('Handling post-auth redirection');
          
          // For Google OAuth callback, we need to handle differently
          // The token might not be fully propagated to the session yet
          if (url.includes('/api/auth/callback/google')) {
            // We can't directly access the token here, so we need to rely on the session
            // But we need to handle this special case differently than standard redirects
            const { getServerSession } = await import('next-auth');
            const session = await getServerSession(authOptions);
            
            console.log('OAuth callback redirect - session check:', { 
              hasSession: !!session,
              hasUser: !!session?.user,
              email: session?.user?.email,
              membershipCount: session?.user?.memberships?.length || 0
            });
            
            // Use a direct database query to get memberships if the session isn't fully updated yet
            // This is a safety check, as sometimes the session doesn't update fast enough during OAuth callbacks
            let memberships = session?.user?.memberships || [];
            if (memberships.length === 0 && session?.user?.id) {
              // Try a direct query to get the latest membership data
              try {
                const userId = session.user.id;
                console.log(`OAuth: Session memberships empty, checking database for user ${userId}`);
                const userMemberships = await prisma.membership.findMany({
                  where: { userId },
                  include: { chapter: true }
                });
                
                if (userMemberships.length > 0) {
                  console.log(`OAuth: Found ${userMemberships.length} memberships in database`);
                  // Map to the expected format
                  memberships = userMemberships.map(m => ({
                    id: m.id,
                    role: m.role,
                    chapterId: m.chapterId,
                    chapterSlug: m.chapter.slug
                  }));
                }
              } catch (error) {
                console.error('Error fetching memberships:', error);
              }
            }
            
            // Check if we have memberships from the session or direct DB query
            if (memberships && memberships.length > 0) {
              // The user already has memberships, direct them to the appropriate page
              // Find first active (non-pending) membership
              const activeMembership = memberships.find(
                (m: { role: string }) => m.role !== 'PENDING_MEMBER'
              );
              
              if (activeMembership) {
                // Determine destination based on role
                if (activeMembership.role === 'ADMIN' || activeMembership.role === 'OWNER') {
                  const adminUrl = `${baseUrl}/${activeMembership.chapterSlug}/admin`;
                  console.log(`Redirecting OAuth admin to ${adminUrl}`);
                  return adminUrl;
                } else {
                  const memberUrl = `${baseUrl}/${activeMembership.chapterSlug}/portal`;
                  console.log(`Redirecting OAuth member to ${memberUrl}`);
                  return memberUrl;
                }
              } else if (memberships.length > 0) {
                // Handle pending members
                const pendingUrl = `${baseUrl}/${memberships[0].chapterSlug}/pending`;
                console.log(`Redirecting OAuth pending member to ${pendingUrl}`);
                return pendingUrl;
              }
            }
            
            // If we get here, the user doesn't have memberships yet
            console.log('OAuth: No memberships found, redirecting to signup');
            return `${baseUrl}/signup?google=true`;
          }
          
          // For standard redirects, use the session as before
          const { getServerSession } = await import('next-auth');
          const session = await getServerSession(authOptions);
          
          console.log('Auth redirect - session check:', { 
            hasSession: !!session,
            hasUser: !!session?.user,
            isNewUser: session?.user?.isNewUser,
            membershipCount: session?.user?.memberships?.length || 0
          });
          
          // Check memberships first - this is the primary factor for routing
          const memberships = session?.user?.memberships || [];
          
          // Any user without memberships should be sent to signup
          if (memberships.length === 0) {
            console.log('No memberships found, redirecting to signup');
            return `${baseUrl}/signup`;
          }
          
          // Find first active (non-pending) membership
          const activeMembership = memberships.find(
            (m: { role: string }) => m.role !== 'PENDING_MEMBER'
          );
          
          if (activeMembership) {
            // Determine destination based on role
            if (activeMembership.role === 'ADMIN' || activeMembership.role === 'OWNER') {
              const adminUrl = `${baseUrl}/${activeMembership.chapterSlug}/admin`;
              console.log(`Redirecting admin to ${adminUrl}`);
              return adminUrl;
            } else {
              const memberUrl = `${baseUrl}/${activeMembership.chapterSlug}/portal`;
              console.log(`Redirecting member to ${memberUrl}`);
              return memberUrl;
            }
          } else if (memberships.length > 0) {
            // Handle pending members
            const pendingUrl = `${baseUrl}/${memberships[0].chapterSlug}/pending`;
            console.log(`Redirecting pending member to ${pendingUrl}`);
            return pendingUrl;
          }
        }
        
        // Standard NextAuth redirect rules
        if (url.startsWith("/")) {
          return `${baseUrl}${url}`;
        }
        
        if (new URL(url).origin === baseUrl) {
          return url;
        }
        
        return baseUrl;
      } catch (error) {
        console.error('Error in redirect callback:', error);
        return baseUrl;
      }
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
