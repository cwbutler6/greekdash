import { getAllMDXFiles, readMDXFile, getDocumentationPageBySlug } from './mdx-utils';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { generateSlugFromPath } from './mdx-utils';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { DocumentationPage } from '@/types/docs';

/**
 * Content validation utilities for documentation
 */

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  type: 'broken-link' | 'missing-alt-text' | 'invalid-frontmatter' | 'heading-hierarchy' | 'duplicate-id';
  message: string;
  file: string;
  line?: number;
  suggestion?: string;
}

export interface ValidationWarning {
  type: 'long-line' | 'missing-description' | 'outdated-content' | 'unused-image';
  message: string;
  file: string;
  line?: number;
  suggestion?: string;
}

export interface LinkValidationResult {
  url: string;
  isValid: boolean;
  type: 'internal' | 'external' | 'anchor';
  target?: string;
  error?: string;
}

/**
 * Validate all documentation content
 */
export function validateAllContent(): ValidationResult {
  const files = getAllMDXFiles();
  const allErrors: ValidationError[] = [];
  const allWarnings: ValidationWarning[] = [];

  for (const file of files) {
    try {
      const result = validateSingleFile(file);
      allErrors.push(...result.errors);
      allWarnings.push(...result.warnings);
    } catch (error) {
      allErrors.push({
        type: 'invalid-frontmatter',
        message: `Failed to parse file: ${error instanceof Error ? error.message : 'Unknown error'}`,
        file,
      });
    }
  }

  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings,
  };
}

/**
 * Validate a single MDX file
 */
export function validateSingleFile(filePath: string): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  try {
    const { frontmatter, content } = readMDXFile(filePath);

    // Validate frontmatter
    const frontmatterValidation = validateFrontmatter(frontmatter, filePath);
    errors.push(...frontmatterValidation.errors);
    warnings.push(...frontmatterValidation.warnings);

    // Validate content structure
    const contentValidation = validateContentStructure(content, filePath);
    errors.push(...contentValidation.errors);
    warnings.push(...contentValidation.warnings);

    // Validate links
    const linkValidation = validateLinks(content, filePath);
    errors.push(...linkValidation.errors);
    warnings.push(...linkValidation.warnings);

    // Validate images
    const imageValidation = validateImages(content, filePath);
    errors.push(...imageValidation.errors);
    warnings.push(...imageValidation.warnings);

    // Validate heading hierarchy
    const headingValidation = validateHeadingHierarchy(content, filePath);
    errors.push(...headingValidation.errors);
    warnings.push(...headingValidation.warnings);

  } catch (error) {
    errors.push({
      type: 'invalid-frontmatter',
      message: `Error processing file: ${error instanceof Error ? error.message : 'Unknown error'}`,
      file: filePath,
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate frontmatter data
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function validateFrontmatter(frontmatter: Record<string, unknown> | any, filePath: string): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Required fields
  const requiredFields = ['title', 'description', 'section'];
  for (const field of requiredFields) {
    if (!frontmatter[field]) {
      errors.push({
        type: 'invalid-frontmatter',
        message: `Missing required frontmatter field: ${field}`,
        file: filePath,
        suggestion: `Add ${field} to the frontmatter`,
      });
    }
  }

  // Validate field types and formats
  if (frontmatter.title && typeof frontmatter.title !== 'string') {
    errors.push({
      type: 'invalid-frontmatter',
      message: 'Title must be a string',
      file: filePath,
    });
  }

  if (frontmatter.tags && !Array.isArray(frontmatter.tags)) {
    errors.push({
      type: 'invalid-frontmatter',
      message: 'Tags must be an array',
      file: filePath,
    });
  }

  if (frontmatter.planRequired && !['FREE', 'BASIC', 'PRO', 'ENTERPRISE'].includes(frontmatter.planRequired)) {
    errors.push({
      type: 'invalid-frontmatter',
      message: 'Invalid planRequired value. Must be FREE, BASIC, PRO, or ENTERPRISE',
      file: filePath,
    });
  }

  // Validate date format
  if (frontmatter.lastUpdated) {
    const date = new Date(frontmatter.lastUpdated);
    if (isNaN(date.getTime())) {
      errors.push({
        type: 'invalid-frontmatter',
        message: 'Invalid lastUpdated date format',
        file: filePath,
        suggestion: 'Use YYYY-MM-DD format',
      });
    } else {
      // Warn if content is old
      const monthsOld = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24 * 30);
      if (monthsOld > 6) {
        warnings.push({
          type: 'outdated-content',
          message: `Content is ${Math.floor(monthsOld)} months old`,
          file: filePath,
          suggestion: 'Consider updating the content and lastUpdated date',
        });
      }
    }
  }

  // Warn about missing optional but recommended fields
  if (!frontmatter.author) {
    warnings.push({
      type: 'missing-description',
      message: 'Missing author field',
      file: filePath,
      suggestion: 'Add author to frontmatter for better attribution',
    });
  }

  if (!frontmatter.tags || frontmatter.tags.length === 0) {
    warnings.push({
      type: 'missing-description',
      message: 'No tags specified',
      file: filePath,
      suggestion: 'Add relevant tags to improve discoverability',
    });
  }

  return { isValid: errors.length === 0, errors, warnings };
}

/**
 * Validate content structure
 */
function validateContentStructure(content: string, filePath: string): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  const lines = content.split('\n');

  // Check for very long lines
  lines.forEach((line, index) => {
    if (line.length > 120) {
      warnings.push({
        type: 'long-line',
        message: `Line ${index + 1} is very long (${line.length} characters)`,
        file: filePath,
        line: index + 1,
        suggestion: 'Consider breaking long lines for better readability',
      });
    }
  });

  // Check for duplicate IDs in content
  const idMatches = content.match(/id="([^"]+)"/g) || [];
  const ids = idMatches.map(match => match.match(/id="([^"]+)"/)?.[1]).filter(Boolean);
  const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
  
  for (const duplicateId of [...new Set(duplicateIds)]) {
    errors.push({
      type: 'duplicate-id',
      message: `Duplicate ID found: ${duplicateId}`,
      file: filePath,
      suggestion: 'Ensure all IDs are unique within the document',
    });
  }

  return { isValid: errors.length === 0, errors, warnings };
}

