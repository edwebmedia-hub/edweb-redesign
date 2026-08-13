# EdWeb Media: De-Generic Audit & Rewrite

> Saved from the "Claude-built website similarities" phone chat (25 Jul 2026), corrected for this repo's facts.
> Run this from the client-cms repo in the EdWeb chat, on an `edweb`-only branch (one branch per site).
> Repo hard rule: `redesign/index.html` + `redesign/styles.css` are the LIVE deployed site. Phase 2 rewrite lands in `redesign/new-home.html` + `redesign/new-styles.css` until Edgar promotes it.

## Context

This is the EdWeb Media agency site (`redesign/`, live at https://edwebmedia.com). Another agency site (https://rodega.com) was clearly also built with Claude and shares many of the same patterns. Both lean on Claude's default "design agency" template: same structure, same tone, same stock phrases. Goal: EdWeb stops looking like AI output and starts looking like a real studio with a real system.

Reference screenshots of the overlapping Rodega sections are in `redesign/screenshots/` (optional). Fetch https://rodega.com live as well for comparison.

## Phase 1: Audit (do this first, then STOP and report before changing anything)

Compare the site against rodega.com and against Claude's generic agency patterns. Flag every instance of:

- Stock AI agency copy: "handcrafted", "obsessed with detail", "pixel-perfect", "the 1% others miss", "built with soul", "where X meets Y", "elevate your brand", "seamless", "bespoke" and similar
- Template structure: the standard Discover > Design > Build > Launch 4-step process, generic tiered pricing card layouts, terminal/build-log gimmicks, fake status indicators
- Vague claims with no proof: anything any agency could say about itself
- Sections that visually or structurally mirror rodega.com

### Specific Claude design patterns to hunt for (confirmed on rodega.com, likely on EdWeb too)

- Pill or eyebrow label above the hero headline (small caps, letterspaced, dot indicator)
- Hero headline in a sans font with one accent word swapped to italic serif in a brand colour
- Section headings repeating that same "plain text + italic serif accent word" trick
- Small monospace ALL CAPS labels with wide letter-spacing ("HOW WE WORK", "01 // LAUNCH" style numbering with slashes)
- Numbered process steps (01, 02, 03) separated by thin horizontal divider lines, sometimes with small coloured dots
- Founder or team quote section with oversized quotation mark and signature image
- Pricing cards: tick-list of features, "Starting From" label, price at the bottom
- Multi-step contact or package-builder form with a progress bar and card-style radio options
- Dark hero with subtle grid lines or gradient glow in the background

For each found on EdWeb, the fix must change the structure or treatment, not just the words. Two sites using the same skeleton with different copy still look like the same template.

Output a numbered list: section, what's generic, severity (high/med/low), one-line proposed fix. Wait for Edgar's approval before editing.

## Phase 2: Rewrite (after approval; into new-home.html + new-styles.css only)

### Positioning: what EdWeb actually is

EdWeb's real edge is speed and systems, not artisan mystique. Rewrite copy around what is true and provable:

- Sites built and deployed fast (days, not months) using a refined, repeatable build system
- Fixed, transparent pricing and scope (prices only from OS repo `business/PACKAGES.md`, never invented)
- Lean static builds: fast-loading, no bloat, no unnecessary tooling
- Hosting and deployment handled end to end (Hostinger domain/email + Vercel hosting)
- Real turnaround, real process, real client outcomes

Every claim specific and verifiable. Replace adjectives with facts. "Obsessed with detail" becomes nothing; "live within 7 days" stays (only if true).

### Design rules: structural redirection (the core of the job)

The problem is component anatomy and page rhythm, not colour. Keep EdWeb's existing 4-colour palette and brand identity. Change the structural DNA:

- Kill the card habit. No rounded, 1px-outlined, transparent-fill card as default container. Flat rows separated by whitespace or a single rule line instead
- Pricing: no 3-card grid with tick lists. Comparison table or full-width stacked rows. Features as plain text. Fixed prices where possible, short "not included" line per package
- Break the repeating section rhythm. No eyebrow/pill labels. Left-align headings. Vary layout per section: some two-column, some full-bleed, some plain text
- No numbered process blocks. Replace 01/02/03 with a real timeline using actual days (Day 1 brief, Day 3 preview link, Day 7 live). One continuous line with markers, not stacked chunks
- No sans headline with italic serif accent words, anywhere
- No monospace ALL CAPS letterspaced labels
- Contact: one flat form or a WhatsApp button. No multi-step builder, no progress bar
- Cut any founder quote / signature section. Two plain sentences about who builds the sites instead
- Pick one corner-and-border treatment that is not "large radius + thin border + transparent fill", apply consistently
- Proof everywhere. Real client screenshots (laptop/phone mockup frames from the existing mockup-generator), real turnaround days, real prices. Every section contains at least one thing a competitor could not copy without actually delivering it

### Copy rules

- British English
- No em dashes, ever
- No Oxford comma ("apples, pears and oranges")
- Short sentences. No corporate filler. Write like a person, not a pitch deck
- Cut any sentence that could appear on a competitor's site unchanged

### Technical rules

- Static HTML, CSS and vanilla JS only. No build tooling, no new dependencies
- Mobile-first responsiveness must not regress; verify 375 / 768 / 1280
- Keep EdWeb's existing colour palette (4 brand tokens + color-mix derivations only)
- Respect `redesign/script.js` shared hooks (grep before reusing any class name; `.faq-item` collision warning in project CLAUDE.md)

### Do not

- Do not refactor code beyond what the flagged changes require
- Do not touch the contact form endpoint: it is Vercel serverless `api/send-mail.js` (NOT PHP; `send-mail.php` is a legacy fallback copy). Leave form submission logic alone
- Do not invent client results, stats or testimonials. Missing proof = clearly marked TODO for Edgar

## Phase 3: Report

Before/after summary per section + short TODO list where real proof (numbers, case studies, screenshots) is needed from Edgar. Then site-reviewer pass per Website OS before calling it done.
