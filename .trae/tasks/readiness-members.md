# GreekDash Readiness — Chapter Members

## Go / No‑Go
- [ ] End‑to‑end: accept invite OR join via code → pending → approval → portal access → pay dues → receive confirmation email.
- [ ] Pending users cannot access portal; redirected to `/[chapter]/pending`.

## Must‑Have Flows
- [ ] Accept invite link (one-time) → auto-join correct chapter & role
- [ ] Join via code: invalid code blocked; rate-limited
- [ ] Profile: update name, email preferences, phone (for SMS)
- [ ] Events: view, RSVP; see only chapter events
- [ ] Dues: pay with Stripe Checkout; see receipts & history
- [ ] Messaging: receive announcements; unsubscribe honored for marketing

## Guardrails
- [ ] Can’t access other chapters’ content (server enforced)
- [ ] Role changes reflected immediately (session revalidation or on next request)
- [ ] Data export/download limited to own records

## UX/Docs
- [ ] Clear pending screen w/ next steps
- [ ] Receipt emails + in‑app receipts
- [ ] Member FAQ: payments, refunds, leaving chapter