/**
 * Validate links in content
 */
function validateLinks(content: string, filePath: string): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Find all markdown links
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  let match;

  while ((match = linkRegex.exec(content)) !== null) {
    const linkText = match[1];
    const linkUrl = match[2];
    const validation = validateSingleLink(linkUrl, filePath);

    if (!validation.isValid) {
      errors.push({
        type: 'broken-link',
        message: `Broken link: ${linkUrl} - ${validation.error}`,
        file: filePath,
        suggestion: validation.error?.includes('not found') ? 'Check if the target page exists' : 'Verify the link URL',
      });
    }

    // Warn about empty link text
    if (!linkText.trim()) {
      warnings.push({
        type: 'missing-description',
        message: `Empty link text for URL: ${linkUrl}`,
        file: filePath,
        suggestion: 'Provide descriptive link text',
      });
    }
  }

  return { isValid: errors.length === 0, errors, warnings };
}

/**
 * Validate a single link
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function validateSingleLink(url: string, _filePath: string): LinkValidationResult {
  // Internal documentation links
  if (url.startsWith('/docs/')) {
    const slug = url.replace('/docs/', '').replace(/^\/+/, '');
    const targetPage = getDocumentationPageBySlug(slug);
    
    return {
      url,
      isValid: !!targetPage,
      type: 'internal',
      target: slug,
      error: targetPage ? undefined : 'Target page not found',
    };
  }

  // Anchor links
  if (url.startsWith('#')) {
    return {
      url,
      isValid: true, // We'll validate these separately
      type: 'anchor',
      target: url.substring(1),
    };
  }

  // External links - basic validation
  if (url.startsWith('http://') || url.startsWith('https://')) {
    try {
      new URL(url);
      return {
        url,
        isValid: true,
        type: 'external',
      };
    } catch {
      return {
        url,
        isValid: false,
        type: 'external',
        error: 'Invalid URL format',
      };
    }
  }

  // Relative links (not supported in our docs structure)
  return {
    url,
    isValid: false,
    type: 'internal',
    error: 'Relative links not supported, use absolute paths starting with /docs/',
  };
}

/**
 * Validate images in content
 */
