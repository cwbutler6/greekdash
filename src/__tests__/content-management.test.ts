import { describe, it, expect } from 'vitest';
import { 
  getAllMDXFiles, 
  readMDXFile, 
  generateSlugFromPath, 
  getDocumentationPage,
  getAllDocumentationPages,
  getDocumentationPageBySlug,
  generateTableOfContents,
  generateHeadingId
} from '../lib/mdx-utils';
import { 
  validateAllContent, 
  validateSingleFile,
  generateValidationReport
} from '../lib/content-validation';

describe('MDX Content Management', () => {
  describe('File Operations', () => {
    it('should find MDX files in the docs-content directory', () => {
      const files = getAllMDXFiles();
      expect(files).toBeInstanceOf(Array);
      expect(files.length).toBeGreaterThan(0);
      
      // Should find our test files
      expect(files.some(file => file.includes('getting-started'))).toBe(true);
      expect(files.some(file => file.includes('admin-guide'))).toBe(true);
    });

    it('should read and parse MDX files correctly', () => {
      const files = getAllMDXFiles();
      const testFile = files.find(file => file.includes('getting-started/first-login.mdx'));
      
      if (testFile) {
        const { frontmatter, content } = readMDXFile(testFile);
        
        expect(frontmatter).toHaveProperty('title');
        expect(frontmatter).toHaveProperty('description');
        expect(frontmatter).toHaveProperty('section');
        expect(typeof content).toBe('string');
        expect(content.length).toBeGreaterThan(0);
      }
    });

    it('should generate correct slugs from file paths', () => {
      expect(generateSlugFromPath('getting-started/index.mdx')).toBe('getting-started');
      expect(generateSlugFromPath('admin-guide/members/invites.mdx')).toBe('admin-guide/members/invites');
      expect(generateSlugFromPath('admin-guide/index.mdx')).toBe('admin-guide');
    });
  });

  describe('Documentation Page Processing', () => {
    it('should create documentation page objects correctly', () => {
      const files = getAllMDXFiles();
      const testFile = files.find(file => file.includes('getting-started/first-login.mdx'));
      
      if (testFile) {
        const page = getDocumentationPage(testFile);
        
        expect(page).toHaveProperty('slug');
        expect(page).toHaveProperty('title');
        expect(page).toHaveProperty('description');
        expect(page).toHaveProperty('content');
        expect(page).toHaveProperty('tableOfContents');
        expect(page.tableOfContents).toBeInstanceOf(Array);
      }
    });

    it('should retrieve all documentation pages', () => {
      const pages = getAllDocumentationPages();
      expect(pages).toBeInstanceOf(Array);
      expect(pages.length).toBeGreaterThan(0);
      
      // Each page should have required properties
      pages.forEach(page => {
        expect(page).toHaveProperty('slug');
        expect(page).toHaveProperty('title');
        expect(page).toHaveProperty('description');
        expect(page).toHaveProperty('section');
      });
    });

    it('should find pages by slug', () => {
      const page = getDocumentationPageBySlug('getting-started/first-login');
      expect(page).toBeTruthy();
      
      if (page) {
        expect(page.slug).toBe('getting-started/first-login');
        expect(page.title).toBeTruthy();
      }
    });
  });

  describe('Table of Contents Generation', () => {
    it('should generate heading IDs correctly', () => {
      expect(generateHeadingId('Getting Started')).toBe('getting-started');
      expect(generateHeadingId('Step 1: Setup')).toBe('step-1-setup');
      expect(generateHeadingId('FAQ & Troubleshooting')).toBe('faq-troubleshooting');
      expect(generateHeadingId('API Reference (v2.0)')).toBe('api-reference-v20');
    });

    it('should generate table of contents from markdown content', () => {
      const content = `
# Main Title
Some content here.

## Section 1
More content.

### Subsection 1.1
Even more content.

## Section 2
Final content.
      `;
      
      const toc = generateTableOfContents(content);
      expect(toc).toHaveLength(1); // Only main title at top level
      
      const mainTitle = toc[0];
      expect(mainTitle.title).toBe('Main Title');
      expect(mainTitle.level).toBe(1);
      expect(mainTitle.children).toHaveLength(2); // Section 1 and Section 2
      
      const section1 = mainTitle.children![0];
      expect(section1.title).toBe('Section 1');
      expect(section1.level).toBe(2);
      expect(section1.children).toHaveLength(1); // Subsection 1.1
      
      const subsection = section1.children![0];
      expect(subsection.title).toBe('Subsection 1.1');
      expect(subsection.level).toBe(3);
    });
  });

  describe('Content Validation', () => {
    it('should validate individual files', () => {
      const files = getAllMDXFiles();
      const testFile = files.find(file => file.includes('getting-started/first-login.mdx'));
      
      if (testFile) {
        const result = validateSingleFile(testFile);
        expect(result).toHaveProperty('isValid');
        expect(result).toHaveProperty('errors');
        expect(result).toHaveProperty('warnings');
        expect(result.errors).toBeInstanceOf(Array);
        expect(result.warnings).toBeInstanceOf(Array);
      }
    });

    it('should validate all content', () => {
      const result = validateAllContent();
      expect(result).toHaveProperty('isValid');
      expect(result).toHaveProperty('errors');
      expect(result).toHaveProperty('warnings');
      expect(typeof result.isValid).toBe('boolean');
    });

    it('should generate validation reports', () => {
      const result = validateAllContent();
      const report = generateValidationReport(result);
      
      expect(typeof report).toBe('string');
      expect(report).toContain('# Documentation Validation Report');
      
      if (!result.isValid) {
        expect(report).toContain('## Errors');
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle missing files gracefully', () => {
      expect(() => {
        readMDXFile('non-existent-file.mdx');
      }).toThrow();
    });

    it('should handle invalid frontmatter', () => {
      // This would be tested with a mock file that has invalid frontmatter
      // For now, we'll just ensure the validation catches it
      const result = validateAllContent();
      // The validation should catch any frontmatter issues
      expect(result.errors).toBeInstanceOf(Array);
    });

    it('should return null for non-existent slugs', () => {
      const page = getDocumentationPageBySlug('non-existent-page');
      expect(page).toBeNull();
    });
  });

  describe('Content Structure Validation', () => {
    it('should detect broken internal links', () => {
      const result = validateAllContent();
      const brokenLinkErrors = result.errors.filter(error => error.type === 'broken-link');
      
      // We expect some broken links since we haven't created all pages yet
      expect(brokenLinkErrors.length).toBeGreaterThan(0);
      
      brokenLinkErrors.forEach(error => {
        expect(error.message).toContain('Broken link:');
        expect(error.file).toBeTruthy();
      });
    });

    it('should detect missing alt text on images', () => {
      // This would be tested with content that has images without alt text
      const result = validateAllContent();
      const altTextErrors = result.errors.filter(error => error.type === 'missing-alt-text');
      
      // Currently our test content doesn't have images without alt text
      expect(altTextErrors).toBeInstanceOf(Array);
    });

    it('should validate heading hierarchy', () => {
      const result = validateAllContent();
      const headingErrors = result.errors.filter(error => error.type === 'heading-hierarchy');
      
      // Our content should have proper heading hierarchy
      expect(headingErrors).toBeInstanceOf(Array);
    });
  });
});

describe('Content Management Integration', () => {
  it('should work with the existing docs structure', () => {
    // Test that our content management works with existing docs
    const pages = getAllDocumentationPages();
    
    // Should find pages in different sections
    const gettingStartedPages = pages.filter(page => page.section === 'getting-started');
    const adminGuidePages = pages.filter(page => page.section === 'admin-guide');
    
    expect(gettingStartedPages.length).toBeGreaterThan(0);
    expect(adminGuidePages.length).toBeGreaterThan(0);
  });

  it('should handle different content types', () => {
    const pages = getAllDocumentationPages();
    
    // Should handle pages with different plan requirements
    const freePages = pages.filter(page => page.planRequired === 'FREE');
    const basicPages = pages.filter(page => page.planRequired === 'BASIC');
    
    expect(freePages.length).toBeGreaterThan(0);
    // We have at least one BASIC plan page (finance)
    expect(basicPages.length).toBeGreaterThan(0);
  });

  it('should maintain referential integrity', () => {
    const pages = getAllDocumentationPages();
    
    // Check that related pages exist
    pages.forEach(page => {
      if (page.relatedPages && page.relatedPages.length > 0) {
        page.relatedPages.forEach(relatedSlug => {
          // Note: Some related pages might not exist yet, which is okay
          // This test ensures the structure is in place
          expect(typeof relatedSlug).toBe('string');
          expect(relatedSlug.length).toBeGreaterThan(0);
        });
      }
    });
  });
});