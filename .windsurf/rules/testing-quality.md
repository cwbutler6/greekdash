---
trigger: always_on
---

<!-- rule: Testing & Quality Assurance -->
<testing_qa>
- Write unit tests for critical functions and components.
- Use integration tests to ensure different parts of the application work together.
- Employ end-to-end (E2E) tests for user flows.
- Use testing libraries compatible with Next.js and React.
- Ensure tests cover edge cases and potential failure points.
- Use Vitest instead of Jest for unit/integration testing
- Install with: `pnpm add -D -w vitest @vitest/ui @testing-library/react jsdom`
- Create a `vitest.config.ts` with alias resolution for `@/`
- Run tests with `pnpm test` mapped to `vitest run`
</testing_qa>