import prisma from '@/lib/prisma';

/**
 * Get a chapter by its slug
 */
export async function getChapterFromSlug(slug: string) {
  try {
    const chapter = await prisma.chapter.findUnique({
      where: { slug },
    });
    
    return chapter;
  } catch (error) {
    console.error('Error fetching chapter by slug:', error);
    return null;
  }
}

/**
 * Get a chapter by its ID
 */
export async function getChapterById(id: string) {
  try {
    const chapter = await prisma.chapter.findUnique({
      where: { id },
    });
    
    return chapter;
  } catch (error) {
    console.error('Error fetching chapter by id:', error);
    return null;
  }
}

/**
 * Check if chapter slug is available
 */
export async function isChapterSlugAvailable(slug: string) {
  try {
    const chapter = await prisma.chapter.findUnique({
      where: { slug },
    });
    
    return !chapter; // If chapter is null, slug is available
  } catch (error) {
    console.error('Error checking chapter slug availability:', error);
    return false;
  }
}
