#!/usr/bin/env tsx

/**
 * Documentation validation script
 * 
 * Usage:
 *   pnpm tsx scripts/validate-docs.ts
 *   pnpm tsx scripts/validate-docs.ts --file path/to/file.mdx
 *   pnpm tsx scripts/validate-docs.ts --report
 */

import { validateAllContent, validateSingleFile, generateValidationReport } from '../src/lib/content-validation';
import { getAllMDXFiles } from '../src/lib/mdx-utils';

function main() {
  const args = process.argv.slice(2);
  const fileFlag = args.indexOf('--file');
  const reportFlag = args.includes('--report');
  const helpFlag = args.includes('--help') || args.includes('-h');

  if (helpFlag) {
    console.log(`
Documentation Validation Tool

Usage:
  pnpm tsx scripts/validate-docs.ts [options]

Options:
  --file <path>    Validate a specific file
  --report         Generate detailed report
  --help, -h       Show this help message

Examples:
  pnpm tsx scripts/validate-docs.ts
  pnpm tsx scripts/validate-docs.ts --file docs-content/admin-guide/index.mdx
  pnpm tsx scripts/validate-docs.ts --report > validation-report.md
    `);
    return;
  }

  try {
    if (fileFlag !== -1 && args[fileFlag + 1]) {
      // Validate single file
      const filePath = args[fileFlag + 1];
      console.log(`Validating file: ${filePath}`);
      
      const result = validateSingleFile(filePath);
      
      if (result.isValid) {
        console.log('✅ File validation passed!');
      } else {
        console.log(`❌ Found ${result.errors.length} error(s) and ${result.warnings.length} warning(s)`);
        
        if (result.errors.length > 0) {
          console.log('\nErrors:');
          result.errors.forEach(error => {
            console.log(`  - ${error.message}`);
            if (error.suggestion) {
              console.log(`    Suggestion: ${error.suggestion}`);
            }
          });
        }
        
        if (result.warnings.length > 0) {
          console.log('\nWarnings:');
          result.warnings.forEach(warning => {
            console.log(`  - ${warning.message}`);
            if (warning.suggestion) {
              console.log(`    Suggestion: ${warning.suggestion}`);
            }
          });
        }
      }
      
      process.exit(result.isValid ? 0 : 1);
    } else {
      // Validate all content
      console.log('Validating all documentation content...');
      
      const files = getAllMDXFiles();
      console.log(`Found ${files.length} MDX files to validate`);
      
      const result = validateAllContent();
      
      if (reportFlag) {
        // Generate and output detailed report
        const report = generateValidationReport(result);
        console.log(report);
      } else {
        // Summary output
        if (result.isValid) {
          console.log('✅ All validation checks passed!');
        } else {
          console.log(`❌ Found ${result.errors.length} error(s) and ${result.warnings.length} warning(s)`);
          
          // Group errors by file
          const errorsByFile = new Map<string, typeof result.errors>();
          const warningsByFile = new Map<string, typeof result.warnings>();
          
          result.errors.forEach(error => {
            if (!errorsByFile.has(error.file)) {
              errorsByFile.set(error.file, []);
            }
            errorsByFile.get(error.file)!.push(error);
          });
          
          result.warnings.forEach(warning => {
            if (!warningsByFile.has(warning.file)) {
              warningsByFile.set(warning.file, []);
            }
            warningsByFile.get(warning.file)!.push(warning);
          });
          
          if (errorsByFile.size > 0) {
            console.log('\nErrors by file:');
            errorsByFile.forEach((errors, file) => {
              console.log(`\n  ${file}:`);
              errors.forEach(error => {
                console.log(`    - ${error.message}`);
                if (error.suggestion) {
                  console.log(`      Suggestion: ${error.suggestion}`);
                }
              });
            });
          }
          
          if (warningsByFile.size > 0) {
            console.log('\nWarnings by file:');
            warningsByFile.forEach((warnings, file) => {
              console.log(`\n  ${file}:`);
              warnings.forEach(warning => {
                console.log(`    - ${warning.message}`);
                if (warning.suggestion) {
                  console.log(`      Suggestion: ${warning.suggestion}`);
                }
              });
            });
          }
          
          console.log('\nRun with --report flag to generate a detailed markdown report');
        }
      }
      
      process.exit(result.isValid ? 0 : 1);
    }
  } catch (error) {
    console.error('Error during validation:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}