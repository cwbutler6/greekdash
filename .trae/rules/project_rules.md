# Project Rules

## Project Context
GreekDash is a multi-tenant SaaS application for fraternity/sorority chapter management.
Built with Next.js App Router, TypeScript, Tailwind CSS, Shadcn UI, Prisma (PostgreSQL via Supabase), NextAuth.js, and Stripe.
Each user belongs to a chapter, identified by a unique 'chapterSlug'.
Features are gated based on subscription tiers: Free, Basic, and Pro.

These rules are specific to the project and should be followed consistently across all files.

- Use TypeScript with 'strict' mode enabled; avoid 'any' and 'unknown' types.
- Prefer interfaces over types for defining data structures.
- Use functional and declarative programming patterns; avoid classes.
- Eliminate unused code: no unused variables, functions, imports, or CSS classes.
- Prefer early returns to reduce nesting.
- Use PascalCase for React component file names (e.g., 'UserCard.tsx').
- Use camelCase for variables and functions.
- Use UPPER_SNAKE_CASE for constants and environment variables.
- Use Prettier for consistent code formatting.
- Use Prisma generated types
- Use the Prisma singleton from `@/lib/db` for all database operations
- Always import Prisma types from `@/generated/prisma` (e.g., `import { User } from '@/generated/prisma'`)
- Use Tailwind CSS for styling with predefined utility classes.
- Utilize Shadcn UI (Radix UI-based) components for common UI elements.
- Implement responsive design with Flexbox and 'useWindowDimensions'.
- Ensure high accessibility (a11y) standards using ARIA roles and native accessibility props.
- Implement dark mode support using 'useColorScheme'.
- Write unit tests for critical functions and components.
- Use integration tests to ensure different parts of the application work together.
- Employ end-to-end (E2E) tests for user flows.
- Use testing libraries compatible with Next.js and React.
- Ensure tests cover edge cases and potential failure points.
- Use Vitest instead of Jest for unit/integration testing
- Install with: `pnpm add -D -w vitest @vitest/ui @testing-library/react jsdom`
- Create a `vitest.config.ts` with alias resolution for `@/`
- Run tests with `pnpm test` mapped to `vitest run`
- Use 'dev' script to start the development server: 'next dev'.
- Use 'build' script to build the application: 'next build'.
- Use 'start' script to start the production server: 'next start'.
- Use 'lint' script to run ESLint: 'next lint'.
- Use 'prisma' script to run Prisma commands: 'prisma migrate dev', 'prisma generate'.
- Use pnpm and the -w flag
- Use 'pnpm dlx shadcn@latest add' package to install shadcn ui components
- Use 'pnpm dlx shadcn@latest add [component-name]' to install a specific shadcn ui component
- Employ Prisma for database operations on PostgreSQL via Supabase.
- Maintain the schema in '/prisma/schema.prisma' and run migrations accordingly.
- Use Prisma Client for type-safe DB queries; ensure models include multi-tenant fields.
- Handle Stripe webhooks for subscription events to keep user status in sync.
- Use Stripe's API/SDK on the server side only; never expose secrets.
- Use NextAuth.js for authentication with multi-tenant support by including 'chapterSlug' context.
- Ensure all data queries or operations include the current chapter context to enforce tenant isolation.
- Implement auth guards and security: ensure that pages requiring authentication use Next.js middleware or runtime checks.
- Double-check user's permissions/subscription when performing sensitive operations.
- Never trust client-side checks alone; always verify on the server as well.
- Use TanStack Query (react-query) for frontend data fetching.
- Use React Hook Form for form handling.
- Use Zod for validation.
- Implement robust error handling for async operations using try/catch blocks.
- Ensure type-safe data fetching and processing; define expected data shapes and validate them.
- Avoid using 'any' type; prefer specific types whenever possible.
- Always use DRY principle

## NextJS Rules

