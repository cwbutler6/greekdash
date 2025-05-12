---
trigger: always_on
---

<!-- rule: Backend & Database -->
<backend_db>
- Employ Prisma for database operations on PostgreSQL via Supabase.
- Maintain the schema in '/prisma/schema.prisma' and run migrations accordingly.
- Use Prisma Client for type-safe DB queries; ensure models include multi-tenant fields.
- Handle Stripe webhooks for subscription events to keep user status in sync.
- Use Stripe's API/SDK on the server side only; never expose secrets.
</backend_db>
