import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

export interface SearchIndexPage {
  slug: string;
  title: string;
  description: string;
  content: string;
  section: string;
  subsection?: string;
  tags: string[];
  weight: number;
  url: string;
}

export interface SearchIndex {
  pages: SearchIndexPage[];
  terms: Record<string, string[]>; // term -> page slugs (using Record for JSON serialization)
}

/**
 * Generate search index from MDX files in docs-content directory (server-side only)
 */
export function generateSearchIndex(): SearchIndex {
  const docsContentPath = path.join(process.cwd(), 'docs-content');
  const pages: SearchIndexPage[] = [];
  const terms: Record<string, string[]> = {};

  function processDirectory(dirPath: string, urlPrefix: string = '/docs') {
    if (!fs.existsSync(dirPath)) {
      return;
    }

    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);

      if (entry.isDirectory()) {
        // Recursively process subdirectories
        const subUrlPrefix = `${urlPrefix}/${entry.name}`;
        processDirectory(fullPath, subUrlPrefix);
      } else if (entry.isFile() && entry.name.endsWith('.mdx')) {
        // Process MDX file
        const fileContent = fs.readFileSync(fullPath, 'utf-8');
        const { data: frontmatter, content } = matter(fileContent);

        // Generate slug from file path
        const relativePath = path.relative(docsContentPath, fullPath);
        const slug = relativePath
          .replace(/\.mdx$/, '')
          .replace(/\/index$/, '')
          .replace(/\\/g, '/'); // Normalize path separators

        // Generate URL
        const url = slug === '' ? '/docs' : `/docs/${slug}`;

        // Calculate weight based on section and content length
        let weight = 1;
        if (frontmatter.section === 'getting-started') weight = 3;
        if (frontmatter.section === 'admin-guide') weight = 2;
        if (frontmatter.tags?.includes('important')) weight += 1;

        const page: SearchIndexPage = {
          slug,
          title: frontmatter.title || 'Untitled',
          description: frontmatter.description || '',
          content: content.replace(/[#*`]/g, '').trim(), // Remove markdown formatting
          section: frontmatter.section || 'docs',
          subsection: frontmatter.subsection,
          tags: frontmatter.tags || [],
          weight,
          url,
        };

        pages.push(page);

        // Index terms for search
        const searchableText = `${page.title} ${page.description} ${page.content}`.toLowerCase();
        const words = searchableText
          .split(/\s+/)
          .map(word => word.replace(/[^\w]/g, ''))
          .filter(word => word.length > 2); // Only index words longer than 2 characters

        for (const word of words) {
          if (!terms[word]) {
            terms[word] = [];
          }
          if (!terms[word].includes(slug)) {
            terms[word].push(slug);
          }
        }
      }
    }
  }

  processDirectory(docsContentPath);

  return { pages, terms };
}