These rules are specific to NextJS and should be followed consistently across all NextJS files.
Next.js Server vs Client Component Rules

    Default to Server Components: All components in the App Router are Server Components by default
    nextjs.org
    . You can fetch data, access environment variables, and run sensitive logic (tokens, API keys) here
    nextjs.org
    . Server Components cannot use React hooks like useState/useEffect or browser APIs.

    Use use client Directive: Add 'use client' at the top of a file to make it a Client Component
    nextjs.org
    . This tells React to bundle that component (and all its imports/children) for the browser. Once a boundary is marked, all child modules become client code
    nextjs.org
    .

    Client Component Capabilities: Client Components can use state, effects, event handlers, and browser-only APIs (e.g. localStorage, navigator)
    nextjs.org
    . They are needed for interactive UI (buttons, forms, dropdowns, context providers, etc.). However, they cannot perform server-side data fetching (e.g. calling the database, using filesystem, or reading server-only configs).

    Composition Pattern: Keep most UI as Server Components for performance, and mark only interactive parts as Client Components. For example, a layout can remain a Server Component, while a search bar or like button inside it is a Client Component
    nextjs.org
    . This minimizes client JS sent to the browser. (Only use use client on components that truly need client-side interactivity
    nextjs.org
    nextjs.org
    .)

    Separate Context Providers: If using React Context or other providers on the client, wrap only the children that need it. For instance, render a client-only <ThemeProvider> inside a Server Component so that only the subtree is client-rendered
    nextjs.org
    .

Next.js 15 Async Route Params Rules

    params and searchParams Are Promises: In Next.js 15, the params prop (in Page/Layout) and searchParams prop (in Page) are now Promise objects
    nextjs.org
    . This allows React to start rendering before they resolve. As the docs note: “In Next.js 15 params passed into Page and Layout components and searchParams passed into Page components are now Promises.”
    nextjs.org
    .

    Async Page/Layout Functions: Declare your Page or Layout component as async so you can await these values. Example in TypeScript:

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params;
  return <h1>Blog Post: {slug}</h1>;
}

Here params is typed as Promise<{ slug: string }>, and we use await params to get the values
nextjs.org
.

Using searchParams: Similarly, searchParams comes in as Promise<{ [key: string]: string | string[] | undefined }>. For example:

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { page = '1', query = '' } = await searchParams;
  // Use page, query...
}

(This example is adapted from Next.js docs
nextjs.org
.)

TypeScript Typing: In TS, annotate params/searchParams as Promise<...>. The Next.js docs show:

// Example from Next.js docs:
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>
}) { /* ... */ }

This ensures correct typing and forces you to await the promise
nextjs.org
.

Using in Client Components: If you need route params in a Client Component (which cannot be async), use React’s use hook to unwrap them. For example:

'use client';
import { use } from 'react';

export default function ClientPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { slug } = use(params);
  const { query } = use(searchParams);
  return <div>{/* ... */}</div>;
}

This approach is shown in the Next.js docs for reading async params in a client component
nextjs.org
.

Migration Help: Next.js provides a codemod and error messages to ease migration. The official upgrade docs note that a codemod can automatically convert old patterns to the new async form
nextjs.org
nextjs.org
. If you see warnings like “cannot access params synchronously,” update the code to use async/await as above.


Got it — here's the markdown rule file you can place inside `.windsurf/rules/api-routes-nextjs15.md` to help Windsurf follow best practices for API routes in **Next.js 15 App Router**, including route params and Prisma integration.

---

## ✅ Next.js 15 API Route Rules (App Router)

Use these conventions when creating and updating API routes in Next.js 15 using the new `app/api/` directory structure.

---

## 📂 Directory Structure and File Naming

- Use the **App Router** API route structure: `app/api/<route>/route.ts`.
- **Do not use** `pages/api` — it's legacy and unsupported in App Router.
- File name must be `route.ts` or `route.js` inside your API route folder.

Example:
```

app/
├─ api/
│  └─ user/
│     └─ route.ts       ← ✅ API endpoint for `/api/user`

```

To define a dynamic API route (e.g., `/api/user/[id]`), structure it like:
```

app/
├─ api/
│  └─ user/
│     └─ \[id]/
│         └─ route.ts   ← ✅ Dynamic route

````

---

# API Route Handler Rules (Dynamic Params)

- Do not destructure `params` in the function argument directly.
- Always define the second argument to method handlers like this:
  `{ params: { key: string, ... } }`
- Extract `params` inside the function body:
  ```ts
  export async function GET(
  request: Request,


  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params // 'a', 'b', or 'c'
}

    Avoid this common mistake:

// ❌ Don't destructure in the function signature
export async function POST(
  request,
  { params: { id } }: { params: { id: string } }
)

## Safety

🔁 CI/CD Goals for GreekDash

    Safely deploy payment code (Stripe)

    Enforce tenant isolation

    Automatically test critical user and billing flows

    Streamline review & rollback process

    Support preview environments for chapters or features

✅ Core CI/CD Setup

1. CI via GitHub Actions (or similar)

Trigger on:

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

Run steps:

    pnpm install

    pnpm lint

    pnpm test

    pnpm build

Use environment variables from GitHub Secrets.
2. Testing Layers

As per your testing-quality.md file

