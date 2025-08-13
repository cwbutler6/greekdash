
# GreekDash — Beta Readiness (Admins • Members • Public)
**Path:** `.trae/tasks/beta-readiness-checklist.md`  
**Goal:** One-button flow for smoke checks (lint, typecheck, build, DB seed, E2E) + a clean, ordered script of manual verifications per role.

---

## 0) Preflight — Environment & Secrets
- [ ] `.env` present (no secrets committed)
- [ ] `NEXTAUTH_URL`
- [ ] `DATABASE_URL`
- [ ] `STRIPE_SECRET_KEY`
- [ ] `STRIPE_WEBHOOK_SECRET`
- [ ] `NEXTAUTH_SECRET`
- [ ] EMAIL provider keys (Resend/SendGrid) configured
- [ ] (Optional) SENTRY/LOGGING DSN set

> Tip: Run `printenv` in your deploy environment and verify values match **staging** or **prod** as intended.

---

## 1) Automated Smoke Checks (Run in order)

### 1.1 Install & Clean
```bash
pnpm -w install
pnpm -w clean || true
```

### 1.2 Lint & Typecheck
```bash
pnpm -w lint
pnpm -w tsc --noEmit
```

### 1.3 Build (ensures Next.js routes & configs compile)
```bash
pnpm -w build
```

### 1.4 Database — migrate & seed (ephemeral seed for E2E)
> **WARNING:** Use this on **staging**/**local** only. For prod, run `prisma migrate deploy` and skip seeding unless intended.
```bash
pnpm -w prisma migrate deploy
pnpm -w prisma db seed
```

### 1.5 Start Test Server (another terminal)
```bash
pnpm -w start
# or: pnpm -w dev
```

### 1.6 E2E Smoke (core flows only)
```bash
pnpm -w test:e2e
```

**Automated PASS gate (all must pass):**
- [ ] Lint clean
- [ ] Types clean
- [ ] Build clean
- [ ] DB migrated & seeded
- [ ] E2E smoke green

If any fail → **STOP** and fix before manual checks.

---

## 2) Manual Verification — Chapter Admins (Go/No-Go)

### 2.1 End-to-End Admin Flow
- [ ] Create chapter → set logo/colors → (optionally) set custom domain (Pro)
- [ ] Regenerate join code (old code invalid)
- [ ] Invite by email (role selection: MEMBER/ADMIN) → receive link
- [ ] Approve/deny a pending member (audit note recorded)
- [ ] Create event → publish → RSVP list shows correctly
- [ ] Create dues item → member pays → admin sees ledger entry + export CSV
- [ ] Downgrade Pro→Basic when over 30 members prompts resolution and gates features

### 2.2 Guardrails
- [ ] Admin-only routes (`/[chapter]/admin/*`) blocked for non-admins
- [ ] All queries scoped by `chapterId`/`slug` (tenant isolation spot-check: switch session, try URL guessing)
- [ ] Storage quotas enforced: Basic 3 GB, Pro 20 GB
- [ ] Webhooks idempotent: replay last Stripe events → no duplicate records
- [ ] Observability: a forced error appears in error monitor with chapter context

---

## 3) Manual Verification — Members

### 3.1 Join & Access
- [ ] Accept **invite link** → lands in correct chapter with correct role
- [ ] **Join code** path: invalid code is blocked; valid code creates **PENDING_MEMBER**
- [ ] Pending member is redirected to `/[chapter]/pending` until approved
- [ ] After approval, portal loads with member access

### 3.2 Payments & Messaging
- [ ] Pay dues in Stripe Checkout → in-app receipt + email receipt
- [ ] View payment history
- [ ] Update profile (name, email prefs, phone for SMS)
- [ ] Marketing email has unsubscribe; transactional emails have no unsubscribe

### 3.3 Safety
- [ ] Member cannot access other chapters (try deep links, APIs)
- [ ] Role changes reflect within 1 request (revalidation/session)

---

## 4) Manual Verification — Public Users & SEO

### 4.1 Public Pages
- [ ] Public chapter page shows **only** public info + public events
- [ ] Contact/Interest form submits → throttled (honeypot/recaptcha) → admin receives

### 4.2 SEO & Performance
- [ ] Unique `<title>`, `<meta name="description">`, OG tags
- [ ] Sitemap & robots.txt served
- [ ] LCP under ~2.5s on chapter public page (on a 4G throttled run)
- [ ] Images: width/height set; lazy-loaded galleries

### 4.3 Asset Safety
- [ ] Private files are not accessible via guessable URLs
- [ ] Signed URLs expire and cannot be reused after expiry

---

## 5) Pricing & Plan Gates (Server-Enforced)

Plans configured:
- **Basic** — $20/mo or $200/yr; up to **30 members**, 3 GB storage; email support
- **Pro** — $59/mo or $590/yr; unlimited members; custom domain; SMS/CRM/Analytics; priority support; 20 GB storage
- **Enterprise** — Custom; white-label, API, SLA, bulk onboarding

- [ ] Stripe products/prices exist and map to plan flags
- [ ] Server-side plan gating verified (features unavailable in Basic)
- [ ] Downgrade/Cancel flows revoke features gracefully (no data loss)

---

## 6) Observability & Ops

- [ ] Error monitoring captures stack + chapter context
- [ ] Structured logs with request IDs
- [ ] Basic uptime checks or status monitor enabled
- [ ] Backup policy documented (DB snapshots) + **rollback plan** (tagged release, restore steps)

---

## 7) Exit Criteria (Beta → Wider Beta)

- [ ] ≥ 3 chapter admins complete full setup with no direct help
- [ ] ≤ 1 critical bug per chapter after first week
- [ ] Time‑to‑first‑value (admin) < 10 minutes
- [ ] Stripe revenue events visible to admin in ≤ 1 minute
- [ ] Member self‑serve help answers top 10 questions

If **all pass** → approve wider beta cohort.

---

## 8) Quick Commands (copy/paste)
```bash
# Full local clean
git reset --hard && git clean -fdx
pnpm -w install
pnpm -w lint && pnpm -w tsc --noEmit && pnpm -w build

# DB (staging/local only)
pnpm -w prisma migrate deploy
pnpm -w prisma db seed

# E2E smoke
pnpm -w test:e2e

# Start app
pnpm -w start   # or: pnpm -w dev
```

---

## 9) Notes for Trae
- Keep all **server-side plan checks** intact; do not “simplify” by moving gates to the client.
- When generating routes/components, default to **Server Components**; mark interactivity with `use client` minimally.
- Always add `chapterId`/`slug` filters to DB queries (multi-tenant isolation).

---

### ✍️ Issue Log (fill as you go)
- [ ] 
- [ ] 
- [ ] 
