---
trigger: always_on
---

<!-- rule: Project Structure & Architecture -->
<project_structure>
- Follow Next.js App Router conventions: place route components and pages under '/app'.
- Store shared UI components in '/components/ui'; use Shadcn UI patterns.
- Place utility functions, helpers, and custom hooks in '/lib'.
- Keep schema and database-related files in '/prisma'.
- Manage environment variables via a '.env' file; use 'NEXT_PUBLIC_' prefix for client-side variables.
- Use kebab-case for directory names (e.g., 'components/auth-wizard').
- Favor named exports for components.
</project_structure>
