---
trigger: manual
---

<!-- rule: Fix TS and Prisma type issues -->
<fix_ts_prisma>
- Go through every file in `/src/app` and `/src/lib` and replace manually defined types with those from `@lib/db`.
- Add missing Zod schemas to `/src/lib/zodSchemas.ts` and infer their types with `z.infer<>`.
- Make sure API route handlers and form submissions use `POST/GET` types with `Request` and `Response` objects.
- For App Router params, await `params: Promise<{ slug: string }>` inside the function body.
- Remove all `any` and `unknown` types from generated code.
</fix_ts_prisma>
