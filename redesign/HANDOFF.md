# Edweb Media (edwebmedia.com) — state handoff

Written 2026-08-04 at the end of the Aug 1-4 redesign marathon, so a fresh session can pick up without the chat history.

**Live:** https://edwebmedia.com at `?v=2026073011`
**Branch:** `redesign-navigator`, head `5aff879`, pushed to `github.com/edwebmedia-hub/edweb-redesign`
**Deploy:** `vercel --prod --yes` from inside `redesign/`. Fresh token each session, revoke after. The git push is backup, not the deploy trigger.

---

## Rule that changed during this marathon

`CLAUDE.md` still says never edit `redesign/index.html` or `redesign/styles.css`, and to work in `new-home.html` until promoted. **Edgar directed live edits to those files all marathon**, deploying to production after each change. That rule is stale in practice. Ask him before either obeying it or editing CLAUDE.md.

---

## Design system as it now stands

**Colours** — unchanged, 4 brand tokens only. Dark is `#1a1a1a`/`--ink` and appears in exactly three places: hero, quote band, footer. **No dark bands mid-page**; Edgar asked for one on services, saw it, rejected it.

**Two light tones only:** `--paper` white and `--paper-dim` faded blue. No third tone.

**Section rhythm** — every page alternates, no two adjacent sections share a background:

| Page | Rhythm |
|---|---|
| home | DARK, TINT, white, TINT, white, TINT, white, DARK, white |
| about-us | DARK, white, TINT, white, DARK, white, CORAL |
| projects | DARK, white, TINT, CORAL |
| packages | DARK, white, TINT, white |
| contact | DARK, white, TINT, white |
| pay | DARK, white |

**One card treatment, everywhere.** White fill, `1px solid var(--border)`, `--radius-md`, `--shadow-md`, one hover lift. Defined in the CARD SYSTEM block at the end of `styles.css`. Covers `.pcard`, `.pathway-card`, `.svc-card`, `.tm-card`, `.dcard`, `.pf-card`, `.work-item-img`, `.team-portrait-wrap`, `.process-step`.
Deliberately **not** cards: `.faq-item` rows and `.plan-chooser-item` pill. Leave them flat.

**Spacing.** Sections `clamp(3.5rem, 2.3rem + 3.9vw, 6.25rem)` (93px at 1440, 56px at 390). All card grids `--sp-6` (32px). Head-to-content one shared clamp. The quote band uses the same section clamp, not its own.

**Icon chips.** Solid ink square, white glyph, coral on hover. Site-wide.

---

## Things that will bite you

1. **`overflow: hidden` breaks `animation-timeline: view()`.** It makes the element a scroll container so the timeline resolves against a box that never scrolls, and the animation freezes. `.section--ink` uses `overflow: clip` for exactly this reason. Do not "tidy" it back to `hidden`.

2. **The `?package=` chain.** Links in `packages.html` and `index.html` carry `?package=Business+Website+-+Silver+Plan+%28R3%2C999%29`. `script.js` matches those **exact strings** to prefill the contact form. Change one side and the prefill dies silently. Both sides use ` - ` (hyphen) since the em-dash sweep.

3. **`.msf` contact form.** Flex column, the `gap` alone does the spacing. Children must not carry their own margins, and there were inline `style="margin-bottom:…"` attributes doing it invisibly. If the form looks too long again, check the markup for inline margins first.

4. **`script.js` FAQ handler** still crashes the whole IIFE on any `.faq-item` without a `.faq-question` child. Use `.faq-card` for native `<details>`.

5. **The retired services rail.** Markup, CSS and arrows are deleted. Its IIFE is still in `script.js` and no-ops behind `if (!rail) return`. Harmless, but it is dead code.

---

## Deliberate decisions, do not "fix" these

- **Home has no closing CTA band.** Edgar removed the coral endcap from the home page only; About Us and Projects keep it. Worth watching enquiry volume, but it was his call.
- **Services shows all six cards at once**, no carousel, no arrows.
- Process steps rise from below on scroll, >640px only, reduced-motion honoured.

---

## Open, not done

- `AUDIT.md` items from 2026-07-18 were never actioned: unoptimised project PNGs (~745KB), `.html` vs clean-URL canonical mismatch, stale `sitemap.xml`, homepage heading order, 21px mobile footer tap targets.
- Em-dashes remain in ~5 `script.js` code comments. Not output, so left alone. All visible copy on all six pages is clear.
- The dashboard card's dark toggle reads wrong via `getComputedStyle` in the devtools MCP browser but works. Verify that one visually, not by measurement.
