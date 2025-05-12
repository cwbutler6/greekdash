---
trigger: always_on
---

<!-- rule: Authentication & Authorization -->
<auth>
- Use NextAuth.js for authentication with multi-tenant support by including 'chapterSlug' context.
- Ensure all data queries or operations include the current chapter context to enforce tenant isolation.
- Implement auth guards and security: ensure that pages requiring authentication use Next.js middleware or runtime checks.
- Double-check user's permissions/subscription when performing sensitive operations.
- Never trust client-side checks alone; always verify on the server as well.
</auth>