function validateImages(content: string, filePath: string): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Find all markdown images
  const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
  let match;

  while ((match = imageRegex.exec(content)) !== null) {
    const altText = match[1];
    const imageUrl = match[2];

    // Check for missing alt text
    if (!altText || altText.trim() === '') {
      errors.push({
        type: 'missing-alt-text',
        message: `Image missing alt text: ${imageUrl}`,
        file: filePath,
        suggestion: 'Add descriptive alt text for accessibility',
      });
    }

    // Warn about very short alt text
    if (altText && altText.trim().length < 10) {
      warnings.push({
        type: 'missing-description',
        message: `Very short alt text for image: ${imageUrl}`,
        file: filePath,
        suggestion: 'Consider more descriptive alt text',
      });
    }
  }

  return { isValid: errors.length === 0, errors, warnings };
}

/**
 * Validate heading hierarchy
 */
function validateHeadingHierarchy(content: string, filePath: string): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  const headingRegex = /^(#{1,6})\s+(.+)$/gm;
  const headings: { level: number; text: string; line: number }[] = [];
  // const lines = content.split('\n'); // Currently unused
  
  let match;
  while ((match = headingRegex.exec(content)) !== null) {
    const level = match[1].length;
    const text = match[2].trim();
    const line = content.substring(0, match.index).split('\n').length;
    
    headings.push({ level, text, line });
  }

  // Check heading hierarchy
  let previousLevel = 0;
  for (const heading of headings) {
    if (heading.level > previousLevel + 1) {
      errors.push({
        type: 'heading-hierarchy',
        message: `Heading hierarchy skip: ${heading.text} (h${heading.level} after h${previousLevel})`,
        file: filePath,
        line: heading.line,
        suggestion: `Use h${previousLevel + 1} instead of h${heading.level}`,
      });
    }
    previousLevel = heading.level;
  }

  // Warn about missing h1
  if (headings.length > 0 && headings[0].level !== 1) {
    warnings.push({
      type: 'missing-description',
      message: 'Document should start with an h1 heading',
      file: filePath,
      suggestion: 'Add a main heading (# Title) at the beginning',
    });
  }

  return { isValid: errors.length === 0, errors, warnings };
}

/**
 * Generate validation report
 */
export function generateValidationReport(result: ValidationResult): string {
  const { errors, warnings } = result;
  
  let report = '# Documentation Validation Report\n\n';
  
  if (result.isValid) {
    report += '✅ All validation checks passed!\n\n';
  } else {
    report += `❌ Found ${errors.length} error(s) and ${warnings.length} warning(s)\n\n`;
  }

  if (errors.length > 0) {
    report += '## Errors\n\n';
    for (const error of errors) {
      report += `- **${error.file}**`;
      if (error.line) report += ` (line ${error.line})`;
      report += `: ${error.message}`;
      if (error.suggestion) report += ` - *${error.suggestion}*`;
      report += '\n';
    }
    report += '\n';
  }

  if (warnings.length > 0) {
    report += '## Warnings\n\n';
    for (const warning of warnings) {
      report += `- **${warning.file}**`;
      if (warning.line) report += ` (line ${warning.line})`;
      report += `: ${warning.message}`;
      if (warning.suggestion) report += ` - *${warning.suggestion}*`;
      report += '\n';
    }
    report += '\n';
  }

  return report;
}

/**
 * Validate links across all documentation
 */
export function validateAllLinks(): LinkValidationResult[] {
  const files = getAllMDXFiles();
  const results: LinkValidationResult[] = [];

  for (const file of files) {
    try {
      const { content } = readMDXFile(file);
      const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
      let match;

      while ((match = linkRegex.exec(content)) !== null) {
        const linkUrl = match[2];
        const validation = validateSingleLink(linkUrl, file);
        results.push(validation);
      }
    } catch {
      // Skip files that can't be processed
      continue;
    }
  }

  return results;
}