import { NextResponse } from 'next/server';
import { generateSearchIndex } from '@/lib/docs-search-server';

export async function GET() {
  try {
    const searchIndex = generateSearchIndex();
    
    return NextResponse.json(searchIndex, {
      headers: {
        'Cache-Control': 'public, max-age=3600, s-maxage=3600', // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error('Failed to generate search index:', error);
    
    // Return empty index on error
    return NextResponse.json(
      { pages: [], terms: {} },
      { 
        status: 500,
        headers: {
          'Cache-Control': 'no-cache',
        },
      }
    );
  }
}