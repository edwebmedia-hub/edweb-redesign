# Navigator Vietnam — Retrofit Health Check

**Date:** 2026-07-18
**Scope:** Retrofit audit of an existing site (built before the Website OS). Health pass, not a rebuild.
**Site:** 28 static pages — 6 top-level (home, about, tours, contact, privacy, terms), 16 destination pages, 6 tour pages. Shared `styles.css` (1774 lines) + guarded `script.js` IIFE. Contact form → Vercel serverless (`api/send-mail.js`), legacy `send-mail.php` fallback.

## Verdict
**Healthy.** Structurally sound, accessible, SEO-clean at the page level, zero broken links, zero console errors, no responsive overflow. No rebuild warranted. Two genuine defects fixed this pass; remaining items are optimization/hygiene enhancements (not defects) and a short list of design opinions left untouched.

---

## Method & tool limitation (honest note)
- **Static analysis** across all 28 pages (links, images, meta, headings, forms, a11y patterns) — reliable, full coverage.
- **Live browser** measurement on the home page (the most complex: carousels, grids, dark sections) — clean at 1280 and 375.
- **Limitation:** both browser-automation surfaces were contended by concurrent sessions this run — the Chrome DevTools profile was locked by another process, and the in-app browser pane returned blank documents after the first load (screenshots timed out). So the **4-width visual-QA sweep + WebKit spot-check could not be completed**. Responsive robustness for the other 27 pages is inferred from the shared mobile-first stylesheet (single source of truth) + the measured-clean home page + global `body{overflow-x:hidden}` and `img{max-width:100%}`. Recommend a full `/visual-qa` pass when a browser surface is free.

---

