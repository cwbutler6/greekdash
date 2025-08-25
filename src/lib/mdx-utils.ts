import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { DocumentationPage, TOCItem } from '@/types/docs';

/**
 * Utility functions for processing MDX content
 */

const DOCS_CONTENT_DIR = path.join(process.cwd(), 'docs-content');

/**
 * MDX frontmatter interface
 */
export interface MDXFrontmatter {
  title: string;
  description: string;
  section: string;
  subsection?: string;
  author?: string;
  tags?: string[];
  prerequisites?: string[];
  planRequired?: 'FREE' | 'BASIC' | 'PRO' | 'ENTERPRISE';
  lastUpdated?: string;
  relatedPages?: string[];
}

/**
 * Get all MDX files from the docs-content directory
 */
export function getAllMDXFiles(): string[] {
  const files: string[] = [];
  
  function walkDirectory(dir: string, basePath = ''): void {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relativePath = path.join(basePath, entry.name);
      
      if (entry.isDirectory()) {
        walkDirectory(fullPath, relativePath);
      } else if (entry.isFile() && entry.name.endsWith('.mdx')) {
        files.push(relativePath);
      }
    }
  }
  
  if (fs.existsSync(DOCS_CONTENT_DIR)) {
    walkDirectory(DOCS_CONTENT_DIR);
  }
  
  return files;
}

/**
 * Read and parse an MDX file
 */
export function readMDXFile(filePath: string): { frontmatter: MDXFrontmatter; content: string } {
  const fullPath = path.join(DOCS_CONTENT_DIR, filePath);
  
  if (!fs.existsSync(fullPath)) {
    throw new Error(`MDX file not found: ${filePath}`);
  }
  
  const fileContent = fs.readFileSync(fullPath, 'utf8');
  const { data, content } = matter(fileContent);
  
  // Validate required frontmatter fields
  if (!data.title || !data.description || !data.section) {
    throw new Error(`Invalid frontmatter in ${filePath}: title, description, and section are required`);
  }
  
  return {
    frontmatter: data as MDXFrontmatter,
    content,
  };
}

/**
 * Generate a slug from a file path
 */
export function generateSlugFromPath(filePath: string): string {
  // Remove .mdx extension and convert to URL-friendly slug
  const slug = filePath
    .replace(/\.mdx$/, '')
    .replace(/\/index$/, '') // Remove index from path
    .replace(/\\/g, '/'); // Normalize path separators
  
  return slug;
}

/**
 * Get documentation page data from MDX file
 */
export function getDocumentationPage(filePath: string): DocumentationPage {
  const { frontmatter, content } = readMDXFile(filePath);
  const slug = generateSlugFromPath(filePath);
  
  // Generate table of contents from content
  const tableOfContents = generateTableOfContents(content);
  
  return {
    slug,
    title: frontmatter.title,
    description: frontmatter.description,
    content,
    lastUpdated: frontmatter.lastUpdated ? new Date(frontmatter.lastUpdated) : new Date(),
    author: frontmatter.author,
    tags: frontmatter.tags || [],
    section: frontmatter.section,
    subsection: frontmatter.subsection,
    tableOfContents,
    relatedPages: frontmatter.relatedPages || [],
    prerequisites: frontmatter.prerequisites,
    planRequired: frontmatter.planRequired,
  };
}

/**
 * Get all documentation pages
 */
export function getAllDocumentationPages(): DocumentationPage[] {
  const files = getAllMDXFiles();
  const pages: DocumentationPage[] = [];
  
  for (const file of files) {
    try {
      const page = getDocumentationPage(file);
      pages.push(page);
    } catch (error) {
      console.error(`Error processing ${file}:`, error);
    }
  }
  
  return pages;
}

/**
 * Get documentation page by slug
 */
