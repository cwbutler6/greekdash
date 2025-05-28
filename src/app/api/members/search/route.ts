import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth-options';

// Define request schema for type safety
const searchRequestSchema = z.object({
  chapterSlug: z.string().min(1),
  query: z.string().optional(),
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(50).optional().default(20),
});

export async function POST(request: NextRequest) {
  try {
    // Authenticate the user
    const authSession = await getServerSession(authOptions);
    
    if (!authSession?.user) {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = searchRequestSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error.format() },
        { status: 400 }
      );
    }
    
    const { chapterSlug, query, page, limit } = validationResult.data;
    
    // Verify the requesting user is a member of the chapter
    const currentUser = await prisma.user.findFirst({
      where: { 
        email: authSession.user.email as string,
        memberships: {
          some: {
            chapter: { slug: chapterSlug },
            role: { not: 'PENDING_MEMBER' }
          }
        }
      }
    });
    
    if (!currentUser) {
      return NextResponse.json(
        { error: 'You are not a member of this chapter' },
        { status: 403 }
      );
    }

    // Calculate pagination
    const skip = (page - 1) * limit;
    
    // Build search conditions
    let searchConditions = {};
    
    if (query && query.trim() !== '') {
      // For empty searches, don't apply filters (return all members)
      // For non-empty searches, use these separate queries to work around Prisma type issues
      const nameMatches = await prisma.profile.findMany({
        where: {
          chapter: { slug: chapterSlug },
          user: { name: { contains: query, mode: 'insensitive' } }
        },
        select: { id: true }
      });
      
      const emailMatches = await prisma.profile.findMany({
        where: {
          chapter: { slug: chapterSlug },
          user: { email: { contains: query, mode: 'insensitive' } }
        },
        select: { id: true }
      });
      
      const phoneMatches = await prisma.profile.findMany({
        where: {
          chapter: { slug: chapterSlug },
          phone: { contains: query }
        },
        select: { id: true }
      });
      
      const majorMatches = await prisma.profile.findMany({
        where: {
          chapter: { slug: chapterSlug },
          major: { contains: query, mode: 'insensitive' }
        },
        select: { id: true }
      });
      
      // Combine all matching IDs
      const matchingIds = [
        ...nameMatches.map(p => p.id),
        ...emailMatches.map(p => p.id),
        ...phoneMatches.map(p => p.id),
        ...majorMatches.map(p => p.id)
      ];
      
      // Remove duplicates
      const uniqueIds = [...new Set(matchingIds)];
      
      // If we have matches, filter by those IDs
      // If no matches found for the query, return an empty result set (not all members)
      if (uniqueIds.length > 0) {
        searchConditions = { id: { in: uniqueIds } };
      } else {
        // No matches found - return empty result set
        searchConditions = { id: { in: ['no-matches-found'] } };
      }
    }
    
    // Search for members
    const members = await prisma.profile.findMany({
      where: {
        chapter: { slug: chapterSlug },
        membership: { 
          role: { not: 'PENDING_MEMBER' }
        },
        ...searchConditions
      },
      select: {
        id: true,
        phone: true,
        phoneVerified: true,
        smsEnabled: true,
        major: true,
        gradYear: true,
        bio: true,
        profileImage: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          }
        },
        membership: {
          select: {
            role: true
          }
        }
      },
      skip,
      take: limit,
      orderBy: [{ user: { name: 'asc' } }]
    });
    
    // Count total results for pagination
    const totalCount = await prisma.profile.count({
      where: {
        chapter: { slug: chapterSlug },
        membership: { 
          role: { not: 'PENDING_MEMBER' }
        },
        ...searchConditions
      }
    });
    
    // Return members data
    return NextResponse.json({
      members,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });
    
  } catch (error) {
    console.error('Error searching members:', error);
    return NextResponse.json(
      { error: 'Failed to search members' },
      { status: 500 }
    );
  }
}
