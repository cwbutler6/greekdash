---

## trigger: manual

# 🗂️ Member File Sharing

**Goal**: Allow members of a chapter to upload, view, download, and delete shared files within their chapter portal. Files are isolated per chapter and subject to subscription‑based limits.

## Tech Decisions

* **Supabase Storage** for object storage (private bucket).
* `File` metadata stored in PostgreSQL via Prisma.
* Presigned URLs for secure downloads.
* RBAC: Members & admins can upload/download; only uploader or admins may delete.
* Tier limits: *Free* 100 MB, *Basic* 5 GB, *Pro* 20 GB per chapter.

## Tasks

1. **Database**

   * Add `File` model in `/prisma/schema.prisma`:

     ```prisma
     model File {
       id         Int      @id @default(autoincrement())
       chapterId  Int
       uploaderId Int
       name       String
       path       String   @unique
       mimeType   String
       size       Int
       createdAt  DateTime @default(now())
       chapter    Chapter  @relation(fields: [chapterId], references: [id])
       uploader   User     @relation(fields: [uploaderId], references: [id])
       @@index([chapterId])
     }
     ```
   * Run `pnpm prisma migrate dev`.

2. **Supabase Storage**

   * Create bucket `chapter-files` (private).
   * Store objects under `${chapterId}/` prefix.
   * Helper `/lib/supabase/server/uploadFile.ts`:

     1. Calculate current chapter storage usage.
     2. Enforce tier quota.
     3. Upload buffer with UUID filename.
     4. Insert `File` row transactionally.

3. **API & Server Actions**

   * `app/api/[chapterSlug]/files/route.ts` — `GET` list files (members).
   * `app/api/[chapterSlug]/files/upload/route.ts` — `POST` multipart upload (≤10 MB per file).
   * `app/api/[chapterSlug]/files/[fileId]/download/route.ts` — `GET` signed URL (2 min expiry).
   * `app/api/[chapterSlug]/files/[fileId]/delete/route.ts` — `DELETE` (uploader or admin only).

4. **Client Components**

   * `/components/files/FileUploadButton.tsx` (`use client`): drag‑and‑drop + progress bar.
   * `/components/files/FileList.tsx`: TanStack Query to fetch list & pagination.

5. **Pages**

   * `app/[chapterSlug]/portal/files/page.tsx` (Server component) renders heading plus `<FileUploadButton />` and `<FileList />`.

6. **UI/UX**

   * Use Shadcn `Dialog` for delete confirm and `Progress` for storage meter.

7. **Subscription Guard**

   * In `uploadFile` helper, compare `totalUsed + newSize` against tier quota; return 402 error on overflow.

8. **Testing**

   * Unit: `uploadFile` quota logic.
   * Integration: Upload + list round‑trip with mocked Supabase client.
   * E2E (Playwright): member uploads & admin deletes flow.

## Acceptance Criteria

* Members can upload files ≤10 MB; list updates in real‑time.
* File list is scoped by chapter and paginated (20 per page).
* Only uploader or admin can delete; others receive 403.
* Downloads use signed URLs that expire.
* Uploads respect storage quota; error shown when exceeded.
* Code conforms to project rules (strict TS, ESLint, Prettier, Tailwind, Shadcn).

---

> After merging, run `pnpm dlx shadcn@latest add dialog progress` if these components aren’t installed.
