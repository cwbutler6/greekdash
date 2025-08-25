# Code Standards & Principles

## TypeScript Standards

### Strict Configuration

- **Strict Mode**: Always enabled in `tsconfig.json`
- **No Implicit Any**: All variables must have explicit types
- **Strict Null Checks**: Handle null/undefined explicitly
- **No Unused Locals**: Remove unused variables and imports

### Type Safety Rules

- Use `const assertions` for immutable data
- Prefer `interface` over `type` for object shapes
- Use generic constraints for reusable components
- Implement proper error boundaries with typed errors
- Use discriminated unions for state management

### Required Type Patterns

```typescript
// API responses
interface ApiResponse<T> {
  data: T;
  error?: string;
  success: boolean;
}

// Form validation with Zod
const schema = z.object({
  email: z.string().email(),
  name: z.string().min(1)
});
type FormData = z.infer<typeof schema>;

// Component props
interface ComponentProps {
  children: React.ReactNode;
  className?: string;
}
```

## DRY Principles

### Code Reusability

- Extract common logic into custom hooks
- Create reusable utility functions in `/lib/utils`
- Use shared validation schemas across client/server
- Implement consistent error handling patterns

### Shared Components Strategy

- Build atomic UI components in `/components/ui`
- Create feature-specific components that compose UI atoms
- Use compound component patterns for complex interactions
- Implement consistent prop interfaces across similar components

### Data Layer Patterns

- Single source of truth for database schemas (Prisma)
- Shared type definitions generated from Prisma models
- Consistent API response formats across all endpoints
- Reusable database query functions in service layers

### Configuration Management

- Centralized environment variable validation
- Shared constants in dedicated files
- Consistent error messages and status codes
- Reusable middleware for common operations

## Enforcement Rules

### Pre-commit Checks

- TypeScript compilation must pass without errors
- ESLint rules enforced for type safety
- No `any` types allowed without explicit justification
- All imports must be used

### Code Review Standards

- Functions should have single responsibility
- Complex logic must be extracted into testable units
- Type definitions should be co-located with usage
- Shared utilities must have comprehensive tests

### Refactoring Guidelines

- Identify duplicate code patterns during reviews
- Extract common functionality into shared modules
- Maintain backward compatibility when updating shared code
- Document breaking changes in shared utilities
