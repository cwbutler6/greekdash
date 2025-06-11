# GreekDash

GreekDash is a multi-tenant SaaS platform designed for fraternity and sorority chapters. It provides a customizable dashboard, member portal, lineage tracking, and subscription-based features using modern web technologies.

## 🚀 Tech Stack

- **Frontend:** Next.js (App Router), Tailwind CSS, shadcn/ui
- **Backend:** Next.js API Routes, Prisma ORM
- **Database:** PostgreSQL (via Supabase or direct)
- **Authentication:** NextAuth.js (multi-tenant, chapter-based)
- **Billing:** Stripe Subscriptions (Free, Basic, Pro)

## 🧩 Features

- Multi-tenant support (each chapter has a unique slug and branded experience)
- Admin dashboard to manage users, content, and billing
- Public-facing site for recruitment and events
- Member portal with searchable directory and lineage tree
- Stripe-powered billing with plan upgrades and billing portal
- Responsive, accessible UI powered by shadcn/ui

## 🗂️ Project Structure

```
/app                  # Next.js App Router structure
  /[chapterSlug]      # Dynamic route per chapter
    /admin            # Chapter admin dashboard
    /portal           # Member-only portal
  /api                # API routes
/components/ui        # shadcn/ui components
/lib                  # Utility functions and shared logic
/prisma               # Prisma schema and migration files
/styles               # Global styles
```

## 📦 Scripts

| Script         | Description                      |
|----------------|----------------------------------|
| `dev`          | Run the development server       |
| `build`        | Build the app for production     |
| `start`        | Start the production server      |
| `lint`         | Run ESLint                       |
| `test`         | Run tests                        |
| `prisma`       | Prisma CLI tools                 |

## ⚙️ Environment Variables

- `DATABASE_URL` – Supabase/Postgres connection string
- `NEXTAUTH_URL` – Site URL for NextAuth
- `NEXTAUTH_SECRET` – Secret key for signing sessions
- `STRIPE_SECRET_KEY` – Stripe API key
- `STRIPE_WEBHOOK_SECRET` – Stripe webhook secret
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` – Stripe publishable key
- `WALLET_ENCRYPTION_KEY` – 32-byte key for encrypting blockchain wallet private keys

## 🧪 Testing

- Use your preferred framework (e.g., Jest, Vitest)
- Coverage recommended for all features
- E2E testing setup TBD

## 🧠 AI Rules

This project includes a `.windsurf/rules/` folder defining strict code style, folder conventions, auth patterns, and feature guides for Windsurf Editor users.

## 📄 License

MIT

---

© 2025 GreekDash
