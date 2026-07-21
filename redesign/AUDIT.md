# edwebmedia.com — Live Site Audit

**Target:** https://edwebmedia.com (Edweb Media flagship — the live deployed site)
**Date:** 2026-07-18
**Scope:** Console, responsive (375 / 768 / 1280), links, contact form, accessibility, performance, SEO
**Type:** Report only. No fixes applied. Any fix is implemented in `redesign/new-home.html` + `redesign/new-styles.css` per the hard rule, never in the live `index.html` / `styles.css`.
**Method:** Live inspection via in-app browser (chrome-devtools MCP was blocked by a locked profile; Browser pane used instead). Evidence is measured DOM data, network responses and computed styles — no estimated metrics. Full-page screenshots timed out (continuous `.industries-track` marquee keeps the renderer busy); layout was verified with scrollWidth / getBoundingClientRect measurements instead, which is stricter for overflow than a screenshot.

---

## Overall verdict

The site is **healthy and well-built**. Zero console errors, no broken assets, no horizontal overflow at any tested width, a genuinely strong accessibility baseline, and lean code (styles.css 17 KB, script.js 7 KB). Every finding below is **optimization / polish**, not breakage. Nothing here is a launch-blocker.

The single theme running through the SEO findings: the site **half-migrated to clean URLs**. Vercel `cleanUrls: true` is redirecting every `.html` request to its extensionless form, but internal links, `<link rel=canonical>` tags and `sitemap.xml` were never updated to match. That one root cause produces three separate findings below.

---

## Top 5 issues by business impact

### 1. Project screenshots ship as unoptimized PNG (~745 KB for 4 images) — Performance — Effort: S
- **Evidence:** `assets/slider/1.png` 133 KB, `2.png` 192 KB, `7.png` 260 KB, `9.png` 160 KB — **745 KB combined**, and they are the four heaviest resources on the page by a wide margin. Everything else is tiny (styles.css 17 KB, script.js 7 KB, logos ~17 KB each). Served as `image/png`.
- **Impact:** These dominate page weight, especially on mobile data. They are `loading="lazy"` (good) so they do not block first paint, but they are the whole performance story of this page.
- **Fix:** Re-export the four project screenshots as WebP (or AVIF) — typically 70–85% smaller at the same visual quality for UI screenshots. Add `width`/`height` attributes to reserve space (CLS). Consider a `<picture>` with WebP + PNG fallback.

### 2. URL canonicalization is inconsistent (clean vs .html) — SEO — Effort: S–M
- **Evidence:** `cleanUrls: true` redirects `.html` → clean (confirmed: every `*.html` fetch returns an opaque redirect; the clean URL returns 200). But:
  - Served clean pages declare **`.html` canonicals**: `/projects` → `canonical https://edwebmedia.com/projects.html`; `/about-us` → `about-us.html`; all four project pages → `projects/<name>.html`. (`/packages` is the exception — it correctly canonicals to `/packages`.)
  - Homepage internal links all point to `.html` (`about-us.html`, `projects.html`, `packages.html`, `contact.html`), so every nav click and every crawler hop goes through a 308 redirect.
