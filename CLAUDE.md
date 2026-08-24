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
- Previews: `.claude/launch.json` has a config per site (redesign=4173, tee-to-trail=4202, spiralguard=4203, mockup-generator=4205, navigator-vietnam=4207). Use Preview MCP (`preview_start` by name), never ad-hoc servers. Server engine must be `node .claude/static-server.mjs <port> <dir>`, NEVER `python -m http.server`: python drops files over ~100KB on this machine and blanks photos in QA shots (recorded lesson). Several launch.json entries still carry python; switch each to static-server.mjs when you touch that site.
- Contact forms — **Vercel serverless is canonical**: `api/send-mail.js` + `vercel.json` (`cleanUrls: true`). Edgar's stack = Hostinger domain/email + Vercel hosting. The `send-mail.php` + `phpmailer/` copies are legacy fallbacks for PHP hosts — edit the `.js` version unless the site is confirmed PHP-hosted.
- Deploy (edwebmedia.com / `redesign/`): run `vercel --prod --yes` **from inside `redesign/`**, then the deployment is aliased to edwebmedia.com. Needs a **fresh Vercel token each session** (Edgar pastes it; never store it; remind him to revoke after). This repo's git `origin` is `github.com/edwebmedia-hub/edweb-redesign` and source is pushed there separately — but the git push is *not* the deploy trigger; the `vercel --prod` CLI run is. (Contrast: `tee-to-trail/` auto-deploys on git push with no token. `navigator-vietnam-voynara/` is live at navigator-vietnam.com but its deploy trigger is undocumented and the live site was found BEHIND committed source on 2026-08-17: confirm and document its trigger on the next deploy.) The old `edweb-redesign.vercel.app` alias is dead.
- **Deploy parity (hard rule, 2026-08-17):** a commit is not a deploy. After any content fix on a token-deploy site, fetch the LIVE URL and confirm the change is visible before calling it done. Two live sites were found stale against committed source (navigator missing hero CTAs, spiralguard selling a removed product option).

## Edweb Media brand — exactly 4 colors, no others
- `#1c1c1c` faded black (ink — headings, dark section backgrounds)
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

## Website OS (applies to every site task in this repo)
Every client-website task here runs on the Edweb Website OS: invoke the `website-os` skill at the start of any build, redesign, audit or launch task. The bits sessions here most often skipped (audit 2026-08-17): the first-render look loop runs BEFORE Edgar sees any new page (evidence line in QA-REPORT.md), substantial work passes the **site-reviewer** agent before it is called complete, deploys run the gate block in `/deploy-client-site` (reviewer verdict, look-loop line, em-dash sweep, impeccable cache), and every launch closes with the vault + CLIENTS.md registrations. Full standards: OS repo `policies/QUALITY-STANDARDS.md`.

## Definition of done — run before saying "done"
1. Page loads on its preview server with **zero console errors** (`preview_console_logs level:error`).
2. Layout verified at 375, 768 and 1280 (OS minimum; the consistency sweep uses 390), screenshot or computed styles as proof.
3. All images load (no 404s in `preview_network`).
4. Interactive pieces actually exercised (click slider next, open FAQ, toggle nav) — not assumed.
5. No placeholder text (Lorem ipsum) anywhere.
6. Only the 4 brand colors (or `color-mix` of them) in any Edweb-branded page.
7. Reveal/scroll-animated elements assert `getComputedStyle(el).opacity === '1'` after scrolling into view (class presence is not proof; an unresolved `animation-timeline` held a live section invisible on edwebmedia.com until 2026-08-17).
8. Substantial work: site-reviewer verdict + look-loop line exist in QA-REPORT.md (OS gates).

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
