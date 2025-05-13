# Scaffold Admin Dashboard Pages

## Overview

This task defines the admin dashboard functionality for GreekDash. All pages are tenant-scoped under `/[chapterSlug]/admin/*` and must be restricted to users with the `ADMIN` role in the current chapter.

Use:
- Next.js 15 App Router
- Prisma for DB access
- shadcn/ui for components
- React Hook Form + Zod for forms
- Tailwind for layout and styling

All routes should verify the user is authenticated, belongs to the chapter, and has the `ADMIN` role.

---

## Pages to Scaffold

### 1. Invite Members Page

**Route:** `/[chapterSlug]/admin/invites`

**Features:**
- Form to invite user by email and role (defaults to `member`)
- Uses server action to create `Invite` entry with token and chapterId
- Outputs invite link (emailing can be added later)
- Lists pending invites (optional)

**UI:**
- Email input
- Role select (admin, member)
- Submit button using shadcn/ui Button

**Server logic:**
- Validate with Zod
- Generate token (uuid)
- Save to `Invite` table

---

### 2. Pending Members Page

**Route:** `/[chapterSlug]/admin/pending`

**Features:**
- Fetch all `Membership` records in this chapter where `role = PENDING_MEMBER`
- Render in table with approve and deny buttons
- Approve action: update role to `MEMBER`
- Deny action: delete membership

**UI:**
- Table with Name, Email, Actions
- Approve and Deny buttons

**Server logic:**
- Two server actions: `approveMember`, `denyMember`
- Handle access control (must be admin of chapter)

---

### 3. Members List Page

**Route:** `/[chapterSlug]/admin/members`

**Features:**
- List all current members in chapter
- Show name, email, role
- Allow updating role (member ↔ admin)
- Allow removing member

**UI:**
- Table with search bar (optional)
- Role dropdown using shadcn/ui Select
- Remove button

**Server logic:**
- `updateMemberRole`, `removeMember`

---

### 4. Chapter Settings Page

**Route:** `/[chapterSlug]/admin/settings`

**Features:**
- Edit chapter name
- Upload logo (optional placeholder)
- Set primary color (color picker)
- Regenerate join code

**UI:**
- Input for name
- Color input or picker
- "Regenerate join code" button
- Submit with shadcn/ui Button

**Server logic:**
- `updateChapterSettings` action
- `regenerateJoinCode` action

---

### 5. Billing Page

**Route:** `/[chapterSlug]/admin/billing`

**Features:**
- View subscription plan
- Button to open Stripe billing portal

**UI:**
- Current plan display
- "Manage Billing" button

**Server logic:**
- `getBillingInfo(chapterId)`
- `createStripePortalLink(chapterId)`

---

## Constraints

- All routes must validate the current user is an admin of the chapter from the slug
- Use server actions where possible instead of API routes
- Prisma should scope all queries to `chapterId` using the `chapterSlug` param
- Protect all pages with `auth` + `role = ADMIN` checks

---

## Models (Prisma)

Use the following models:

```prisma
model User {
  id           Int           @id @default(autoincrement())
  email        String        @unique
  name         String?
  memberships  Membership[]
}

model Chapter {
  id           Int           @id @default(autoincrement())
  name         String
  slug         String        @unique
  joinCode     String
  memberships  Membership[]
  invites      Invite[]
}

model Membership {
  user       User     @relation(fields: [userId], references: [id])
  userId     Int
  chapter    Chapter  @relation(fields: [chapterId], references: [id])
  chapterId  Int
  role       Role
  @@id([userId, chapterId])
}

model Invite {
  id         Int       @id @default(autoincrement())
  email      String
  token      String    @unique
  chapter    Chapter   @relation(fields: [chapterId], references: [id])
  chapterId  Int
  role       Role
  accepted   Boolean   @default(false)
  createdAt  DateTime  @default(now())
}

enum Role {
  ADMIN
  MEMBER
  PENDING_MEMBER
}
```

---

## Output

- Pages under `/[chapterSlug]/admin/*`
- Server actions for each form
- UI using shadcn/ui components
- Tailwind styling and layout
- Prisma database queries scoped by `chapterId`
