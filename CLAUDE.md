# client-cms — Edgar's multi-client website workspace

## What this repo actually is
Despite the repo name, this is a workspace of **static client websites**, one per subfolder. The old Node "AI-native client CMS" app (`server.js`, `src/`, `public/`, root `package.json`) was **removed 2026-07-21** (recoverable from git history if ever needed). There is no root Node project: no `npm install`, no `npm start`, no shared root dependencies. Each site with a serverless form carries its own `package.json` inside its folder.

Active site folders (each is an independent static HTML/CSS/vanilla-JS site):
- `redesign/` — **Edweb Media's own site** (live at https://edwebmedia.com/ — the old edweb-redesign.vercel.app alias is dead). The flagship.
- `spiralguard-redesign/` — Helix/SpiralGuard industrial site
- `navigator-vietnam-voynara/` — travel site
- `tee-to-trail/` — golf tours (multi-page: about, contact, international-courses, + api/)

**Crazy Daizy is NOT in this repo.** It's a live WordPress + WooCommerce site (custom `crazy-daizy` child theme) at https://crazydaizycakeshop.co.za/, edited directly via wp-admin (Theme Editor for style.css/functions.php). A `crazy-daizy/` static folder existed here briefly as an early disconnected mockup (different stores, different contact info, WhatsApp-only ordering, never matched the live site, never committed to git) — deleted 2026-07-18 after a retrofit audit confirmed zero overlap with the real site. If a `crazy-daizy/` folder ever reappears here, treat it as suspect until verified against the live URL.

## Stack — hard facts
- Pure static: HTML + CSS + vanilla JS. **No frameworks, no build step, no bundler.** Don't introduce one.
- Fonts: Manrope (Google Fonts) for display + body on Edweb pages; Material Symbols Outlined icon font for icons. Serif display fonts (e.g. Fraunces) are a per-project choice — ask before switching an existing site's type.
- Previews: `.claude/launch.json` has a Python http.server config per site (redesign=4173, tee-to-trail=4202, spiralguard=4203, mockup-generator=4205, navigator-vietnam=4207). Use Preview MCP (`preview_start` by name), never ad-hoc servers.
- Contact forms — **Vercel serverless is canonical**: `api/send-mail.js` + `vercel.json` (`cleanUrls: true`). Edgar's stack = Hostinger domain/email + Vercel hosting. The `send-mail.php` + `phpmailer/` copies are legacy fallbacks for PHP hosts — edit the `.js` version unless the site is confirmed PHP-hosted.
- Deploy (edwebmedia.com / `redesign/`): run `vercel --prod --yes` **from inside `redesign/`**, then the deployment is aliased to edwebmedia.com. Needs a **fresh Vercel token each session** (Edgar pastes it; never store it; remind him to revoke after). This repo's git `origin` is `github.com/edwebmedia-hub/edweb-redesign` and source is pushed there separately — but the git push is *not* the deploy trigger; the `vercel --prod` CLI run is. (Contrast: `tee-to-trail/` auto-deploys on git push with no token.) The old `edweb-redesign.vercel.app` alias is dead.

## Edweb Media brand — exactly 4 colors, no others
- `#2b2b2b` faded black (ink — headings, dark section backgrounds)
- `#fafafa` faded white (paper — backgrounds, text on dark)
- `#e0474c` coral (primary accent)
- `#7acfd6` teal (secondary accent)

**Never navy.** Any intermediate shade must be derived from these four (e.g. `color-mix()`), never a new hex. All tones live as CSS custom properties in `:root` — change tokens, not scattered values.

## HARD RULES — redesign/ folder
1. **Never edit `redesign/index.html` or `redesign/styles.css`** — that's the live deployed site. All experimental/new design work goes in `redesign/new-home.html` + `redesign/new-styles.css` only, until Edgar says to promote it.
2. `redesign/script.js` is shared across pages. Its FAQ handler does `querySelectorAll('.faq-item')` then `item.querySelector('.faq-question').addEventListener(...)` — if you create any element with class `.faq-item` lacking a `.faq-question` child, the null access **crashes the whole IIFE and silently kills every other feature** (review slider, carousel, nav). Known collision: use `.faq-card` for native `<details>` FAQs. Before reusing ANY class name, grep `script.js` for it.
3. script.js hooks that must keep working if you touch markup: `#site-header`/`.is-scrolled`, `#nav`/`#nav-toggle`, `.reveal`, `.carousel-wrap`/`.carousel-prev`/`.carousel-next`/`.portfolio-item`, `.review-card[data-reviews]`/`.review-slide`/`.review-prev`/`.review-next`, `.text-cycle[data-words]`, `.faq-item`/`.faq-question`/`.faq-answer`.

## Build standards (testable)
- Mobile-first; verify at 375px, 768px, 1280px via `preview_resize` before claiming done.
- Scroll-reveal via IntersectionObserver adding `.is-visible` to `.reveal` — reuse the existing pattern, and never let content stay invisible if JS/IO fails (guard + fallback sweep).
- Images: `loading="lazy"` on everything below the fold; real `alt` text.
- Accessibility: semantic tags, `aria-label` on icon-only controls, visible focus ring, skip link — all already exist in `redesign/`; match that baseline in every site.
- No inline styles except genuine one-offs (existing code uses `style="--reveal-delay:80ms"` — that pattern is fine).
- No new dependencies. If tempted, stop and ask.

## Definition of done — run before saying "done"
1. Page loads on its preview server with **zero console errors** (`preview_console_logs level:error`).
2. Layout verified at mobile + desktop widths (screenshot or `preview_inspect` computed styles as proof).
3. All images load (no 404s in `preview_network`).
4. Interactive pieces actually exercised (click slider next, open FAQ, toggle nav) — not assumed.
5. No placeholder text (Lorem ipsum) anywhere.
6. Only the 4 brand colors (or `color-mix` of them) in any Edweb-branded page.

## Workflow per site task
1. Read the folder's existing HTML/CSS first — match its conventions (token names, spacing scale, comment style, class naming).
2. Change tokens/CSS in that folder only; sites are independent — never "share" CSS across folders.
3. Preview + verify each section before moving on.
4. Commits: plain descriptive one-liners matching existing history style (e.g. "Fix contact form mobile layout — prevent MSF overflow"). Commit only when Edgar asks.

## Branch discipline — ONE site per branch (enforced by hook)
This repo holds many independent sites on one working copy, and multiple Claude sessions can run at once. **Each site gets its own branch; sites never share a branch.**
- Before doing/committing a site's work, check the current branch (`git rev-parse --abbrev-ref HEAD`). If it's `main`, or belongs to a *different* site, create/switch to a branch for THIS site first: `git switch main && git switch -c <site>-work`.
- Never commit site A's files onto a branch that already carries site B's commits. (This is how navigator work once landed on the `icon-fruit-redesign` branch — do not repeat.)
- One site per commit — never stage two site folders together.
- A `pre-commit` hook enforces both (active via `git config core.hooksPath .githooks`; script at `.githooks/pre-commit`). If a fresh clone loses it, re-run that config line.
