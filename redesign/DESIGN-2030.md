> **SUPERSEDED, and describing a site that no longer exists.** This audit is
> dated 2026-08-02 and reads the PRE-REBUILD edwebmedia.com: the mesh hero, the
> dashboard card and the 01/02/03 process blocks it discusses were all replaced
> in the 2026-08-21 rebuild. Kept for the reasoning, not for the findings. The
> current design system is in HANDOFF.md and the current state in QA-REPORT.md.

# Edweb Media, 2030 pass. Audit and plan (2026-08-02)

Baseline: live edwebmedia.com, `v=2026072939`. Audit method: full-page sweeps at 390px and 1440px through this session, computed-style census (fonts, radii, shadows), section-by-section review against the modern-design-playbook.

## Verdict

The skeleton is strong and the best moments are genuinely good: the interactive hero mesh, the testimonial wall, the drifting services rail, the comparison pricing tables. Token discipline is real (one type family, 5 radii all from the token scale, 6 shadow recipes, 4 brand colours only).

What separates it from a 2030-grade site is connective tissue:

1. No page-to-page transitions. Every nav click is a hard white flash.
2. The dark bands are flat gradients. On big screens they band; they read "AI gradient" instead of material.
3. Motion language is applied in 3 sections, not everywhere. The dashboard card LOOKS interactive but does nothing on hover.
4. The process section (01 / 02 / 03 numbered blocks with hairline dividers) is on the banned template-tell list and is the most dated thing on the page.
5. The quote band appears in one block. Key statements deserve staged delivery.
6. The home page lost its closing ask when the CTA band was removed. Between pricing and footer there is no final conversion moment.
7. No proof-by-numbers anywhere: no stats, no client logo strip.

## Wave 1. Global polish, additive only, no layout changes (BUILT, on preview)

1. **Cross-page view transitions**: soft 200ms fade between pages via `@view-transition`. Browsers without support just navigate normally. Reduced motion: off.
2. **Film grain** on the four dark dot bands (hero, quote band, page heros, CTA band): SVG turbulence at ~5% white, layered into the existing dot pattern. Kills gradient banding, adds material.
3. **Hero depth on scroll**: the mesh canvas sinks slightly as you scroll away, separating layers. `animation-timeline: scroll()`, guarded.
4. **Dashboard card cursor tilt**: max 3deg toward the pointer, desktop-with-mouse only, reduced motion off, resets on leave. The card already had `preserve-3d` waiting.
5. **Quote cascades word by word** when it scrolls into view, 28ms stagger. No-JS and reduced-motion see the plain text; a 4s fail-safe forces words visible regardless.
6. **Brand text selection** (coral) and a proper `:focus-visible` ring on all buttons.

Already present, verified, not duplicated: nav link underline draw, button press state, preconnect to font hosts, lazy loading below fold.

## Wave 2. Section rebuilds (Edgar picks the order)

A. **Process section** ("A clear path from idea to launch"): replace the numbered 01/02/03 blocks with a scroll-driven timeline: a progress line that draws as you scroll, steps igniting one by one. Kills the template tell, gives the page its scroll-story moment. Flagship candidate.
B. **Home closing CTA row** above the footer. Not the old dark band: an oversized "Start your project" typographic link row. Fills the conversion gap item 6 above.
C. **Portfolio**: view-transition morphs into the six project pages (card image morphs into the page hero), designed hover (slow image pan, title slide). Makes the case-study flow feel app-like.
D. **Industries**: interaction pass on the auto-track (hover states, varied card weights) or a bento band. Lowest priority of the four.

## Wave 3. New sections (need real content from Edgar)

E. **Stats band** with scroll count-up. Needs REAL numbers (sites launched, years running, average build time). Nothing gets invented; TODO Edgar.
F. **Client logo strip**: real logos already exist in the project pages' assets.
G. **Featured case study block** on home: one project, big imagery, links to its detail page.

## Open decision: typography

Single-family Manrope is clean but is the biggest remaining premium lever. Two roads:
1. Keep Manrope, push scale and weight contrast harder (safe, free, subtle gain).
2. Add a display family for headings only (Space Grotesk or Bricolage Grotesque direction), Manrope stays for body. Bigger jump. Per project rules this needs Edgar's explicit sign-off before touching type.

## Deliberately kept

Eyebrow labels (Edgar's standard, made consistent on request), the locked 4-colour palette, plain footer, section rhythm (verified: no two adjacent sections share a background), all existing script.js hooks.

## Trialled and rejected this cycle (do not re-propose)

Dark pricing band. Full-bleed mobile tables. Pricing swapped above process. De-generic full rewrite (July).
