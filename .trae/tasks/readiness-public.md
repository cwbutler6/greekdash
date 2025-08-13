# GreekDash Readiness — Public Users & SEO

## Go / No‑Go
- [ ] Public chapter page loads without login; never exposes private data.
- [ ] Contact/recruit form submits to chapter admins with spam controls.

## Must‑Have Pages
- [ ] Chapter public profile: name, about, socials, upcoming **public** events only
- [ ] Donations (optional): public donation flow with Stripe
- [ ] Contact/Interest form: throttled, honeypot/recaptcha, success state
- [ ] 404/unauthorized pages styled and helpful

## Guardrails
- [ ] No member-only content in SSR props or API responses
- [ ] Rate limits on contact and search endpoints
- [ ] Image/file URLs are signed or public-scoped correctly

## SEO
- [ ] Unique title/description/OG tags per chapter
- [ ] Sitemap, robots.txt; canonical URLs
- [ ] Fast LCP; image dimensions set; lazy-load galleries