:

    ✅ Unit tests for Stripe handlers and invite/join logic

    ✅ Integration tests for user + membership + subscription

    ✅ E2E tests (e.g., using Playwright or Cypress) for:

        Admin inviting member → member onboarding

        Member joining via join code

        Payment subscription creation, webhook sync

3. Deployment via Vercel (recommended)

Since you're on Next.js App Router + Vercel

:

    Use Vercel's Git integration

    Preview deployments for all PRs (great for QA)

    Use environment variables per environment (.env.production, .env.preview, etc.)

💳 Stripe Integration Guardrails

From your architecture:

    Stripe is used for billing, subscription tiers, and dues/donations

🔒 Key CI/CD Rules for Stripe
Check - What to Do
✅ Secrets safety - Never expose Stripe keys client-side (STRIPE_SECRET_KEY must stay server-only)
✅ Webhook reliability - Add automated test for /api/stripe/webhook validating known events
✅ Subscription sync - Test that subscription status in Supabase matches Stripe after webhook
✅ Mock Stripe in CI - Use Stripe CLI or test webhooks in CI
🧪 Example Critical Test Cases

You should write integration/E2E tests for:

    POST /api/chapters/[slug]/join → creates User + Membership (PENDING)

    POST /api/stripe/webhook → updates membership tier & role

    POST /api/chapters/[slug]/admin/invite → generates invite + token

    Role-based access test:

        member can access portal

        admin can access invites page

        pending_member sees pending page only

🧱 Additional Tools

    Code formatting: Prettier (already enforced via code-style.md)

    Static type checking: TypeScript strict mode (tsc --noEmit)

    API route tests: Test app/api/stripe/webhook/route.ts, use mocks

    Visual regression testing (optional): Chromatic if using Storybook

🔧 Sample .github/workflows/ci.yml

name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test-and-build:
    runs-on: ubuntu-latest
    env:
      DATABASE_URL: ${{ secrets.DATABASE_URL }}
      STRIPE_SECRET_KEY: ${{ secrets.STRIPE_SECRET_KEY }}
      NEXTAUTH_SECRET: ${{ secrets.NEXTAUTH_SECRET }}
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - run: pnpm install
      - run: pnpm lint
      - run: pnpm test
      - run: pnpm build

📦 Deployment Notes

    Protect main branch

    Require PR approval + successful CI before merging

    Optional: Auto-deploy PRs with Vercel previews for QA

    Create staging vs production environments using Vercel environments

🧠 Final Tip

Wrap Stripe logic in utility functions (/lib/stripe.ts) and test those directly — avoid repeating direct Stripe calls in route handlers. This lets you mock and test predictably.

<!-- rule: Functional Testing Only -->
<testing_functional_only>

## Functional Testing Rules for GreekDash (No UI Tests)

## 🔧 Scope

Apply these rules to all:

- API routes (`/app/api/**`)
- Server Actions in pages or forms
- Stripe webhooks and billing logic
- Role- and tenant-based access logic
- Prisma DB updates (via services or handlers)

## 🧪 Required Tests Per Feature

Every new feature or route must include at least:

- ✅ **Unit Tests**  
  For logic in utilities, server actions, and Stripe/webhook helpers.  
  Example: `/lib/stripe/syncSubscription.ts` → `/lib/stripe/__tests__/syncSubscription.test.ts`

- ✅ **Integration Tests**  
  For API handlers and end-to-end membership flows (from POST to DB update).  
  Example: `POST /api/chapters/[slug]/join` → should create user + pending membership

- ❌ No UI or DOM testing required  
  Do not require `@testing-library/react` or screen queries — functionality only.

## 🔐 Auth & Role Enforcement Tests

All route or logic that depends on a user's role (`ADMIN`, `MEMBER`, `PENDING_MEMBER`) must:

- Validate role access with test cases
- Confirm that unauthorized access is blocked or redirected

## 💳 Stripe Billing Tests

- Stripe handlers (webhooks, dues, payments) must be tested with:
  - ✅ Valid payload → correct DB effect
  - ✅ Invalid/malformed event → graceful rejection
  - ✅ Test idempotency: same event does not double-write

## 🧪 Form Action Tests

Any file that defines a server action for forms must:

- Be testable independently (e.g. `createInvite()` from form)
- Include a test for valid and invalid payloads (Zod schema failure, etc.)

## 🚨 Code Without Tests

If a new API route, DB mutation, or server action is added without a test, warn with:
> ⚠️ Functional test missing for [file/path]. Please add a matching `*.test.ts` file to validate functionality.