- **Impact:** Mixed canonical signals (the URL that is served says its canonical is a URL that redirects back to it), plus a redirect hop on every internal navigation. Dilutes SEO and adds latency.
- **Fix:** Standardize on clean URLs everywhere — internal `href`s, `<link rel=canonical>`, and the sitemap (see #3). Pick clean URLs as the one true form.

### 3. sitemap.xml is stale and incomplete — SEO — Effort: S
- **Evidence:** `sitemap.xml` (200, referenced correctly from `robots.txt`) lists **6 URLs, all with `.html`** (home, about-us.html, packages.html, contact.html, privacy-policy.html, terms-conditions.html). It **omits `/projects` and all four case-study pages** (`/projects/spiralguard`, `/tee-to-trail`, `/lekkerdoos`, `/muire`) — all of which return 200 and are linked in the nav and homepage.
- **Impact:** The portfolio pages — the strongest proof-of-work and a real SEO asset — are not advertised to search engines. Listed URLs also point at redirecting `.html` forms.
- **Fix:** Regenerate the sitemap with clean URLs and add `/projects` + the four project pages. Keep it in sync going forward.

### 4. Homepage heading hierarchy skips a level — Accessibility / SEO — Effort: S
- **Evidence:** Document order is `H1` ("Websites … to grow your business") → **`H3` "Built To Perform"** → `H4` "Why clients choose us" → `H4` "What you get" → then the first `H2` "Performing on every device". The hero/stats block uses H3+H4 before any H2 exists.
- **Impact:** Screen-reader users navigating by heading hit a broken outline; search engines read a malformed document structure. (Single H1 per page is correct — good.)
- **Fix:** Demote/relevel so headings never skip: the first sub-section heading after H1 should be H2, with H3/H4 nested beneath it.

### 5. Mobile tap targets below minimum — Accessibility (mobile) — Effort: S
- **Evidence (measured at 375px):** Footer links (Home, About, Projects, Pricing, Contact, Terms, Privacy, phone, email) render **21 px tall** — under the WCAG 2.2 AA **2.5.8 Target Size (Minimum)** of 24 px. Also under the 44 px comfort target: hamburger toggle 40×32, dark-mode toggle 48×26, review arrows 36×36, plan tabs (Overview/Included/Why Us) ~37 px, header "Get In Touch" 38 px.
- **Impact:** Cramped, error-prone tapping on phones — worst on the stacked footer link list. The footer links specifically fail the AA minimum; the rest pass AA (24 px) but miss the 44 px best-practice size.
- **Fix:** Increase footer link line-height / vertical padding to ≥24 px hit area (aim 44); pad the hamburger and toggles to 44×44.

---

## Full findings by lens

### Console
- Home and Contact pages: **zero console messages** (no errors, no warnings). Clean.

### Responsive (375 / 768 / 1280)
- **No horizontal overflow at any width** (docScrollWidth == viewport at 375, 753, 1265). The `.industries-track` marquee is 5648 px wide but correctly contained in an `overflow:hidden` track — does not push the page.
- Nav **collapses to a hamburger** at 375 and 768; full nav at 1280. Works.
- H1 is **fluid**: 68 px @ 1280 → 41.6 px @ 375. Good responsive type.
- `prefers-reduced-motion` **is respected** in CSS — important given the marquee and scroll animations.
- No layout breakage observed at any width.

### Links
- All internal pages resolve **200** on their clean URLs: `/about-us`, `/projects`, `/packages`, `/contact`, `/terms-conditions`, `/privacy-policy`, and all four `/projects/*` case studies. **No 404s, no broken assets.**
- All `.html` internal links **308-redirect** to clean (see Top 5 #2).
- External links present and correct: Google reviews search, Facebook, Instagram, `wa.me/27846204583`, `tel:`, `mailto:`.
- Page titles are **unique and well-formed** across pages (50–60 chars each), e.g. "Our Projects | Edweb Media — Cape Town Web Design Agency", "Helix SpiralGuard — Industrial Product Website | Edweb Media".

### Contact form (`/contact`)
- Two forms, both submit via JS (no `action`/`method` — canonical serverless pattern), both console-clean:
  - **`#msf-form`** (multi-step enquiry): honeypot present (`company`, label "Company (leave this field empty)", `autocomplete="off"`) ✓ matches the recent spam-protection work. Required fields: package, message, first-name, last-name, email. All fields labelled; name/email/phone carry correct `autocomplete` tokens. `novalidate` + JS validation.
  - **`#booking-form`** (call booking: name, email, phone, note): all fields labelled and validated, **but no honeypot field** (unlike the enquiry form). See minor findings.
- Live submission was **not** performed — it would send a real email to info@edwebmedia.com. Structure, validation, labelling and spam-hardening were inspected instead.

### Accessibility (strong baseline)
- Skip link present ("Skip to content" → `#main`) ✓
- Exactly one H1 per page ✓ (hierarchy skip noted in Top 5 #4)
- Icon-only controls carry `aria-label` (hamburger "Toggle menu", dark toggle, review prev/next, all three social links e.g. "Edweb Media on Facebook") ✓
- Material Symbols icons are **`aria-hidden="true"` (25/25 on contact page)** — ligature text is not announced ✓
- Form fields labelled + `autocomplete` on personal fields ✓
- Contrast passes: muted body text `#b0b0b0` on `#2b2b2b` = **6.53:1**, body/label text = **13.37:1** (AA needs 4.5:1) ✓
- `:focus-visible` rules exist in the stylesheet ✓ (note: not exhaustively keyboard-walked in this pass — recommend a manual Tab-through as a final confirmation)
- `lang="en"`, viewport meta present ✓

### Performance
- **Lean codebase:** styles.css 17.2 KB, script.js 7.3 KB, logos ~17 KB. Nothing bloated.
- **One real lever:** the 745 KB of project PNGs (Top 5 #1).
- **Fonts:** two separate Google Fonts requests (Manrope + Material Symbols), both `<link rel=stylesheet>` in head (render-blocking). `preconnect` to fonts.googleapis + fonts.gstatic is present ✓. Manrope uses `display=swap` ✓; Material Symbols uses `display=block` (icons invisible until the font loads — brief FOIT on slow links). Minor.
- Lab timing numbers from Navigation Timing were unreliable here (served from cache, transferSize ~300) so are not reported; asset weights are the trustworthy signal. A cold-load Lighthouse run is recommended when a clean profile is available.

### SEO
- Title (71 chars), meta description present, canonical present, JSON-LD `ProfessionalService`, OG + `twitter:card=summary_large_image`, `robots.txt` (allows all, references sitemap) — **all the fundamentals are in place.**
- Canonical/sitemap `.html` inconsistency (Top 5 #2, #3).
- **Meta description is 181 chars** — over the ~155–160 Google renders; will truncate. Trim.
- **`og:image` is the logo** (`edweb-logo-dark.png`, 500×250, 17 KB), not a 1200×630 share card. Shared links (WhatsApp/Facebook/LinkedIn) will render a small, letterboxed preview despite `summary_large_image`. Create a proper share card.

---

## Minor findings (polish)

| # | Lens | Finding | Fix | Effort |
|---|------|---------|-----|--------|
| M1 | Spam | `#booking-form` has no honeypot (the enquiry form does) | Add the same `company` honeypot to the booking form (rate-limiting on the shared endpoint helps but is not per-form) | S |
| M2 | SEO/Social | `og:image` is the logo, not a 1200×630 share card | Design a branded share card | S |
| M3 | SEO | Meta description 181 chars (truncates) | Trim to ≤160 | S |
| M4 | Perf | Two Google Fonts requests | Combine into one `family=…&family=…` request | S |
| M5 | Perf/UX | Material Symbols `display=block` (icon FOIT) | Switch to `display=swap`, or subset/self-host the used glyphs | S |
| M6 | Content | Title tag uses an em-dash ("—") | Cosmetic only vs. Edgar's no-em-dash preference for body copy; titles are arguably fine — flagging for consistency | S |

---

## What's working well (keep)

- Zero console errors sitewide.
- No horizontal overflow at 375 / 768 / 1280; clean hamburger collapse; fluid H1 type.
- Strong a11y: skip link, one H1/page, aria-labels on icon controls, icons aria-hidden, labelled + autocompleted form fields, 6.5:1+ contrast, focus-visible rules, reduced-motion support.
- Honeypot + rate-limit spam protection on the main enquiry form.
- Complete SEO fundamentals: unique per-page titles/descriptions, canonical, JSON-LD, OG/Twitter, robots.txt → sitemap.
- Lean, dependency-free code; all pages 200, no broken assets.

---

## Recommended fix order (all via `new-home.html` workflow)

1. Convert 4 project PNGs → WebP/AVIF + add width/height (biggest win, lowest effort).
2. Standardize on clean URLs: internal links, canonicals, sitemap — in one pass.
3. Regenerate sitemap with clean URLs + add /projects and 4 project pages.
4. Fix homepage heading levels (no skipped levels).
5. Mobile tap targets: footer links ≥24 px hit area, toggles/hamburger 44×44.
6. Minor batch: booking-form honeypot, share-card og:image, trim meta description, combine font requests.

> Every fix lands in `redesign/new-home.html` + `redesign/new-styles.css` and is verified there. `redesign/index.html` and `redesign/styles.css` are **not** edited until Edgar promotes the new build. Note that some fixes (sitemap.xml, robots, og:image asset, canonical tags on the other pages, the two contact forms) live outside `new-home.html` — those are separate live files and should be flagged for a coordinated deploy rather than folded into the homepage draft.
