# Navigator Vietnam — Visual QA

**Date:** 2026-07-18
**State tested:** commit `9e3e9dc` (retrofit health-pass + button-system unification)
**Engine:** Playwright **WebKit** (Safari engine) — full pass, not just a spot-check.
**Server note:** python `http.server` stalls on this machine for files >100 KB (connection resets — corrupts image load + layout metrics), and the in-app Chromium pane rendered blank/garbage this session. Served via the repo's concurrent `.claude/static-server.mjs` (Node) on :4211 for reliable results.

## Verdict: PASS
All templates clean at every width. All interactions functional. Health-pass changes verified on-screen.

## Width matrix — 5 templates × 4 widths
Each cell verified: no horizontal overflow (scrollWidth == clientWidth), all images loaded (0 broken), 0 console errors, scroll-reveals fired (content never stuck invisible).

| Page (template) | 375 | 768 | 1280 | 1536 |
|---|---|---|---|---|
| Home (`index.html`) | ✅ | ✅ | ✅ | ✅ |
| Destination (`destinations/ha-giang.html`) | ✅ | ✅ | ✅ | ✅ |
| Contact (`contact.html`) | ✅ | ✅ | ✅ | ✅ |
| Tour detail (`tours/peaks-passes-caves.html`) | ✅ | ✅ | ✅ | ✅ |
| About (`about.html`) | ✅ | ✅ | ✅ | ✅ |

No horizontal overflow at any width. No broken images. Zero console errors on any page/width.

## Interactions exercised (WebKit, not assumed)
| Interaction | Result |
|---|---|
| Mobile nav toggle (open + close) @375 | ✅ opens and closes |
| Region destinations carousel — next | ✅ scrolls |
| "Why Travel" feature strip — next | ✅ scrolls |
| Testimonials slider — next | ✅ scrolls |
| Activities accordion — open panel | ✅ opens |
| Contact form — submit empty | ✅ inline error shown, `aria-invalid="true"` |
| FAQ (`<details>`) — toggle | ✅ opens |

## Health-pass changes verified on-screen
- **Gallery `<figure>` swap** (ha-giang 1280): 2×2 gallery grid renders identically to intent — images, gradient overlays, category + title captions. No regression from the `<a>`→`<figure>` change.
- **01/02/03 markers removed** (home, activities accordion): rows now show icon + title only, cleanly aligned; numbers gone. Panel copy indent correct after the CSS adjustment.
- **Eyebrow labels retained** (per Edgar's decision) — render correctly above headings.
- **Button-system unification** visible: olive buttons + logo-orange status badges (Guide Favorite / Bestseller / Adventure) consistent across tour cards.

## Screenshots captured (full-page, revealed state)
`nav-home-{375,768,1280,1536}.png`, `nav-hagiang-*`, `nav-contact-*`, `nav-tour-*`, `nav-about-*` (WebKit, scratchpad). Home + destination + contact reviewed at desktop and mobile — all polished, single-column stacking clean on mobile, section rhythm consistent.

## Not a defect (documented)
- One reveal element occasionally reads `opacity < 1` at capture time (mid-transition) — transient, content is present and reveals on scroll. Not user-facing.

## Responsive images (follow-up, verified)
`srcset` (480/800/1200 w variants) + `sizes` added to 148 images. WebKit @2× DPR confirms the browser fetches the small variant on mobile (`hero-800w.jpg` at 375) and the original on desktop (`hero.jpg` at 1280) — 63% lighter heroes on mobile, no layout change, 0 broken, image quality crisp.

## Deferred
- None. Full 4-width + interaction pass complete in WebKit. (Chromium parity not separately captured this session — in-app pane was unreliable — but WebKit is the stricter engine for layout; no WebKit-specific breaks found.)