## Fixed this pass (genuine defects)
| # | Defect | Evidence | Fix | Files |
|---|--------|----------|-----|-------|
| 1 | Gallery tiles were dead links: `<a href="#" onclick="return false;">` — keyboard-focusable controls that do nothing, `href="#"` jump anti-pattern, misleading affordance. No lightbox JS exists anywhere. | 4 per destination page × 16 pages = 64 anchors | Converted to semantic `<figure class="gallery-card">`. Visually identical (global `*{margin:0}` neutralises figure's UA margin; hover-zoom retained). Removes the a11y defect. | 16 destination pages |
| 2 | Copy typo: lowercase proper noun "saigon soul" in the home region slider. | `index.html:178` | "saigon" → "Saigon". | index.html |

> If a lightbox on the gallery is desired, that's a feature add (needs JS + markup) — flagged, not built, per health-pass scope.

---

## SEO / social hygiene — DONE this pass (approved scope)
Objective technical hygiene (not defects, not design opinions). Approved and applied.

| Area | Action | Verification |
|------|--------|--------------|
| Social sharing | Added Open Graph + Twitter Card meta to **all 28 pages** — per-page title/description (reused existing) and **per-page hero as `og:image`** (destinations/tours use their own hero, not a sitewide default). | `og:title`/`twitter:card` present on 28/28; all 20 unique `og:image` files confirmed on disk. |
| SEO indexing | Generated **`sitemap.xml`** (28 URLs, prioritised) + **`robots.txt`** (with sitemap pointer). Domain `navigator-vietnam.com`. | files written, 28 URLs. |
| SEO canonical | Added `rel="canonical"` to **all 28 pages** (`.html` form; index → `/`). No `vercel.json`/cleanUrls present, so `.html` matches the actual served + internally-linked URLs. | canonical on 28/28; exactly one `</head>` per file. |

## Performance — investigated, NO change (honest result)
Image optimisation was approved, attempted, and **reverted — it isn't worthwhile here.**
- **In-place JPEG re-compression (q82):** only 8 of 131 files shrank; **+1% total.** The source JPEGs are already aggressively compressed.
- **WebP @ q80:** 33.5 MB → 31.2 MB, **only 7% smaller** — because the JPEGs are already low-weight-per-pixel. Not worth a 131-image `<picture>` refactor across 28 files (high markup risk, and unverifiable blind this session) for 7%.
- Dimensions are already display-appropriate (~1600–2000 px); lazy-loading + `fetchpriority` + preconnect are already correct.
- **Verdict:** the 34 MB total is spread across 28 pages (no page loads all of it) and is largely irreducible without visible quality loss. A real further win needs a **responsive-image (`srcset`/`sizes`) + CDN** strategy, done with visual QA — a separate, deliberate job, not a blind health-pass edit. Assets left **pristine** (`git` clean).

---

## Design opinions — listed only, NOT actioned (per "no redesigning without asking")
- **Eyebrow / kicker labels** used throughout ("Destinations", "Signature Journey", "Tours", "Why Travel With Us"…). Conflicts with your stated global preference against eyebrow labels. Shipped design — flagging, not changing.
- **Numbered section markers (01 / 02 / 03)** on the Travel Activities accordion (flagged by impeccable too). Editorial-scaffold pattern. Intentional as shipped.
- Full visual polish (spacing/type/colour mood) not assessable this pass without the visual-QA sweep.

---

## Full lens results (evidence-based)
| Lens | Result | Evidence |
|------|--------|----------|
| Console | ✅ Clean | Home: zero errors. `script.js` is a fully-guarded IIFE — every feature early-returns if its elements are absent, so sub-pages can't throw. |
| Network / assets | ✅ All resolve | Home: all 200. Disk check: 0 missing images across all 28 pages. (Two first-paint `ERR_CONNECTION_RESET` on home self-recovered to 200 on retry — Python `http.server` concurrency under a 68-image burst, not a site defect; non-issue on Vercel.) |
| Links | ✅ Zero broken | Scripted check of every internal `.html` href → target exists. mailto/tel/social all present. |
| Responsive | ✅ No overflow | Home measured: `scrollWidth==clientWidth` at 1280 **and** 375, zero offending elements, nav-toggle 42×42, WhatsApp FAB 58×58, desktop CTA correctly hidden. CSS is mobile-first (every grid single-column at base), `body{overflow-x:hidden}`, `img{max-width:100%}`. (Full 4-width sweep pending — see limitation.) |
| Forms | ✅ Exemplary | Labels+`for`, required/optional markers, `role="alert"` field errors, `aria-live` status, honeypot (`company` off-screen), validation, focus-managed success state. Live submit is Vercel-only (can't exercise on static preview). |
| Accessibility | ✅ Strong (1 defect, fixed) | Skip-link ×28, `:focus-visible` ×10, aria-labels on icon controls, `prefers-reduced-motion` handled, clean heading order (no skips), alt on 100% of images. Only defect was the gallery anchors (fixed). |
| SEO (page) | ✅ Strong | 28 unique descriptive `<title>`, 28 unique meta descriptions, exactly 1 `<h1>` per page, `TravelAgency` JSON-LD on home. Gaps: canonical/OG/sitemap (above). |
| Performance | ⚠️ Heavy imagery | Correct patterns (lazy, fetchpriority, preconnect, font-display:swap) but heavy JPEG payload (above). |

---

## Outstanding
1. ~~Full `/visual-qa`~~ — **DONE.** Completed in Playwright WebKit across 5 templates × 4 widths (375/768/1280/1536) + all interactions; all pass. See `QA-REPORT.md`. (Required switching the preview to the repo's Node `static-server.mjs` — python `http.server` stalls on this machine for images >100 KB, which had corrupted every earlier browser attempt.)
2. **Responsive-image + CDN pass** for real image-weight reduction — deliberate, visually-verified job (not a blind edit). Still recommended, still optional.

## Change log (this pass)
- Gallery dead anchors → `<figure>` — 16 destination pages.
- Copy typo "saigon" → "Saigon" — `index.html`.
- `rel=canonical` + Open Graph + Twitter Card meta — 28 pages.
- `sitemap.xml` + `robots.txt` — new.
- Images: investigated, reverted (no net change).
