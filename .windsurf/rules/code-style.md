---
trigger: always_on
---

<!-- rule: Code Style & Formatting -->
<code_style>
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

</code_style>