import { PrismaAdapter } from "@auth/prisma-adapter";
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { compare } from "bcrypt";

import { MembershipRole } from "@/generated/prisma";

import { prisma } from "@/lib/db";

type MembershipWithChapter = {
  id: string;
  role: MembershipRole;
  chapterId: string;
  chapter: {
    slug: string;
  };
};

// NextAuth configuration options moved to a separate file for Next.js 15 compatibility
export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
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
    async jwt({ token, user }) {
      if (user) {
        // Get the user's memberships
        const memberships = await prisma.membership.findMany({
          where: {
            userId: user.id as string,
          },
          include: {
            chapter: true,
          },
        });

        // Add user ID and memberships to token
        token.id = user.id as string;
        token.memberships = memberships.map((membership: MembershipWithChapter) => ({
          id: membership.id,
          role: membership.role,
          chapterId: membership.chapterId,
          chapterSlug: membership.chapter.slug,
        }));
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.memberships = token.memberships as {
          id: string;
          role: string;
          chapterId: string;
          chapterSlug: string;
        }[];
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
