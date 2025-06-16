---
trigger: always_on
---

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
Check	What to Do
✅ Secrets safety	Never expose Stripe keys client-side (STRIPE_SECRET_KEY must stay server-only)
✅ Webhook reliability	Add automated test for /api/stripe/webhook validating known events
✅ Subscription sync	Test that subscription status in Supabase matches Stripe after webhook
✅ Mock Stripe in CI	Use Stripe CLI or test webhooks in CI
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
# ✅ Functional Testing Rules for GreekDash (No UI Tests)

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

## ⚙️ Tools & Conventions
- Use **Jest** with `ts-jest` for TypeScript testing
- Mock:
  - **Prisma Client** via `jest.mock('@prisma/client')`
  - **Stripe SDK** via `jest.mock('stripe')`
  - **NextAuth session & tokens**
- Store test files using `*.test.ts` suffix near the source or in `__tests__/` folders

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

</testing_functional_only>
