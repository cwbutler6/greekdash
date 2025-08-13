# GreekDash Beta Readiness Matrix (Admins • Members • Public)

| Area | Admins | Members | Public |
|---|---|---|---|
| E2E smoke flow | ✅ create→invite→approve→pay→export | ✅ invite/join→approve→pay→receipt | ✅ chapter page→contact form |
| Access control | ✅ admin routes only | ✅ chapter-scoped portal | ✅ no private data |
| Billing | ✅ webhooks, dunning, refunds | ✅ checkout, receipts | ➖ (donations optional) |
| Storage | ✅ quotas + meter | ✅ personal uploads only | ✅ only public assets |
| Messaging | ✅ announcements, rate limit | ✅ receive; unsubscribe | ✅ contact throttled |
| Observability | ✅ errors, logs, alerts | ✅ errors logged | ✅ uptime checks |
| Performance | ✅ p95 < 400ms APIs | ✅ LCP under 2.5s | ✅ LCP under 2.5s |
| Docs/UX | ✅ quickstart + Looms | ✅ FAQ + receipts | ✅ clear 404/unauth |
| Exit criteria | 3+ admins self-setup | 80% pay without support | Bounce < 40% |

**Exit Gate**: invite 1–3 chapters → run for 2 weeks → collect issues → fix → broaden beta.
