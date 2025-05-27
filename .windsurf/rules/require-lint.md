---
trigger: always_on
---

---
trigger: always_on
---

<!-- rule: Lint Code After Generation -->
<require_lint>
- After generating or modifying any code files, always run the linter using the project's configured lint script (e.g., `pnpm lint`, `npm run lint`, or `next lint`).
- Do not complete the task until lint errors are either fixed or reported in the task output.
- If auto-fixable, run the linter with the `--fix` flag.
- Use this standard command unless overridden: `pnpm lint --fix`
</require_lint>
