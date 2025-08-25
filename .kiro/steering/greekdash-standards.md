# GreekDash Development Standards

## Test-Driven Development
- **Write tests first**: Create unit/integration tests before implementing features
- **Schema validation**: Define Zod schemas alongside database models
- **Test coverage**: Maintain comprehensive test coverage for all business logic
- **Test organization**: Use Vitest for unit/integration, Playwright for E2E

## Next.js Architecture Patterns

### Server Components First
- **Default to Server Components**: Only use `'use client'` when interactive UI is required
- **Data fetching**: Perform all database queries in Server Components
- **Performance**: Leverage server-side rendering for better performance and SEO
- **Hydration**: Minimize client-side JavaScript bundle size

### Client Component Usage
```typescript
// Only mark client when needed for:
// - Event handlers (onClick, onChange)
// - Browser APIs (localStorage, geolocation)
// - State management (useState, useReducer)
// - Real-time features (WebSocket connections)
'use client';
```

## TypeScript Enforcement

### Zero Tolerance Policy
- **Strict mode**: `strict: true` in tsconfig.json
- **No any/unknown**: Explicit types for all variables and functions
- **Type guards**: Use proper type narrowing for runtime checks
- **Generic constraints**: Implement proper bounds for reusable types

### Required Patterns
```typescript
// API route handlers
interface RouteParams {
  chapterSlug: string;
}

// Database operations
interface ChapterScopedQuery {
  chapterId: string;
  // other filters
}
```

## Multi-Tenant Security

### Database Query Requirements
- **Always tenant-scoped**: Every DB query MUST filter by `chapterId`
- **Server-side only**: No direct database access from client components
- **Authorization checks**: Verify user membership before data access
- **Audit logging**: Track all data modifications with user context

### Tenant Isolation Patterns
```typescript
// Required pattern for all queries
const members = await prisma.membership.findMany({
  where: {
    chapterId: chapter.id, // ALWAYS required
    isActive: true
  }
});

// Route protection
async function getChapterWithAuth(chapterSlug: string, userId: string) {
  // Verify user has access to this chapter
  const membership = await prisma.membership.findFirst({
    where: { chapterId, userId, isActive: true }
  });
  if (!membership) throw new Error('Unauthorized');
}
```

## API Security Standards

### Input Validation
- **Zod validation**: All API inputs must be validated with Zod schemas
- **Fail fast**: Reject requests immediately on parse errors
- **Never trust client**: Server-side validation is the only source of truth
- **Sanitize inputs**: Clean and normalize all user inputs

### Validation Patterns
```typescript
// API route validation
const createMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(['MEMBER', 'ADMIN']),
  chapterSlug: z.string().min(1)
});

export async function POST(request: Request) {
  const body = await request.json();
  const validatedData = createMemberSchema.parse(body); // Throws on error
  // Continue with validated data
}
```
##
 Payment Security (Stripe)

### Server-Side Only
- **No client secrets**: Stripe secret keys never in client bundles
- **Webhook verification**: Always verify Stripe webhook signatures
- **Secure endpoints**: Payment processing only in API routes
- **Audit trail**: Log all payment events for compliance

### Stripe Integration Patterns
```typescript
// Webhook signature verification (required)
const sig = headers.get('stripe-signature');
const event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);

// Client-side: Only publishable key
const stripe = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
```

## Authentication & Authorization

### Session Management
- **Secure cookies**: HTTPOnly, Secure, SameSite cookies
- **Short sessions**: Implement reasonable session timeouts
- **Server-side checks**: Verify auth on every protected route
- **Role-based access**: Check permissions for chapter-specific actions

### Route Protection Patterns
```typescript
// Chapter route protection
async function requireChapterAccess(
  chapterSlug: string, 
  userId: string, 
  requiredRole?: MembershipRole
) {
  const membership = await prisma.membership.findFirst({
    where: {
      user: { id: userId },
      chapter: { slug: chapterSlug },
      isActive: true,
      ...(requiredRole && { role: requiredRole })
    }
  });
  
  if (!membership) {
    throw new Error('Access denied');
  }
  
  return membership;
}
```

## Progressive Loading & Performance

### Loading States
- **Skeleton components**: Use loading skeletons for all async content
- **Suspense boundaries**: Implement React Suspense for data fetching
- **Progressive enhancement**: Show content incrementally as it loads
- **Error boundaries**: Graceful fallbacks for failed requests

### Next.js Performance Patterns
```typescript
// Loading UI with Suspense
export default function Page() {
  return (
    <Suspense fallback={<MemberListSkeleton />}>
      <MemberList />
    </Suspense>
  );
}

// Streaming with loading.tsx
// app/[chapterSlug]/portal/members/loading.tsx
export default function Loading() {
  return <MemberListSkeleton />;
}

// Error boundaries with error.tsx
// app/[chapterSlug]/portal/members/error.tsx
'use client';
export default function Error({ error, reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorFallback error={error} onRetry={reset} />;
}
```

### Skeleton Component Standards
- **Consistent sizing**: Match actual content dimensions
- **Semantic structure**: Reflect real component hierarchy
- **Accessibility**: Include proper ARIA labels for screen readers
- **Animation**: Subtle pulse/shimmer effects for visual feedback

### Data Fetching Optimization
- **Parallel requests**: Use Promise.all for independent data
- **Streaming**: Leverage Next.js streaming for large datasets
- **Caching**: Implement proper cache strategies for static data
- **Prefetching**: Use Next.js Link prefetching strategically

## Development Workflow

### Code Quality Gates
- **Pre-commit**: TypeScript compilation must pass
- **Testing**: All tests must pass before merge
- **Linting**: ESLint rules enforced
- **Security**: No hardcoded secrets or credentials
- **Performance**: Loading states implemented for all async operations

### Required Checks
- Multi-tenant data isolation verified
- API endpoints properly validated
- Authentication flows tested
- Payment integrations secured
- Progressive loading patterns implemented
- Skeleton components for all data-dependent UI