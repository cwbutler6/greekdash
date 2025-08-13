# GreekDash Readiness — Chapter Admins

## Go / No‑Go
- [ ] End‑to‑end: create chapter → configure branding/domain → invite member → approve pending → collect dues → export finance CSV.
- [ ] Admin-only routes locked (`/[chapter]/admin/*`) via server checks.
- [ ] Stripe webhooks idempotent + observable (logs, alerts).

## Must‑Have Flows
- [ ] Create & edit chapter profile (logo, colors, contact, join code regen)
- [ ] Invite by email (role: MEMBER/ADMIN) with one-time token
- [ ] Pending queue: approve/deny with audit entry
- [ ] Dues & donations: view ledger, refunds, payouts status
- [ ] Member management: search, filter, deactivate
- [ ] Events: create, RSVP visibility, CSV attendees
- [ ] Announcements/email: send to segment; rate-limited; unsubscribe on non-transactional

## Guardrails
- [ ] Tenant isolation on every query (chapterId/slug filter)
- [ ] Plan gates enforced server-side (Basic cap 30 members; Pro unlimited)
- [ ] Storage quotas (3 GB Basic, 20 GB Pro) with usage meter
- [ ] Access log for sensitive actions

## UX/Docs
- [ ] First‑login setup checklist (logo, join code, first invite, dues)
- [ ] 3 short Looms: Setup, Invites/Approvals, Dues/Payouts
- [ ] Admin quickstart doc linked in app
