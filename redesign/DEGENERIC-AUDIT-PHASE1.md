# De-Generic Audit, Phase 1 Findings

Run: 2026-08-10, against the live https://edwebmedia.com (verified matching local `redesign/` source) and the live https://rodega.com. Per DEGENERIC-AUDIT-PROMPT.md this is the audit only. Nothing has been edited. Phase 2 waits for Edgar's approval, lands in `new-home.html` + `new-styles.css` on an edweb branch.

## What rodega.com runs today (for contrast)

Full Claude agency template, live right now: "Where Engineering Meets Visual Artistry" title, eyebrow labels on every section (THE RODEGA WAY, WHAT WE BUILD, HOW WE WORK), monospace `01 // GET ONLINE` numbering, Discover / Design / Build / Launch & evolve process in numbered 01-04 blocks, two terminal gimmicks (fake zsh build log and ASCII logo), founder quote about "soul", five-step "Find your fit" form builder with card radios, and the stock phrases: "handcrafted" three times, "obsessive care", "Obsessed With Detail", "the final 1% that others miss", "seamless integration", "built with a soul".

## What EdWeb already does right (no action)

- Copy is largely clean: zero hits for handcrafted, bespoke, pixel-perfect, obsessed, seamless (visible text), "where X meets Y"
- No monospace letterspaced labels, no terminal or build-log gimmicks, no ASCII art
- No founder quote with signature image
- No "Starting From" pricing, prices are fixed and real (R3,999 / R4,999 / R6,499), plan-note is honest about add-ons
- Eyebrow dot/dash indicator already removed site-wide (2026-07-29)
- Industries section is flat rows, not cards
- Real proof exists: 9 client logos, 10 named Google reviews at 5.0, real portfolio pages

EdWeb is roughly half de-templated already. The remaining overlap with rodega is structural, not verbal.

## Findings (numbered, severity, one-line fix)

1. **Process section, home** (`How We Work`). Discover / Design / Build & Launch / Grow in numbered 1-4 dot steps along a line with card bodies. Rodega's process is Discover / Design / Build / Launch & evolve in numbered 01-04 blocks. Same skeleton, near-same names, the single strongest template overlap. **Severity: high.** Fix: replace with a real-time timeline using true numbers (Day 1 brief, first preview link, live in 2-3 weeks) as one continuous line with markers, no numbered step cards, no generic verb names.

2. **Contact form** (`contact.html`, `.msf`). Multi-step form with 3 progress-dot steps, connectors and card-style service checkboxes. This is the "multi-step builder with progress bar and card radios" tell verbatim, and rodega runs the same idea as a 5-step builder. **Severity: high.** Fix: one flat form (name, contact, message, optional package select) plus the WhatsApp button; script.js MSF handlers and the `api/send-mail.js` endpoint stay untouched in Phase 2 planning terms (endpoint logic is out of scope).

3. **Eyebrow label system, site-wide** (6 on home, 6 on packages, plus contact and project pages). Small caps, 0.22em letterspacing, coral, sitting above headings. Dot removed but the anatomy and the section-label rhythm are identical to rodega's THE RODEGA WAY / WHAT WE BUILD / HOW WE WORK. **Severity: high.** Fix: delete the label row entirely and let varied section openers carry structure (plain left h2, two-column intro, full-bleed break).

4. **Repeating section rhythm.** Four home sections open identically: eyebrow, centred h2, centred p, then a grid (pricing, industries, work, reviews). This is the "label > centred heading > paragraph > card grid" rhythm tell. **Severity: medium-high.** Fix: left-align headings by default and vary the opener per section so no two consecutive sections share a skeleton.

5. **Dashboard card, About section** (`.dcard`). Fake-SaaS dressing: "On track" status pill, 100% progress ring, revenue-style bar, tab strip. The facts inside are true (2-3 weeks, support included) but the fake-dashboard costume is in the same gimmick family as rodega's fake terminal. **Severity: medium.** Fix: keep the facts, drop the dashboard cosplay for a flat spec sheet or plain figures row (Edgar may deliberately like this piece, his call).

6. **Quote band, home.** Motivational self-quote attributed to "The Edweb Media Team": "honest, clear and built to last. That's what we build, every time." Any agency could run it, nobody can verify it. **Severity: medium.** Fix: swap for one real client pull-quote from the 10 Google reviews (named) or a single provable fact line.

7. **Italic accent word in headings.** Hero "grow" is italic with a drawn coral swoosh (distinctive, arguably keep), but `hero h1 em` teal-italic accents also exist as a site-wide pattern on inner page headings. Sans not serif, so a half-tell. **Severity: medium.** Fix: keep the hero swoosh if wanted, remove plain teal-italic `em` accents from inner-page headings.

8. **Vague any-agency claims.** "Premium websites", checklist items "Fast load times / SEO optimised", and "look(s) sharp online" appearing near-verbatim in the hero lead, the About copy and the dcard panel. **Severity: medium.** Fix: replace with provable specifics (real client count, real turnaround, real prices, a real performance number) and dedupe the repeated phrasing.

9. **Dark hero treatment.** Teal + coral gradient washes, animated canvas network lines, vignette. Matches the "dark hero with subtle grid lines or gradient glow" tell family, though full-bleed dark heroes are an EdWeb signature by choice. **Severity: low-medium.** Fix option: swap the canvas net for a full-bleed real project image with dark overlay (matches Edgar's stated hero preference), otherwise consciously keep.

10. **Pricing, home teaser + packages.** 3-card grid with tick lists and bottom CTA is the pricing tell verbatim. **Caveat: Edgar explicitly approved pcard v5 on 2026-08-04**, which postdates the audit prompt. **Severity: low (pending Edgar's call).** Fix if approval is reversed: comparison table or full-width stacked rows per Phase 2 spec; otherwise keep and accept the trade.

11. **Footer tagline.** "Designed for Success." could close any agency's footer. **Severity: low.** Fix: real line (city + real launched-site count) or drop it.

12. **Service grid, home.** Six icon cards with h3 + one-liner. Content is concrete but the anatomy is the default card habit. **Severity: low.** Fix: fold into the Phase 2 layout-variety pass (flat two-column service rows with real deliverables).

## Decision needed from Edgar

Approve which findings go to Phase 2 (rewrite into `new-home.html` + `new-styles.css`, never the live files). Items 1, 2, 3 and 4 are the ones that make EdWeb and rodega read as siblings; 5 and 10 are taste calls that belong to Edgar.