export function getDocumentationPageBySlug(slug: string): DocumentationPage | null {
  const files = getAllMDXFiles();
  
  for (const file of files) {
    const fileSlug = generateSlugFromPath(file);
    if (fileSlug === slug) {
      try {
        return getDocumentationPage(file);
      } catch (error) {
        console.error(`Error processing ${file}:`, error);
        return null;
      }
    }
  }
  
  return null;
}

/**
 * Generate table of contents from markdown content
 */
export function generateTableOfContents(content: string): TOCItem[] {
  const headingRegex = /^(#{1,6})\s+(.+)$/gm;
  const headings: TOCItem[] = [];
  let match;
  
  while ((match = headingRegex.exec(content)) !== null) {
    const level = match[1].length;
    const title = match[2].trim();
    const id = generateHeadingId(title);
    
    headings.push({
      id,
      title,
      level,
    });
  }
  
  // Build hierarchical structure
  return buildTOCHierarchy(headings);
}

/**
 * Generate a URL-friendly ID from heading text
 */
export function generateHeadingId(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Build hierarchical table of contents structure
 */
function buildTOCHierarchy(headings: TOCItem[]): TOCItem[] {
  const result: TOCItem[] = [];
  const stack: TOCItem[] = [];
  
  for (const heading of headings) {
    // Remove items from stack that are at same or deeper level
    while (stack.length > 0 && stack[stack.length - 1].level >= heading.level) {
      stack.pop();
    }
    
    if (stack.length === 0) {
      // Top level heading
      result.push(heading);
    } else {
      // Child heading
      const parent = stack[stack.length - 1];
      if (!parent.children) {
        parent.children = [];
      }
      parent.children.push(heading);
    }
    
    stack.push(heading);
  }
  
  return result;
}

/**
 * Get pages by section
 */
export function getPagesBySection(section: string): DocumentationPage[] {
  const allPages = getAllDocumentationPages();
  return allPages.filter(page => page.section === section);
}

/**
 * Get pages by tag
 */
export function getPagesByTag(tag: string): DocumentationPage[] {
  const allPages = getAllDocumentationPages();
  return allPages.filter(page => page.tags.includes(tag));
}

/**
 * Search pages by content
 */
export function searchPages(query: string): DocumentationPage[] {
  const allPages = getAllDocumentationPages();
  const searchTerm = query.toLowerCase();
  
  return allPages.filter(page => {
    const searchableContent = [
      page.title,
      page.description,
      page.content,
      ...page.tags,
    ].join(' ').toLowerCase();
    
    return searchableContent.includes(searchTerm);
  });
}

/**
 * Validate MDX content for common issues
 */
export function validateMDXContent(content: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Check for broken internal links
  const internalLinkRegex = /\[([^\]]+)\]\(\/[^)]+\)/g;
  let match;
  
  while ((match = internalLinkRegex.exec(content)) !== null) {
    const linkPath = match[0].match(/\(([^)]+)\)/)?.[1];
    if (linkPath && linkPath.startsWith('/docs/')) {
      // Extract slug from link path
      const slug = linkPath.replace('/docs/', '');
      const linkedPage = getDocumentationPageBySlug(slug);
      
      if (!linkedPage) {
        errors.push(`Broken internal link: ${linkPath}`);
      }
    }
  }
  
  // Check for missing alt text on images
  const imageRegex = /!\[([^\]]*)\]\([^)]+\)/g;
  while ((match = imageRegex.exec(content)) !== null) {
    const altText = match[1];
    if (!altText || altText.trim() === '') {
      errors.push(`Image missing alt text: ${match[0]}`);
    }
  }
  
  // Check for proper heading hierarchy
  const headings = content.match(/^#{1,6}\s+.+$/gm) || [];
  let previousLevel = 0;
  
  for (const heading of headings) {
    const level = heading.match(/^#+/)?.[0].length || 0;
    
    if (level > previousLevel + 1) {
      errors.push(`Heading hierarchy skip detected: ${heading.trim()}`);
    }
    
    previousLevel = level;
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}