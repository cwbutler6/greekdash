---
trigger: always_on
---

<!-- rule: Project Context -->
GreekDash is a multi-tenant SaaS application for fraternity/sorority chapter management.
Built with Next.js App Router, TypeScript, Tailwind CSS, Shadcn UI, Prisma (PostgreSQL via Supabase), NextAuth.js, and Stripe.
Each user belongs to a chapter, identified by a unique 'chapterSlug'.
Features are gated based on subscription tiers: Free, Basic, and Pro.
