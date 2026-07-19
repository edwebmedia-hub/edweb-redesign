# Helix SpiralGuard — Visual QA + Health-Pass Fix Log

**Date:** 2026-07-19 · **Scope:** retrofit health pass (no redesign)
**Verified in:** real Chrome (chrome-devtools MCP, foreground) + preview pane geometry at exact viewports.
Companion doc: [AUDIT.md](AUDIT.md) (findings). This doc = fixes applied + QA evidence.

---

## Fixes applied (all verified)

| # | Fix | Evidence |
|---|---|---|
| D1 | Scroll-reveal fail-safe: `no-js` class + inline head script + `.no-js .reveal{opacity:1}` CSS + IO-stall safety sweep (reveal all if the observer never fires within 2.5s) | `htmlClass:"js"` after load; hero `opacity:1`; JS-off path shows content via CSS |
| D2 | Contact modal is now an accessible dialog: focus moves into it, Tab is trapped, background is `inert`, focus restored to trigger on close, Escape closes | open → focus on `DIV.modal`; the 23 background focusables become non-tabbable via `inert` (focus verified unable to land on them); Tab wraps; Escape closes + `focusRestored:true` |
| D3 | `index.html#contact` deep-link opens the quote modal (on load + hashchange) — Contact link from the legal pages now works instead of dead-ending | verified handler; `missingAnchorTargets` no longer strands users |
| D4 | Legal-page "Request a Quote" given `btn btn--primary` classes (was an unstyled text link) | classes present on privacy + terms |
| D5 | Parallax skipped when `prefers-reduced-motion: reduce` | guarded by `matchMedia` before wiring scroll |
| D6 | `feature-action.jpg` + `about-product.jpg` → `loading="lazy" decoding="async"` | both report `loading:"lazy"`; absent from initial network load |
| D7 | Corrected the false "form has no backend" comment to describe the real Vercel serverless endpoint; `action` now points at `/api/send-mail` as a no-JS fallback | `formAction:"/api/send-mail"` |
| D8 | Added `telephone` to LocalBusiness + contactPoint JSON-LD | `jsonldHasTel:true` |
| D9 | Removed all **7 em-dashes** from body copy (comma / full stop / colon; meaning preserved) across index + both legal pages; also swapped the 4 `—` empty-field markers in the notification email template (`api/send-mail.js`) to `N/A` | 0 em-dashes in rendered site copy; the email-template `—` are also gone (only non-shipped code/doc comments may still contain the glyph) |
| D10 | Hero `min-height: 100dvh` layered over `100vh` — iOS Safari address-bar fix | additive; `100vh` fallback for old engines |

Console after fixes: **clean** (0 errors on a fresh load; a stale `ERR_CONNECTION_RESET` was a cut connection from a timed-out reload, not a live asset — all 10 current requests 200). No new dependencies. Only brand tokens touched.

---

## Responsive QA — 375 / 768 / 1280 (exact viewports)

| Width | Overflow | Nav | Grids | Screenshot |
|---|---|---|---|---|
| **375** (mobile) | none (`scrollWidth==375`) | hamburger, opens/closes, `aria-expanded` flips | all stack to 1 col | full page — hero, benefits ×4, industries ×6, products ×3, CTA all correct |
| **768** (tablet) | none (`scrollWidth==753`) | collapsed to hamburger | single column | industries section clean, icon tiles render |
| **1280** (desktop) | none (`scrollWidth==1267`) | full inline nav | products 3-col, why 2-col | hero + 3-col pricing verified |

H1: exactly 1. Heading order clean in main content (footer `<h4>` noted as minor). All content images have real alt; decorative images `alt="" aria-hidden`.

## Interaction QA
- **Modal:** opens from all 9 triggers, focus trap + inert + restore verified, Escape + overlay-click + close-button all close.
- **Nav toggle:** opens/closes, `aria-expanded` toggles.
- **Reveal:** hero visible on load; sections reveal on scroll (IO) in foreground; fail-safes cover no-JS / throttled / hidden-tab.
- **Form:** submit handler posts JSON to `/api/send-mail`; honeypot + rate-limit server-side; graceful failure alert. (Live send needs the Vercel `SMTP_PASS` env — not exercised locally.)

## Accessibility (WCAG 2.2 AA pass)
- Skip link, visible `:focus-visible` rings, semantic landmarks, single H1, labelled icon controls — all present.
- Modal dialog semantics now complete (D2).
- **Contrast:** body/muted/inverse text all pass (5.1, 4.8, 7.3–8.8:1). **Open item O1:** white-on-accent button labels = **4.22:1** (below 4.5) — brand-colour decision, left for Edgar.

## WebKit / Safari spot-check
No Safari/WebKit engine is available on this Windows machine, so this is a **code-level compatibility review**, not a live Safari render. A real-device pass (Mac/iPhone or BrowserStack) is recommended before launch.

- **Feature support:** `aspect-ratio`, flex/grid `gap`, `clamp()`, `object-fit`, `position:sticky`, `IntersectionObserver`, `matchMedia` reduced-motion, `requestAnimationFrame`, `-webkit-font-smoothing/text-size-adjust` — all supported in Safari 15+. No `color-mix()` used.
- **`inert` (new, D2):** Safari 15.5+. On older Safari it's ignored, but the JS focus-trap still contains focus — graceful degradation, no trap failure.
- **iOS input zoom:** form inputs are 16px (`--fs-base`), so iOS Safari won't auto-zoom on focus. ✓
- **iOS viewport:** hero switched to `100dvh` (D10) to avoid address-bar overflow. ✓
- **`scroll-behavior:smooth`:** Safari 15.4+; older engines fall back to instant scroll (fine).

**Verdict:** no WebKit blockers found in code. Confirm on a real Apple device at launch.

---

## Open items for Edgar (not changed — design/brand)
O1 button contrast · O2 "Helix SpiralGuard" naming · O3 dead sticky-CTA · O4 unused CSS (~250 lines) · O5 768 grid density · O6 render-blocking fonts · O7 nav-toggle 40×32 tap · O8 footer h4 hierarchy · O9 sitemap `lastmod` / Product `priceValidUntil`. Detail in AUDIT.md.
