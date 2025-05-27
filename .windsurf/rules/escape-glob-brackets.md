---
trigger: always_on
---

---
trigger: always_on
---

<!-- rule: Escape Brackets in Shell Paths -->
<escape_shell_glob>
- Always wrap paths that include square brackets (`[`, `]`) in single quotes when generating shell commands.
- Alternatively, escape brackets with backslashes in shell paths: `\[`, `\]`.
- This applies to all CLI commands that create, move, or access files or folders.
- Example:
  - ❌ `mkdir app/[chapterSlug]`
  - ✅ `mkdir app/\[chapterSlug\]`
</escape_shell_glob>