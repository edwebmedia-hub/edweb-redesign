# Helix SpiralGuard — Health-Pass Audit

**Site:** spiralguard-redesign/ · live at https://spiralguard.co.za/
**Type:** Retrofit health pass (built before the Website OS). Not a rebuild.
**Date:** 2026-07-19
**Method:** Static read of all files + live runtime checks in real Chrome (foreground) and the preview pane. Evidence is console output, network log, computed styles and DOM geometry — no eyeballing.

Stack confirmed: pure static HTML/CSS/vanilla JS, Vercel serverless contact form (`api/send-mail.js`, nodemailer → Hostinger SMTP, honeypot + per-IP rate limit). Vercel project `spiralguard-redesign`. Fonts: Inter + Material Symbols (Google). Brand: Helix red `#f3182e` on slate/steel/off-white.

---

## Baseline (clean)

| Check | Result |
|---|---|
| Console errors (home) | **None** — clean in real Chrome and pane |
| Network 404s | **None** — all 7 requests 200 (html, css, js, logo, 3 photos) |
| Horizontal overflow @375 / 768 / 1280 | **None** at any width (scrollWidth == innerWidth) |
| Mobile nav collapse | Correct — links hidden ≤768, hamburger shown, toggle opens/closes + `aria-expanded` flips |
| Grid reflow | benefits/why/products/footer collapse correctly (3→2→1) |
| Single `<h1>` | Yes (1) |
| Alt text | Content images have real alt; decorative hero/CTA images `alt="" aria-hidden` |
| Skip link + `:focus-visible` rings | Present and correct |
| Contact form backend | Wired and functional (JSON POST → serverless; honeypot + rate-limit server-side) |
| SEO meta | title, description, canonical, OG, Twitter, LocalBusiness + Product JSON-LD, sitemap, robots all present |

The site is fundamentally healthy. Findings below are robustness, accessibility and hygiene gaps, not breakage.

---

## Genuine defects (fixed in this pass)

### D1 — Scroll-reveal can leave the whole page invisible · HIGH
`.reveal { opacity: 0 }` (styles.css:180) on **26 elements** — hero copy, every section body. They only become visible when the IntersectionObserver adds `.is-visible`. There is **no `no-js` guard and no IO-stall fallback**.
**Evidence:** In a throttled/backgrounded render context (preview tab reported `document.visibilityState:"hidden"`), the compositor never delivered IO callbacks — a freshly-created observer on an in-viewport element returned `isIntersecting:false`, and all 26 reveals stayed at `opacity:0` (blank page). Foreground Chrome works, but any no-JS / prerender / throttled / IO-failure context blanks the content. Violates the standing rule (reveal must never leave content invisible: JS guard + IO-stall fallback + safety sweep).
**Fix:** `no-js` class on `<html>` removed by an inline head script; CSS `.no-js .reveal { opacity:1; transform:none }`; plus a safety-sweep timeout that force-reveals anything still hidden.

### D2 — Contact modal has no focus management · MED-HIGH (WCAG 2.4.3)
`role="dialog" aria-modal="true"` but on open: focus stays on `<body>` (not moved into dialog), background is **not** inert, and **23 focusable elements behind the modal remain in tab order** (no trap). Focus is not restored to the trigger on close.
**Evidence:** opened modal via trigger → `focusMovedIntoModal:false`, `backgroundInert:false`, `outsideFocusableCount:23`.
**Fix:** move focus into modal on open, trap Tab, `inert` the page behind, restore focus on close.

### D3 — `#contact` anchor doesn't exist · MED
Contact is modal-only; there is no `#contact` element. On the home page JS intercepts `[data-modal-open]`, so it works there. But the **legal pages** link Contact to `index.html#contact` with no modal trigger — arriving there just lands at the top of home, and with JS off the on-page Contact links do nothing.
**Evidence:** `missingAnchorTargets:["#contact"]`.
**Fix:** open the modal when the page loads with `#contact` in the URL (and on hashchange), so `index.html#contact` works cross-page.

### D4 — Legal-page "Request a Quote" is an unstyled link · MED
On privacy-policy.html and terms-conditions.html the header CTA is `<a href="index.html#contact">Request a Quote</a>` with **no `btn btn--primary` classes** — renders as a plain text link, inconsistent with every other page.
**Fix:** add the button classes (match index.html).

### D5 — Parallax ignores `prefers-reduced-motion` · LOW (WCAG 2.3.3)
JS writes `transform: translateY()` on scroll to the hero and CTA images regardless of the user's reduced-motion setting (the CSS reduced-motion block can't catch JS inline transforms).
**Fix:** skip the parallax wiring when `matchMedia('(prefers-reduced-motion: reduce)')` matches.

### D6 — Below-fold images not lazy-loaded · LOW
`feature-action.jpg` and `about-product.jpg` have real alt but no `loading="lazy"` / `decoding="async"`.
**Fix:** add both.

### D7 — False "no backend" comment in the form · LOW
index.html carries a comment telling the site owner the form "currently has no backend … set the action attribute" — but the form is fully wired to the Vercel serverless endpoint. Misleading to whoever maintains it.
**Fix:** correct the comment to describe the real backend.

### D8 — JSON-LD missing telephone · LOW (SEO)
LocalBusiness structured data lists email only; the phone (+27 84 620 4583) is public on every page but absent from schema.
**Fix:** add `telephone` to LocalBusiness + contactPoint.

---

## Needs your call — not changed (design / brand)

- **O1 — Primary button contrast 4.22:1 (below WCAG AA 4.5).** ✓ **RESOLVED 2026-07-19.** White label on brand red `#f3182e`; button text is 15–16px bold (not "large text"), so it fails AA. **Fix applied:** filled buttons (`.btn--primary`, `.cta-band .btn--secondary`) now use `--accent-dark #c8101f` = **5.92:1** (passes AA); added `--accent-darker #a50d19` for hover; killed the stray `#c8101f` hex. Verified live on spiralguard.co.za.
- **O2 — Brand name.** Title, OG and hero say "SpiralGuard"; the recorded full name is **Helix SpiralGuard** (only the About body currently says "SpiralGuard (Helix Spiral Guard)"). Decide whether Helix should surface in the title/hero.
- **O3 — Sticky mobile CTA is dead.** `.sticky-cta` is `display:none` at base **and** re-set to none ≤768 — it never appears anywhere. Enable on mobile or delete the markup. (Header CTA stays visible on mobile, so nothing is currently broken.)
- **O4 — ~250 lines of unused CSS** (`.image-banner`, `.steps-grid`, `.industries-grid`, `.specs-list`, `.contact-grid/-info/-details`, `.values-grid`, `.placeholder-img`, `.hero-eyebrow`, `.btn--ghost-*`, `.hero-visual`, `.section--tight`). Cleanup only; touches shared CSS so I left it.
- **O5 — At exactly 768px all grids drop to 1 column** (sparse tablet). Could hold 2 columns down to a smaller width.
- **O6 — Render-blocking Google Font CSS**; self-hosting or the print-swap trick would shave first paint.
- **O7 — Nav-toggle tap target 40×32px** (passes AA min 24, under the comfortable 44).
- **O8 — Footer `<h4>`s** sit under no `<h3>` (minor heading-hierarchy nit).
- **O9 — sitemap has no `lastmod`; Product schema has no `priceValidUntil`** (minor SEO polish).

---

## Visual QA + independent review

See QA-REPORT.md (responsive screenshots / WebKit-Safari spot-check) and the site-reviewer verdict appended after fixes.
