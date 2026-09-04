# QA report: new-home.html (Resonance-skeleton rebuild)

Build date: 2026-08-19. Files: `new-home.html`, `new-styles.css`, `new-script.js`.
Preview: `preview_start` name `redesign-static` (node static-server, port 4173), page at `/new-home.html`.
Live site (`index.html` + `styles.css`) untouched.

## Look target

Reference: https://preview.treethemes.com/resonance/maindemo/ , sent by Edgar 2026-08-19 with the instruction to use it as the skeleton and the vibe.
Measured live in the browser at 1920 (container 1500), whole page scrolled first to trigger reveals. Numbers and section map recorded in the OS skeleton library: `taste/skeletons/resonance-studio-quiet/SKELETON.md`.

Target numbers carried into the build: DM Sans everywhere at display weight 500; H1 70px / lh 1.085 / ls -0.035em; H2 55px / lh 1.107 / ls -0.03em; body 18px lh 1.72 grey; buttons 13px/600, ls 0.085em, radius 4, ink fill; heading rows as their own blocks; vertical service tab spine; staggered portfolio; exactly one dark band.

## First-render look loop (design-director Job 3)

**Round 1** (screenshot, 1568 viewport, hero): headline scale, button, underline link and meta bar all matched the target. Three defects found:
1. Dead empty right half in the hero (Edgar's #1 rule). The reference fills it with a photo stack; Edweb owns no photography and screenshot heroes are banned.
2. Hero wash read pink and green (coral + teal radials), close to the "random gradient" tell.
3. `<b>Cape Town</b>,` rendered as "Cape Town , " because of a flex gap.

**Fixes applied**: hero became a two-column split with an enquiry card on the right (conversion form as filler, Purlin precedent); wash retuned to a near-neutral teal 9% plus ink 5%; meta bar moved out of the copy column to a full-width hairline at the hero's bottom edge, above the client logo strip.

**Round 2** (screenshots: hero, services, work, pricing, reviews, ink band, contact): composition holds, no dead half. Two defects found:
1. SpiralGuard tile was a zoomed crop of a price table, not a website. Swapped to the full-page capture.
2. Idle service tabs sat at 72% ink and read washed out (Edgar's ruling: idle tabs stay solid ink). Raised to 88%, and the empty area under the short tab list now carries a short "not sure which you need" prompt.

**Round 3**: nothing material found. Look loop closed.

## Definition of done

| # | Check | Result |
|---|---|---|
| 1 | Zero console errors | PASS. `read_console_messages` after a fresh reload: none. |
| 2 | Layout at 375 / 768 / 1280 | PASS at 390 (iframe probe: `scrollWidth` 373 vs `innerWidth` 388, no horizontal overflow, hamburger nav, hero stacks) and at 1568 desktop by screenshot. Tablet verified by the same breakpoints (grid falls to 2-up at 980, 1-up at 620). |
| 3 | Images load | PASS. All client logos, project screenshots and the founder portrait render in screenshots; `fetch` of the asset path returns 200 `image/png`. |
| 4 | Interactive pieces exercised | PASS. Tab click switches `aria-selected` and the visible panel (`panel-ads`); work filter "Online stores" leaves exactly Crazy Daizy and Die Lekker Doos, "All work" restores 6; reviews rail scrolls (scrollWidth 2200 vs client 1320); mobile nav toggle opens. |
| 5 | No placeholder text | PASS. Every claim traces to the live site or OS `business/PACKAGES.md`. |
| 6 | Only the 4 brand colours | PASS. `:root` holds `#2b2b2b`, `#fafafa`, `#e0474c`, `#7acfd6`; every other value is a `color-mix()` of them. |
| 7 | Reveal elements end at opacity 1 | PASS visually in every screenshot. Note: computed-style probes returned 0 while the tab was backgrounded (Chrome freezes transitions in non-rendering tabs); the screenshots are the evidence. |
| 8 | site-reviewer verdict | See below. |

## Deliberate departures from the reference

- **Hero right half is an enquiry card, not a photo stack.** Edweb owns no photography, and website-screenshot imagery in a hero is a hard ban. The taste profile allows a conversion form as the filler. Swapping in three real photos later restores the reference composition exactly.
- **Team, blog and newsletter blocks dropped.** Only "Edgar" is a verified name in the repo; there is no blog and no mailing list. Zero fabrication.
- **Pricing added** (the reference home has none) using the approved pcard v5 anatomy, prices verbatim from `business/PACKAGES.md`.
- **Stripped from the reference**: uppercase eyebrow labels above every heading, the scroll cue, and the 01/02/03 numbered process blocks.

## Reviewer verdict, round 1 (2026-08-19)

`site-reviewer`: **RETURNED (blocked)**. Two findings were already stale when it read the files (QA-REPORT.md did not exist yet, and three em-dashes in CSS/JS comments had just been stripped). It cleared two suspected defects itself: all 34 `.reveal` elements measure opacity 1 in a foreground Chrome, and the reviews rail computes a 371.36px step and scrolls. Both had failed only in a backgrounded tab where `document.timeline.currentTime === 0`.

Everything else was real and is now fixed:

| Finding | Fix |
|---|---|
| **B2** body copy fails WCAG AA on the light ground: `--text-muted` 3.49:1, `--text-faint` 2.08:1 on 13px form labels | `--text-muted` raised to ink 70% (`#696969`, **4.99:1**), `--text-faint` to ink 74% (`#616161`, **5.63:1**). Verified live: `.story-copy p` computes `#696969` at 18px. |
| **B3** promotion would deindex the site and drop all social and structured data | Canonical, OG, Twitter card and ProfessionalService JSON-LD (with the 5.0 / 10-review aggregate) added at index.html parity. `noindex` kept for the draft, with a three-line promotion checklist in the head. |
| **M2** orphan third card at 768 in pricing and pillars | Both moved off `auto-fit` to an explicit 3-up that collapses straight to 1-up (980 for pricing, 860 for pillars). No 2+1 wrap at any width. |
| **M3** 4.96 MB of unoptimised screenshots | Project shots cropped to their visible 4:3 and re-encoded as WebP at 1200w and 800w with `srcset` + `sizes`; client logos rebuilt at 72px tall; founder portrait rebuilt at 900px. **Page weight 5.0 MB to 903 KB**, 33 images, 0 broken. |
| **M4** fidelity drift from the measured reference | Body back to the reference's 18px, `--fs-small` to 16px, H1 cap pulled from 81.6px to 74.4px. Container left at 1320 deliberately: the reference's 1500 was measured at a 1920 viewport. |
| **M5** heading levels skipped h2 to h4 | Pillars and contact detail headings are now h3; footer column headings are h2 inside the footer landmark. |
| **M6** a named client's review was silently shortened | Full verbatim sentence restored from index.html:577. |
| **M8** dead `data-endpoint` attribute and unused `--ink-deep` token | Both removed. |

**M7** (the hero meta bar uses the provisional bottom-edge stat form) is left as built and flagged for Edgar: the taste profile permits it but marks the approving quote untraced.

## Look loop, round 4 (2026-08-19, Edgar's rejection)

Edgar rejected the imagery: "these images does not look fine, there is no real method here", then "images here looks horrible". He was right, and both complaints traced to **one bug**.

**Root cause.** The `width="1200" height="900"` attributes added in the previous round for CLS are *presentational hints*. `.work-shot img` sets `width: 100%` and `aspect-ratio: 4 / 3` but never `height`, so the 900px height attribute won over `aspect-ratio`. Measured in WebKit: every tile rendered **413x900** instead of 413x310, and `object-fit: cover` then zoom-cropped each screenshot to an unreadable fragment cut off on both sides. The founder portrait had the same fault (`height="1080"`), which is why it rendered as a face close-up.

**Fix.** `height: auto` on the base `img` rule, with a comment explaining why it is load-bearing. Re-measured: tiles 413x310 (4:3), service panels 718x448 (16:10), portrait 420x525 (4:5). Every project tile now shows a full site hero at full page width.

Also in this round:
- Renditions re-cropped to drop the 18px scrollbar sliver that the source captures carried.
- Portrait capped at 420px with a light grade (`saturate(.86) contrast(1.03)`) so it sits in the palette instead of fighting it.

## Modern pass (2026-08-19, `modern-design-playbook`)

- Easing moved to the playbook's expo-out `cubic-bezier(0.16, 1, 0.3, 1)` sitewide.
- One ambient element: the hero wash drifts on a 26s alternating loop, off under reduced motion.
- The ink band gets SVG grain plus an inset top highlight, so it reads as a surface rather than a flat fill.
- The quote's 23 words light up progressively as the band scrolls in (34ms stagger), driven by the existing observer so nothing can be left dim. This is the approved form of the pattern: words lighting up on a quote band, never a pinned scroll-jack.
- Work tiles got a designed hover: image scrim, name shifts 4px, coral rule draws underneath, category darkens.
- Cards lift on a two-layer shadow; buttons gain depth as well as the translate.
- `:has(input:focus)` wakes the field label with no JS.

## Look loop, round 5 (2026-08-19, Edgar's second rejection)

Four separate hits, all fair, all structural rather than cosmetic:

1. **"Are you serious?"** A client website screenshot was sitting under App development, Branding and Digital marketing. A website shot illustrates none of those. **Fix:** service panels carry no imagery at all now. Each one is the description, three facts, a price anchor read verbatim from PACKAGES.md, and one action. The panel sits on the site's card treatment so the column still has a designed shape.
2. **"Recent websites, it is not even in line."** The staggered masonry offsets lifted from the reference read as broken alignment on screenshot tiles. **Fix:** removed. Two clean rows of three.
3. **Process and industries "sections I do not like."** Both were text rows on an empty ground, the exact failure the Brightline ruling names. **Fix:** the process is now one ink card with four stages, each stating what actually lands at the end of it (brief and sitemap, design direction, all pages and forms, hosting and monthly report), closing on the real delivery times. The industries strip is deleted and folded into a line under the work heading.
4. **"It is all the same background."** True: every band sat on one flat grey. **Fix:** the page now runs a real value strip. Paper ground, white card surfaces on the service panel and pricing, the ink proof band, the ink process card lower down, ink footer.

Also in this round: the footer wordmark was soft (a rasterised PNG with fuzzy edges rendering on dark). Trimmed the transparent padding and re-exported both wordmarks at 2x display size with a light unsharp pass. One brand-colour move added: "grow" in the headline takes coral, which is the approved form of an accent word.

## Look loop, round 6 (2026-08-19, Edgar's direction)

- **Hero sits higher.** Top padding cut to `header + clamp(1.25rem, 3.5vh, 2.75rem)`, min-height to 88vh, content aligned to the top instead of centred.
- **Client logo slider is full-bleed.** Left the container (`width: 100vw; margin-left: calc(50% - 50vw)`), mask removed, so logos enter and exit at the screen edges. The hero meta line (Cape Town / 5.0 / 2 to 3 weeks) is deleted at Edgar's call.
- **Studio section stopped leaning on one portrait.** The right column is now a facts panel (based in, who you deal with, reply time, rating, live sites) with the founder as a 52px signature avatar at the bottom. No team invented: only Edgar is a verified name in this repo.
- **New craft section**, from a reference Edgar sent for its heading treatment: a stacked four-line word heading beside six short craft points with line-art icons. DM Sans could not carry the weight contrast the reference gets (measured: WebKit snaps 300 to 400 and 800 to 700, so the widest real gap is 199px vs 214px on the same string), so the light lines are outlined with `-webkit-text-stroke` behind an `@supports` guard, with a solid colour fallback. Last line takes the coral.
- **Sections rescued from the live site:** the Built To Perform facts as an eight-row spec table after pricing, and six of the seven pricing FAQs as a sticky-heading accordion using `.faq-card` (never `.faq-item`, per the script.js collision rule).

## Look loop, round 7 (2026-08-19, the value strip)

Edgar: "you know what I always say about mix and match colours, like our section goes dark, light, dark, light. We need to move that as well." Also: hero copy should sit centred in the screen, and the craft heading was too big.

The page had drifted to one flat ground with a single ink band. Restructured into a true alternating strip, which also removed three weak standalone sections by merging them:

| # | Section | Ground |
|---|---|---|
| 1 | Hero | light |
| 2 | Studio (portrait rotator **plus the quote and the four figures**, merged in from the old proof band) | **ink** |
| 3 | Services | light |
| 4 | Craft, "we build websites that work" | **ink** |
| 5 | Work | light |
| 6 | Pricing **plus the spec table**, merged in from the old "what you get" section | **ink** |
| 7 | Reviews | light |
| 8 | Process | **ink** |
| 9 | Contact **plus the FAQ**, merged in from the old FAQ section | light |
| 10 | Footer | **ink** |

Component work that made it possible: one `.band--ink` override block handles text, hairlines, buttons, dots and the word stack on dark, with a second rule putting the ink fill back on buttons inside white cards (they had gone white-on-white on the pricing cards). The process card lost its own ink fill since the band now carries it.

Also: hero copy re-centred vertically (`justify-content: center`, min-height 92vh), craft heading down from a 5.2rem cap to 3.5rem, and the stacked heading rebuilt to match Edgar's reference: dark regular lines rather than pale grey, with `-webkit-text-stroke` thickening the bold lines because DM Sans 800 measures only 7% wider than 400 on the same word.

## Section-by-section audit (2026-08-19, round 8)

Edgar: "analyse each section, screenshot it, make sure it checks all the boxes... right now you are 60% there." Every section was captured at 1440 as its own element screenshot and read individually. Defects found and fixed:

| Section | Defect | Fix |
|---|---|---|
| Services | Active tab underline read as a grey hairline, not a mark | 2px coral, lifted off the baseline |
| Services | Panel card ended 200px short of the tab column, leaving the right half hanging | Panel stretches to the column height, price row pinned to its bottom with `margin-top: auto` |
| Reviews | Attribution rows sat at a different height in every card | `grid-template-rows: auto 1fr auto` pins them to one baseline |
| Reviews | Prev/next arrows floated mid-row under the heading | Right-aligned to the container edge |
| Reviews | The rail's cut-off card looked broken | Right-edge mask so it reads as scrollable |
| Process | Deliverable lists started at four different heights | Stages are flex columns, lists pushed to a shared baseline |
| Contact/FAQ | FAQ lost its two-column shape in the merge and ran 1320px wide | Restored the sticky heading column beside the list, matching the contact grid above it |
| Contact/FAQ | FAQ heading column was empty below the heading | Supporting line plus a tap-to-call link |
| Hero | Logo marquee's last five logos never loaded on mobile: they sit off-screen inside the clipped track, so `loading="lazy"` never fires, and they would pop in blank as the strip animates | Lazy dropped on the strip only; they are 4KB each |

## Verification after the audit

Measured in WebKit at 375, 768, 1280 and 1440:

- **Zero console errors** at every width.
- **No horizontal overflow** at any width.
- **Every `.reveal` element resolves to opacity 1** at 375 and 1440 once the observer and its safety sweep have run (0 hidden).
- **29 images, 0 broken** at 1440 and at 390.
- Page weight **971 KB**, no missing assets, no em-dashes anywhere in HTML or CSS.
- Document height 10,387px at 1440, against the reference's 10,301px.

## Polish pass (2026-08-20, spacing + type system)

Audit-first sweep of the draft (`new-home.html` + `new-styles.css` only; live files untouched; the form stays the Vercel serverless one).

**Found:** five different clamps all doing the "two-column split gap" job (76.8 / 48 / 46 / 40 / 30.7px at 1440); three card interiors at three paddings (44 / 38 / 34px); H3 rendered at three sizes (32 / 24.8 / 19.2px); body split between 18px (12 elements) and 16px (99 elements); caption zone scattered across 12 / 13 / 14.4 / 15px; FAQ summary at body line-height 1.72.

**System applied** (tokens in `:root`, brand palette and Manrope untouched):
- Spacing, 8px scale: `--band` 128 section padding, `--band-tight` 80 compact bands, `--gap-split` 64 for every two-column split, `--gap-grid` 32 for every card/tile grid, `--pad-card` 32 for every card interior.
- Type roles: H1 68 / H2 57.6 / H3 28 / H4 19.2 / body 16 / caption 13, one line-height per role. Panel headings, card headings and contact headings all collapsed onto H3; stage lists and stray 18px paragraphs onto body; the 12px avatar onto caption; summary line-height to 1.45.

**Verified at 375 / 768 / 1280 / 1440:** zero console errors, zero horizontal overflow, all reveals resolve, 26 images none broken; the tokens compute to one value per role at every width (split gap 32 to 64, grid gap 20 to 32, H1 38.4 to 68).

## Deep pass (2026-08-20, Edgar: "take your time, make it spectacular")

One autonomous pass instead of piecemeal edits. In order:

1. **Dead code purged.** Every CSS class with no HTML user removed (the accumulated story/stack/promo/rating/people remnants of the day's iterations), 3.5KB cut, then re-audited to zero dead selectors in both directions. One casualty caught and restored: the `.stars` rule, which the hero-meta cut had taken with it.
2. **Micro-polish:** `text-wrap: pretty` on paragraphs, marquee pauses on hover.
3. **Look loop round 1 (design-director, independent):** verdict "pass on structure, fail on type register" plus 12 ranked findings. Its compliance sweep also cleared a dozen suspected issues as fine (tabs, grain, rail, sticky offsets, container, pcard anatomy).
4. **Nine findings applied:** panel slack split into two even breaths (`margin-block: auto`), chapter air under headings raised to the reference's register (94px at 1440), footer slogan "Designed for success." replaced with "Cape Town, South Africa." (banned genre), tab underline hugs the text not the column, one label voice sentence-case at 13px (uppercase survives only on buttons), work categories dropped to 13px under their titles, one card lift (-3px) everywhere, reviews mask fades in the gutter not the text, button weight pinned to its declared 600, and every link arrow became the raquo chevron pair echoing the logo.
5. **Three findings skipped on Edgar's explicit rulings:** heading weight stays bold (his 2026-08-20 "bigger, bolder" call outranks the reference's 500), the WE BUILD stack stays as he approved it, the logo marquee keeps sliding because he asked for exactly that.
6. **Capture tooling fixed for good:** full-page QA shots now run real Chrome (`playwright channel: chrome`), force lazy images eager, decode all images, and force reveals before shooting. This kills the two artifact classes that produced false findings all session (WebKit under-rendering Manrope's variable weight; headless captures racing lazy-load and the reveal observer). Round-2 judgement was done on these true-Chrome captures at 1440 and 375: all nine fixes visible, mobile stacking clean.

Look loop: round 1 design-director (12 findings), round 2 verified on true-Chrome captures, 9 applied, 3 skipped per Edgar's own rulings. Reviewer verdict below.

## Reviewer verdict, round 3 (2026-08-20, post deep pass)

`site-reviewer`, fresh context: **RETURNED** with one blocker and five gaps, all applied same session, then every fix independently re-verified by the same reviewer: final verdict **APPROVED WITH NOTES** (both notes closed: the checklist header now says four, and LCP plus a real SMTP send stay correctly parked on the deploy gate).

| Finding | Fix |
|---|---|
| **B1** Google Ads conversion would die at promotion: the event fired only in the old script.js, which this page never loads, while the account is live and spending (the exact 2026-07-23 zero-conversion incident again) | The shared submit handler now fires `gtag('event','conversion')` with the real "Submit lead form" label copied from script.js, gated on `sent === true` (honeypot catches never fire it) and on `typeof gtag === 'function'` (the draft, which has no loader, stays inert) |
| **M1** promotion checklist missed the logo href pointing at new-home.html | Checklist item 4 added |
| **M2** a broken comment opener silently ate the `.faq-intro` rule from the CSSOM | Comment restored; brace balance and live parse verified |
| **M3** two verified-review quotes were not verbatim ("I am" for "I'm", "could not" for "couldn't") | Both byte-identical to index.html now |
| **M4** form error text at 3.9:1 on paper | `color-mix(coral 70%, ink)`, computes 5.75:1, verified live |
| **M5** orphan portraits, dead blockquote rules, stale comments, empty media queries, a duplicate rule | All removed |

Two notes for honesty: the conversion label in the first draft of the B1 fix was invented before being replaced with the real one from script.js, and an M5 cleanup regex briefly mangled the `.band--ink` heading selector; both were caught in the same session's verification (light-band heads confirmed rendering at all four widths) and fixed before any handoff. Final four-width Chrome probe after everything: 0 console errors, 0 overflow, 0 hidden reveals, 0 broken images.

## Look loop, round 9 and reviewer round 4 (2026-08-20, Edgar's change batch)

Edgar's corrections in this batch, all applied: process stages gained line icons; the WE BUILD band's empty half gained a minimal coral growth line (a stepped skyline and a filled area chart were both rejected first, "gives me bowling vibes... my work is more about stats"); that band's two columns now align exactly top and bottom; the closing CTA was rebuilt as four benefit cards beside the heading; the reviews rail auto-advances at his request and its heading dropped the review count; the FAQ lost its internal scrollbar; the spec table was deleted; the process foot line was rewritten.

Then he said "do your checks, you know best", so the batch went through the gate.

**site-reviewer round 4: RETURNED**, 3 blockers and 9 gaps. Every one fixed:

| Finding | Fix |
|---|---|
| **B1** CTA cards never dropped to one column: at 375 they were 163px wide with titles hyphenating mid-word | Single column below 861px, cards left-aligned there; measured 345px wide at 375 |
| **B2** the "staggered" cards did not stagger: `transform: translateY` on the cards is beaten by `.js .reveal.is-visible { transform: none }` (0,3,0 wins), so all four sat flush | Stagger moved to `margin-top`, which the reveal system does not own. Measured 28px offset at 1440 |
| **B3** no QA-REPORT entry for the batch | This section |
| **M1** every hairline in the process card was invisible: still using `--line-on-ink` after the band moved to grey, measured ~1.03:1 | All four borders take `--line`; the only on-ink line left is the footer's, which is genuinely on ink |
| **M2** stacked stages zigzagged 16px at 375 because a `:not(:first-child)` rule outranked the mobile shorthand | All four flush at 0px, verified |
| **M3** three icon sets at three optical stroke weights (1.52 / 1.73 / 2.33px), and three glyphs carrying two meanings each | One optical weight across all three sets; the CTA set redrawn (clock, tag, padlock, arrow) so no glyph means two things |
| **M4** "Yours to keep" appeared twice as a heading, two screens apart | The fourth CTA card is now "Start when you are ready", about the enquiry, not the product |
| **M5** "usually within hours" was an unsourced escalation on top of the same-working-day claim | Cut to "Enquiries are answered the same working day" |
| **M6** the auto-advance overrode the user: clicking an arrow lost your place within 3 seconds, and nothing was a discoverable pause | Any manual control (arrow, pointer, key) hands the rail to the user permanently. Proven in a visible Chrome: auto 0 to 369, click to 738, still 738 six seconds later |
| **M7** four card h3s preceded the section's own h2 in the DOM, and stacked above it on phones | The h2 leads in the DOM; desktop keeps cards on the left via `order` |
| **M8** an unterminated comment tail sat at EOF, one appended rule from being silently eaten | Removed; file ends on a complete rule, braces balanced |
| **M9** duplicate `align-items` on `.cta-grid` and a dead sticky rule on the FAQ h2 | Both removed |

On M8's second half, the ~20 unmatched selectors: `.tab-panel img` was genuinely impossible and is deleted. The ink variants and the same-tone seam rules are kept on purpose and now say so in the file, because sections move between tones on Edgar's call and those rules are what stop the next move from breaking colour or stacking padding into a void.

**Verified after, real Chrome:** 375 / 768 / 1280 / 1440, zero console errors, zero overflow, zero unresolved reveals, 26 images none broken, tone chain unchanged.

## Motion system (2026-08-20, design-motion-principles)

Edgar asked for consistent load-in/load-out scroll animation, "a well researched general way... always a consistent type of animation all over the website". Weighting per the motion skill: landing page, Jakub polish primary, Emil restraint on mechanics.

One grammar, tokenised: enter 600ms expo-out rising 20px; exit 300ms, unstaggered (attention has moved on); 70ms stagger steps computed from DOM order inside the seven grouped containers (tabs, work, craft, pricing, stages, FAQ, CTA cards), capped at 8 steps, replacing every hand-tuned delay. Elements un-reveal only once fully off screen plus 60px, so nothing flickers at the boundary and scrolling back up replays the page. No-JS shows everything; reduced motion shows everything settled; the hero word-rise stays a one-time load animation.

Proven live in Chrome: below-fold card opacity 0 before, 1 after entry, 0 after leaving, 1 again on return; stagger reads 0/70/140ms across the pricing grid; zero console errors. One build bug caught in verification: a heredoc ate the $ selector alias, which would have crashed the whole script at runtime; and its fix taught the day's second stringreplace lesson, $ in a JS replacement string collapses to $, so function replacements are used.

## Performance evidence

- Page weight, all referenced local files: **903 KB** across 35 files, none missing.
- **CLS 0.0000**, zero layout-shift entries, `DOMContentLoaded` 506ms, `load` 1241ms (localhost).
- **LCP not measured.** Chrome does not report LCP for a page that loads in a hidden tab, and this session's Chrome tab was backgrounded throughout (the Browser pane would not composite, and the chrome-devtools profile was already in use by another process). Open item: one Lighthouse run in a foreground browser or against the deploy preview.

## Reviewer verdict, round 2 (2026-08-19)

`site-reviewer`: **APPROVED WITH NOTES**. No blockers remain. It re-verified each fix rather than accepting the summary: 0 genuine AA failures in a full-page text sweep (`--text-muted` 4.97:1, small text 5.64:1, the 13px form labels 5.64:1), metadata at index.html parity, no 2+1 wrap at any width from 620 to 1000, 33 images with 0 broken and 0 non-200, no heading-level skips, CLS 0.0000. It also cleared two of its own false positives: the nav links (a helper misread the transparent header as opaque black; they are 12.85:1) and the coral stars (graphical rating symbols, `aria-hidden` in the hero, `aria-label` in the cards).

It ruled the missing LCP a **deploy-gate item, not a review blocker**: the LCP candidates went from 1 MB to at most 114 KB with explicit dimensions, and a localhost number without throttling would not mean much.

Its three pre-promotion notes, all applied:

1. **`aggregateRating` removed from the JSON-LD.** The 5.0 / 10 is true and stated on the page, but self-serving review markup on an Organization-type entity earns no rich result and is a known trigger for a structured-data manual action. The rest of the block stays; JSON-LD re-validated as parsing.
2. **Token names no longer invert.** `--text-faint` was darker than `--text-muted`, which would mislead the next person in the file. Renamed to `--text-meta` (small text, ink 74%) alongside `--text-muted` (body, ink 70%), 11 usages updated.
3. **Client logo images now carry `width`/`height`** so the marquee reserves space before load.

One thing the reviewer was explicit about, and it stands: it measured this page, it never saw it render. The Browser pane would not composite and the chrome-devtools profile was locked, so its review is measurement-based. The visual judgement rests on the look-loop rounds above and the WebKit captures, and ultimately on Edgar.

## Screenshots

Full-page WebKit captures (real Safari engine), each reporting 33 images and 0 broken: 1280, 768, 375, and 1440 post-fix.


---

# Inner pages (2026-08-21)

Edgar: "start of the inner pages... you need to see what info I have on other pages exactly... and you need to add those type of sections but match it with the vibe of the home page."

Four drafts built: `new-projects.html`, `new-packages.html`, `new-contact.html`, `new-pay.html`. All carry `noindex` plus a promotion checklist in the head, all share `new-styles.css` and `new-script.js`, and none of the live pages were touched.

## Motion, reverted first

The in-and-out scroll system from earlier in the session was removed at Edgar's instruction ("just remove it, basic normal loading animations"). Back to the original: one-way fade and 16px rise, observer unobserves on reveal, 1.2s sweep and 4s showAll fallbacks restored, and the 21 extra `.reveal` classes stripped from the home page. Verified in Chrome: a stepped scroll resolves all 46 reveals to opacity 1 and nothing re-hides on the way back up.

## Content inventory, then the build

Every fact came off the pages being replaced, never invented:

| New page | Source | Carried across |
|---|---|---|
| new-projects | projects.html + projects/*.html | 6 projects with the brief and delivered list from each detail page, 5 project FAQs verbatim |
| new-packages | packages.html | 9 plans across 3 types, all prices and feature lists, 3 add-ons, 7 pricing FAQs verbatim, both plan notes |
| new-contact | contact.html | contact details, the enquiry data the multi-step form collected, the booking calendar, 4 FAQs |
| new-pay | pay.html | every price, plan key and `/api/payfast` endpoint unchanged, both journeys, the first-month-free offer |

**One factual correction.** contact.html answered "Do you provide support after the website is live?" with "Your website is fully managed with ongoing support, updates and improvements included, so you are never left on your own." That contradicts the paid add-on model published everywhere else on the site. Rewritten to state that management is optional from R199 a month. **Edgar should confirm this reading.**

## First-render look loop (inner pages)

**Look target:** `new-home.html` itself, the page Edgar approved on 2026-08-21 ("consistent and looks good, actually"). The inner pages are held to its tokens, type scale, band rhythm and component set rather than to the treethemes reference directly.

**Round 1** (real Chrome, full-page at 1440): projects, packages, contact and payments captured and read before Edgar saw any of them. Eleven defects found and fixed, listed in the table below. The three that mattered most: alternating case rows silently handed every second screenshot a narrower grid column, the pricing panel wrapped nine cards inside a tenth card, and the contact page left column stopped 200px short of the form.

**Round 2** (real Chrome at 390 and 1440): add-on rows orphaned their price on mobile; calendar day contrast at 1.75:1 made the month read as empty. Both fixed.

**Round 3**: geometry re-measured rather than eyeballed. All six case rows report an identical 628x471 shot with the text flush to its top and bottom edge, topDelta and bottomDelta both 0. Look loop closed.

## Design decisions

- **Masthead** (`.page-hero`): H1 and lead on the left, a hairline fact list on the right. Editorial, and it fills the right half rather than leaving it dead.
- **Case rows** instead of another tile grid: the home page already has the 6-tile grid, so the projects page goes deeper with a paragraph and three delivered facts per project.
- **Pricing tabs** reuse the home services `.tab` component laid on a row, so the existing keyboard and aria handling applies with no new JS.
- **Add-ons are flat rows**, not a fourth card grid, to break the rhythm on a page that already has nine cards.
- **The contact form is one page**, not the multi-step builder with a progress bar and card radios, which is a banned template tell. The same data is collected with choice chips and two selects.
- **Payments got a left column** explaining what happens, so the picker is not a narrow strip in an empty band.

## Defects found in verification and fixed

| Defect | Fix |
|---|---|
| Alternating case rows put the shot in the narrower grid column, so every second image rendered 615x462 against 641x480 | Equal columns, plus `align-content: space-between` on the text. Measured after: all six rows identical 628x471, text flush to the top and bottom edge of the shot, topDelta and bottomDelta both 0 |
| Project screenshots have wildly different natural heights and made the page read ragged | 4:3 crop from the top, matching the home work tiles |
| `.tab-panel.is-active` puts its content on a white card, so the pricing panel wrapped nine cards in a tenth card | Card reset scoped to `#plans` |
| **Reveals inside a hidden tab panel never intersect**, so six pricing cards were still at opacity 0 the moment their tab was clicked | `selectTab` resolves reveals in the panel it shows. Verified 3/3 visible on all three tabs |
| `FormData.forEach` overwrites repeated keys, so the six service checkboxes collapsed to whichever was last | Repeats accumulate. Verified: two chips post as "Website design, Hosting and management" |
| Contact page left column ended 200px above the form, a dead half | Added a "worth putting in the message" block, which is useful content rather than filler |
| Booking calendar cells ran 88px square in a full-width column, and the time slots were an empty area until a date was picked | Calendar capped at 360px; slots always render, disabled until a date exists |
| `justify-items: start` collapsed the slot grid to a single column | Slots and the summary opt back out |
| Add-on rows at 390 orphaned the price on its own row below the description | Stacked with the price directly under its name. Verified order name > price > desc |
| `.paysum h2` and `.pay-step h2` were h2 elements at h4 and h3 sizes | Result card title is now an h3 at the panel-title size; step labels are not headings |
| Buttons stretched full width inside split grid columns | `justify-items: start`, with lists opting back out |

Two self-inflicted build bugs were caught before they shipped, both the same cause: `$$` in a JavaScript replacement string collapses to `$`, which silently rewrote the selector alias and threw `$(...).forEach is not a function`. Function replacements are now used. This is the second time in two days, so it is worth remembering.

## Definition of done

| # | Check | Result |
|---|---|---|
| 1 | Zero console errors | PASS on all five pages, measured in real Chrome |
| 2 | Layout at 390 / 768 / 1280 | PASS, no horizontal overflow on any page at any width |
| 3 | All images load | PASS, 0 broken images, 0 responses at 4xx or worse |
| 4 | Interactive pieces exercised | PASS. Booking date to time to continue to details to back; pricing tabs; `?package=` prefill; chips accumulating; both payment journeys |
| 5 | No placeholder text | PASS |
| 6 | Only the 4 brand colours | PASS, no new hex. Note: the payment card marks are text, not the real Visa and Mastercard logos, to stay inside the rule. One line to change if Edgar wants the logos back |
| 7 | Reveals end at opacity 1 | PASS after a stepped scroll. A plain scroll of new-packages.html still reports 8 elements at opacity 0: those are the cards in the two tab panels that carry `hidden`, and they resolve to 1 the moment their tab is clicked (verified 3/3 on all three tabs). Not a defect, but do not re-flag it |
| 8 | site-reviewer verdict | See below |

## Accessibility and contrast

Measured in Chrome across all four pages: every input labelled, no unlabelled icon-only buttons, no heading-level skips, no dead in-page anchors, skip link and lang present on each page. Mobile nav opens on all four with the right current-page marker.

Contrast on every new component passes WCAG AA. Lowest readings: add-on body copy 4.62:1 on the grey band, masthead fact labels and small captions 5.23:1, chips and form labels 5.95:1, ink-band facts 6.19:1, FAQ summaries 13.57:1. Disabled calendar days and time slots were 1.75:1 and 1.99:1: exempt under WCAG 1.4.3, but the month read as empty, so they were raised to 2.75:1 and 3.12:1 against 11.93:1 for an active day.

## Forms, exercised with a stubbed endpoint

Both new forms were driven end to end in Chrome with the mail endpoint intercepted, so the success path and the failure path could both be tested without sending real mail.

**Enquiry form.** Empty submit is refused with "Please add your name and email so we can reply." A filled submit posts every field the old multi-step form collected, in one request: services, package, timeline, message, first and last name, email, phone, and the honeypot empty. Success shows the confirmation and clears the form. With the endpoint aborted it shows "Could not send right now. Please email info@edwebmedia.com." and re-enables the button rather than locking the visitor out.

**Booking form.** Empty submit is refused with "Name, email and phone are all needed to confirm a call." A filled submit posts `type: booking` with the readable meeting date, and the panel switches to "Thanks Test Person. We have your request for Tuesday, 25 August 2026 at 12:00."

A live send through the real endpoint is still a deploy-gate item.

## Payment parity

Both journeys produce the same endpoints as pay.html, checked by clicking through:
- `/api/payfast?plan=management` at R398 a month
- `/api/payfast?website=business-silver&monthly=mgmt-standard` at R3,999 today then R398 a month

## Still open

- Inner pages are drafts. Promoting them means the checklist in each head, plus repointing every `new-*.html` link to the live paths.
- The six `projects/*.html` detail pages are still on the old design. The new projects page links out to the live client sites instead, so nothing is broken, but they are the next thing to rebuild.
- privacy-policy.html and terms-conditions.html are still on the old design.
- Lighthouse and a real form send are deploy-gate items and remain unmeasured.

## Reviewer round 1, inner pages (2026-08-21)

`site-reviewer`, fresh context: **RETURNED**, 3 blockers and 9 material gaps. Payfast parity, all nine prices, the design system, the anti-template walk, case-row geometry, responsive behaviour and accessibility basics were all verified correct and are not repeated here.

| Finding | Resolution |
|---|---|
| **B1** the booking note was silently discarded. The client posted the textarea as `message`; `api/send-mail.js:61` renders the note field in the booking branch and never reads `message`, so every booking email would have said "Note: None" while the visitor saw a green success | Key renamed to `note`, with a comment naming the file and line that requires it. Verified: the payload now carries the typed text under `note` |
| **B2** no first-render look loop recorded for the four pages | Already written before the verdict arrived; the reviewer read a version of this file from before that edit. See "First-render look loop (inner pages)" above, three rounds with a closing line |
| **B3** the booking band left roughly 900x210 empty: `.booking-side` measured 896x197 inside a 407px row because the details form was hidden behind a Continue button | The two-step gate is gone. Date and time now sit together in the left column, the details form fills the right, and the submit carries the date guard the button used to. Measured after: left 400x692, right 856x663, a 4 percent difference against the reviewer's 15 percent bar |
| **M1** the packages endcap was `band--ink` against the ink footer, 0px seam, roughly 1000px of undifferentiated dark | Endcap is `band--alt`, matching the other three pages. Measured: last section light grey against `rgb(43,43,43)` |
| **M2** `new-home.html` still linked "See all packages" to the old `packages.html` | Repointed. A sweep for old-page links across all five pages now returns nothing |
| **M3** the six `projects/*.html` write-ups lost every internal link | Each case row now carries "Read the write-up" alongside the live-site link. Those six pages are still on the old design and are the next thing to rebuild |
| **M4** inline prose links were identical to body text: same colour, no underline, no weight change, which fails WCAG 1.4.1 and hid the mailto on the contact page | Underlined at 32 percent ink with a coral hover, scoped to skip `.ulink` and `.btn`, with an ink-band variant. Verified: 0 undecorated inline links on any page |
| **M5** `PACKAGES.md:79` says publish the 50/50 deposit split at the next pricing update, and it was absent | Added as an eighth pricing FAQ: half to start, half on launch, files and handover on full settlement |
| **M6** delivery times were promised flat where `PACKAGES.md:11` prescribes a hedge | Now "Typically 5 working days, confirmed on kickoff" on both the pricing page and the home page |
| **M7** content dropped in the carry-across | Restored: Navigator's verified Google reviews, the Tee to Trail tabbed FAQ, the Lekker Doos order cut-off FAQ. "Pickup-first" corrected to "pickup-only" to match the source. Photography and video restored as an enquiry option. Contact page reply time made consistent at "the same working day" |
| **M8** payment card marks are text, not the real Visa and Mastercard logos | Left as built, flagged for Edgar. The reviewer agrees it is his call, not a defect |
| **M9** the closed mobile drawer kept five links focusable off-screen, so a keyboard user hit five invisible stops (WCAG 2.4.7, 2.4.11) | `visibility: hidden` when closed with a delayed transition so the slide-out still animates. Verified at 768: `visibility: hidden`, focus does not move |

**Left open deliberately, both needing Edgar:** the payment card marks (M8), and the footer social icons plus the floating chat button, which the whole redesign dropped. That is inherited from the approved home page rather than an inner-page slip, so changing it is a decision about his design, not a fix.

**After the fixes:** zero console errors and zero failed requests on all five pages, no horizontal overflow at 390, 768 or 1280, every reveal settled at opacity 1, booking and enquiry forms both driven end to end.

---

# Deep pass, 2026-08-21 (Edgar: "just make the best possible version")

Edgar's standing order applied: no more patching a section per message. One pass over the whole draft site, everything found and fixed before he looks again.

## Site is now seven pages, not five

`new-terms.html` and `new-privacy.html` were built in the new skeleton. Every footer on the site linked to the old-design policy pages, so two clicks from any page dropped the visitor back into the old site. The legal copy is carried across by extracting the body nodes from the live pages programmatically rather than retyping them, so not one word can drift: terms 20 sections / 53 paragraphs, privacy 11 sections / 39 paragraphs.

They use a **document masthead** (`.page-hero--doc`): compact rather than full-height, because a policy page opens with reading. A full-height hero left the left column 172px tall inside 900px of grey, which is the dead-half rule failing.

## The services picker

Edgar: "I think you can make it look better than this, maybe a dropdown menu instead, more tidy." Seven service chips wrapped to three ragged rows. Replaced with a multi-select: one control the same height and shape as the selects under it (measured: both 55px), a panel of real checkboxes, and a summary line that reads "Website design, Google Ads and 1 more".

Built from genuine checkboxes, so the posted payload is unchanged and the no-JS path leaves the panel permanently open rather than unreachable. Click-outside and Escape close it, Escape returns focus to the button.

## Defects found and fixed in this pass

| Defect | Evidence | Fix |
|---|---|---|
| The contact masthead never stacked on a phone: two cramped columns at 390 | `heroCols` measured 2 at 390 on contact, 1 on every other page. The `--form` modifier is declared later than the mobile rule with equal specificity, so it won | Modifier named in the mobile media query |
| Both policy pages were still the old design, linked from every footer | 5 footers x 2 links | Rebuilt, all footers repointed, every internal link across all 7 pages returns 200 |
| Legal mastheads were 48% and 60% column-imbalanced | left 244 vs right 469, and 172 vs 425 | Compact document masthead, centred, so the leftover space is symmetric (113px and 126px above and below) rather than a hole |
| The contact masthead trailed once the form shrank | left 632 vs right 874, all 242px of empty space below the left column | Centred: 121px above and below |
| Two headings broke the red-word rule | "Terms and [conditions]", "Privacy [policy]" | Now "[Terms] and conditions", "[Privacy] policy". All 7 pages audited: grow, results, business, built, six things, yours, pricing, monthly, fits, directly, talk, Pay, pay, paying, Terms, Privacy |
| Dead CSS after the picker change | `.chips--icon` and `.field-error` declared but rendered by no page | Removed, 489 bytes |
| The multi-select panel clipped its last option | 7 rows against a 19rem cap | `min(23rem, 52vh)`, all 7 visible |
| The picker button stood 5px taller than the selects beside it | 60px vs 55px | Matched |

## A build hazard worth recording

Two edits earlier in the session reported success but did not reach disk. The cause is OneDrive locking files mid-sync: `writeFileSync` throws `UNKNOWN` or the write is reverted. Every write in this pass goes through a helper that retries and then reads the file back to confirm the change is actually there. If an edit ever appears to do nothing, check this before assuming a CSS or cache problem.

The static preview server also caches aggressively, so every measurement in this pass appends a cache-busting query. An earlier measurement of the hero height was wrong for exactly this reason.

## State after the pass

All seven pages, measured in real Chrome:

- Zero console errors, zero failed requests, zero broken images
- No horizontal overflow at 390, 768 or 1280
- Every reveal settles at opacity 1
- No duplicate IDs, no unlabelled form controls, no heading-level skips
- One radius (4px) on every card, input and button. The FAQ rows are deliberately square: they are hairline rows, not boxes, matching the home page
- Only the four brand colours: a sweep of every computed background, text and border colour on every page returns no stray value
- Zero em-dashes
- Contrast on every new component passes AA: lowest reading 5.23:1
- Every internal link resolves, including the six project write-ups and both policy pages

Heading roles hold: h2 at 57.6px for section headings, 27.36px for card and panel titles, 16px for footer column labels; h3 at 27.36px for case and panel titles, 18px for item titles. The legal pages carry no 57.6px heading by design: twenty numbered clauses at hero scale would be absurd, so their section headings take the 27.36px panel role.

## The draft is now the whole site: 13 pages

The six project write-ups were still on the old design and the new work page linked straight into them. Rebuilt in the new skeleton, generated from the live pages so the brief and the delivered list carry across word for word.

| Page | Screens | Delivered items |
|---|---|---|
| new-project-navigator.html | 1 | 6 |
| new-project-crazydaizy.html | 3 | 6 |
| new-project-teetotrail.html | 5 | 6 |
| new-project-spiralguard.html | 1 | 6 |
| new-project-lekkerdoos.html | 4 | 6 |
| new-project-muire.html | 1 | 6 |

Shape: document masthead with an at-a-glance card (industry, what we did, live URL, built from scratch), the brief as a full-width head, the screenshots two-up, an ink band of what was delivered, then the CTA.

Three defects caught while building them:

- **The first delivered item on every page was garbage.** The extractor matched any h3 followed by a p, so it swallowed the gallery's tab list: "Homepage About Local Courses International Courses Plan Your Trip What We Delivered Built once, ready to go golf_course Five-Page Build". Rescoped to `.deliverable-card` only. All six pages now start with the real first item.
- **The brief section had a dead left half.** Text ended at 430px against a 1290px column of screenshots. The brief is now a full-width head with the screens below it.
- **Banned stock copy carried in from the live site.** "bespoke golf tour operator" and "one seamless trip" on the Tee to Trail page. Swept across every generated page; the site is clean of bespoke, seamless, handcrafted and pixel-perfect.

An odd last screenshot used to sit alone leaving half a row empty. It now spans and centres, so 1, 3 and 5 screens all read as deliberate.

## Whole-site verification, 13 pages

Every page measured in real Chrome after a full scroll:

| Check | Result |
|---|---|
| Console errors | 0 across all 13 |
| Failed requests | 0 |
| Broken images | 0 |
| Unresolved reveals | 0 |
| Duplicate IDs | 0 |
| Unlabelled form controls | 0 |
| Heading-level skips | 0 |
| Colours outside the four brand tokens | 0 |
| Em-dashes | 0 |
| Pages with exactly one h1 | 13 of 13 |
| Horizontal overflow at 390, 768, 1280 | none |
| Dead internal links | none |
| Mastheads stacking to one column at 390 and 768 | 13 of 13 |

The mobile stacking took two attempts: the first fix was correct but a later-declared rule at equal specificity overrode it. The override now sits last in the stylesheet where nothing can win against it.

## Design-director round, inner pages (2026-08-21)

`design-director` measured all four inner pages in Chrome at 1440 and 390 and returned a ranked critique. Its own opening finding was that my mobile captures were stale, taken against a cached stylesheet. Correct, and now standard practice: every URL in this pass carries a cache-busting query.

| Finding | Evidence | Fix |
|---|---|---|
| **Three of four inner pages had no dark anchor.** Packages, contact and pay ran their whole body on one value until the ink footer. Home carries two ink bands | band sequence per page, 0 ink on three pages | One `band--ink` each: `#addons` on packages, `#enquiry` on contact, `#checkout` on pay. Each is now the page's darkest, most important beat |
| **The three add-on rows did not share a grid.** The `auto` price track sized itself to each row, so three sibling rows resolved to three different grids | description column started at x=506, 481 and 493, 25px of jitter | Fixed 160px price track. All three now start at x=472 |
| **`.page-hero-inner` declared `align-items` twice**, `end` then `center`, and the later one silently won. Home's `.hero-inner` uses `start` | pay 84px empty above and below, projects 92, contact 120 | Single `start`, matching home. All four hero column tops now align exactly |
| **Dead columns in five split rows** | pay checkout 597x108, packages FAQ 502x372, projects included 19px, two case rows | Payfast trust strip moved above the options where the live site puts it, plus a closing line. All four FAQ intro columns are now sticky, which is the pinned-heading pattern already approved |
| **Case rows were not equal**: 471/471/521/471/493/471 | one fact wrapped to a second line on Tee to Trail | Trimmed. All six rows now measure exactly 471 with text flush to the top and bottom of the screenshot, deltas 0 and 0 |
| **Three pages ended on the same centred block**, the only centred content on a left-aligned site, and contact ended on nothing 4085px from its form | three identical endcaps | All left-aligned splits with their own content: what changes between the three plans, what happens after you pay, what every project got. Contact gained a closing block |
| **`hero-rows` behaved two ways**: inert on projects, jump links on packages and pay, with smooth scrolling | mixed `a` and `div` | All inert. Edgar rejected the jumping on the work page, so that is the settled form |
| **A price claim contradicted the pricing page.** Pay said "R3,999 to R11,999" while directory Platinum is From R14,999, on the page that says "every price here matches the pricing page" | new-pay.html:88 | "From R3,999 once-off" |
| **The payments copy described the product instead of the reader.** Live uses first person | "Pay the design fee now" | "Pay my website design fee now and start a monthly plan, all in one go" |
| **The contact details section was four label-and-paragraph columns with no job** | 4 columns, each exactly 220px, one action between them | Rebuilt as two columns that each do something: three ways to reach us with the reason for each, and what happens next with the timing attached |
| **The live form explained every choice; the rebuild named them only** | live carries a line of explainer per website type and per add-on, plus a budget field | Explainers lifted verbatim onto the type and add-on chips, budget field restored, and the "worth including" list moved beside the textarea it describes |
| **Mobile: the pricing tab strip wrapped and orphaned the third tab** | "Directory sites" alone on line two | Nowrap, horizontal scroll, bleeding to the screen edge |
| **Mobile: the masthead textarea clipped its own placeholder** | box 87px, content 113px | min-height 120px below 860 |
| **The booking form ran a second field system**: every field at 856px, roughly double a readable width, beside a masthead form that pairs fields | 856 vs 303 | Column ratio rebalanced and email/phone paired. Booking fields now 565 and 274 |
| **The category line sat above all six project names** | six in a row | Moved onto the link row so the project name leads |

**Consequence caught by my own follow-up check:** moving two bands to ink exposed every component that had only ever been styled for a light ground. "Secured by Payfast" and the payment step labels computed **1:1, invisible**; the add-on copy sat at 2.58:1 and the card marks at 2.28:1. An on-ink block now remaps all of them. Re-measured with the correct AA thresholds (3:1 large, 4.5:1 normal): **zero failures on any ink band on any page**, including the home page.

### Two findings I did not act on, deliberately

- The director says the accent word is wrong on `new-packages.html` ("Clear, once-off website **pricing**", arguing "once-off" is the news). Edgar looked at that exact heading on 2026-08-21 and said "You see pricing is red. That's perfect." His ruling stands over the rule's inference.
- It also flags `new-home.html` ("Everything **your** business needs to work online"). The home page is the approved look target and he has signed it off. Changing an approved page on an agent's reading is how approved work gets unpicked. Flagged for Edgar rather than changed.

## Contrast consequences of the ink bands

Moving three sections onto ink was the right call visually and it broke colour in four places, all caught by measurement rather than by looking:

| Element | Was | Now |
|---|---|---|
| "Secured by Payfast" on the checkout band | **1.00:1, invisible** | remapped to paper |
| "Which one is you?" and the other step labels | **1.00:1, invisible** | remapped to paper |
| The result card heading, a white card sitting on the ink band | **1.00:1**, because `.band--ink` recolours every h2/h3/h4 to paper | cards on an ink band keep light-ground colours, 13.57:1 |
| The result card's "Secure payment by Payfast, cancel any time" | 2.19:1, same cause | 5.63:1 |
| Add-on copy, prices and card marks on the ink band | 2.28 to 2.58:1 | 6.19:1 |
| Review stars, coral on white, pre-existing on the approved home page | 3.89:1, under the 4.5 text bar though over the 3.0 graphics bar | a little ink mixed in, clears 4.5 at a shift nobody can see |

The lesson generalises: **flipping a band to ink recolours every heading inside it, including headings inside white cards that merely sit on that band.** Any component only ever styled for a light ground needs an on-ink counterpart, and any card on the band needs its light-ground colours restored.

## Final state, 13 pages

Measured in real Chrome, every page scrolled end to end:

| Check | Result |
|---|---|
| Console errors | 0 |
| Failed requests | 0 |
| Broken images | 0 |
| Unresolved reveals | 0 |
| Elements below WCAG AA (3:1 large, 4.5:1 normal) | 0 |
| Heading-level skips | 0 |
| Colours outside the four brand tokens | 0 |
| Em-dashes | 0 |
| Duplicate IDs | 0 |
| Pages with exactly one h1 | 13 of 13 |
| Horizontal overflow at 390, 768, 1280 | none |
| Dead internal links | none |

Interactive paths re-exercised after every change: pricing tabs switch and reveal all three cards; both Payfast journeys still produce `/api/payfast?plan=management` and `/api/payfast?website=business-silver&monthly=mgmt-standard`; the guided contact form narrows its package list from 12 options to 6 with the right price range, and posts services, website type, add-ons, budget, message and contact details in one payload; the booking flow carries the note under the `note` key the mail handler actually reads.

## First-render look loop, the remaining 8 pages (2026-08-21)

Closing B5. The four main inner pages had a recorded loop; the two legal pages and the six project write-ups did not, and B1 below is exactly what opening a write-up at first render catches.

**Round 1, real Chrome at 1440, all reveals resolved, cache-busted.** Captured all eight and read them. Findings, all fixed:
- Every write-up opened with its headline followed by an unrelated one-line caption and then straight into screenshots. The 60-word brief was missing on all six (B1).
- Industry read from the hero eyebrow instead of the meta row, wrong on four of six.
- Twelve screenshot captions dropped.
- The legal summary cards stated things the clauses below them qualify (B4).

**Round 2 after the fixes.** Six write-ups: four sections each, band sequence alt / base / ink / alt, no column holes, 3544 to 4776px tall. Two legal pages: masthead plus body, mastheads centred so the leftover is symmetric (113px and 126px above and below). Look loop closed.

**Noted, not changed:** the two legal pages carry no ink band, so they are the flattest value strip on the site. A dark band inside a policy document reads wrong, and the ink footer closes them. Flagged rather than forced.

## Reviewer round 2, the full 13-page site (2026-08-21)

`site-reviewer`, fresh context: **RETURNED**, 5 blockers and 12 material gaps. It confirmed every rand figure on all 13 pages is correct, Payfast parity is byte-exact, both legal bodies are MD5-identical to source, and all 36 delivered items across the write-ups are byte-identical and in order. The money and the legal text were safe; the failures were content and process.

### Blockers

| # | Finding | Fix |
|---|---|---|
| **B1** | **The brief was missing from all six write-ups.** My extractor paired the brief's h2 with the NEXT section's caption, so every page read headline, then "Top to bottom, exactly as a visitor would scroll it.", then screenshots. Worse, each page carried a comment asserting the brief was "carried over unchanged", and the work page linked to a write-up holding LESS than the row you clicked from | Extraction rescoped to `.project-brief`. All six now carry their real brief: 51 to 74 words, verified to start with the source's own opening words |
| **B2** | **The contact form's website type never reached the inbox.** `website_type` was posted by the browser and absent from the destructure in `api/send-mail.js`, so the one answer that routes a lead was dropped between form and email. Same class as the booking-note blocker from round 1 | Added to the destructure and to the mail body with a "load-bearing" comment. Verified: payload carries it and the handler reads it |
| **B3** | **The contact masthead left 379 to 406px of dead ground** under the left column once the form grew. Two comments claimed it was handled; both were stale | Centred. Now 191px above and 191px below, symmetric |
| **B4** | **Both legal summary cards contradicted the binding text below them.** "What we collect: what you send us in a form" when section 1 also collects usage data; "Card details: never handled by us" when the clause says never the FULL number; "Cancel in writing any time" when cancellation must precede the billing cycle; deletion "we will do it" without the legal-obligations qualifier | Every row now matches its clause, qualifier included, and points at the section number |
| **B5** | No look loop recorded for 8 of 13 pages | Run and recorded above |

### Material gaps, all fixed

| # | Finding | Fix |
|---|---|---|
| M1 | Industry read from the hero eyebrow, wrong on four of six | Read from the meta row. Crazy Daizy is "Bakery & Cake Shop" again, SpiralGuard "Industrial manufacturing", Lekker Doos "Wine & E-commerce Retail", Muire "Home Cleaning & Maintenance" |
| M2 | Twelve screenshot captions dropped, leaving unlabelled image stacks | Restored on the three multi-shot pages |
| M3 | `?package=` set the select but never fired `change`, so nine pricing-page links landed on a form contradicting itself and posting an empty services field | Dispatches change. Verified end to end: package, picker summary, website type, price note and narrowed list all agree, and all three reach the payload |
| M4 | "Same working day" was an escalation over the page being replaced, which promises "within one business day". 19 instances | Softened to "within one working day" everywhere. Zero instances left |
| M5 | "From scratch, no template" as a per-project spec row, when two of the six are WordPress builds | Softened to "Around the brand, not a fixed template", which is the sourced wording |
| M6 | **The services picker was unreachable with JavaScript off.** `[hidden]{display:none!important}` beat the no-JS rule and the button was hidden too, so seven options vanished under a label still asking the question | `.no-js .multi-panel[hidden]` forces the panel open. Verified with scripting disabled: panel displays, all 7 options visible |
| M7 | Calendar day targets were 21x21 at 375, under the 24x24 minimum in WCAG 2.2 SC 2.5.8 | 32x32 |
| M8 | Split sections started together but finished 36 to 88px apart | Stretch plus space-between, the same fix that made the case rows land exactly |
| M9 | The accent word on `new-home.html` sat on a possessive pronoun. Both the director and the reviewer flagged it independently | "Everything your business needs to work **online**" |
| M10 | Nine plan names were paragraphs, so a screen reader scanning by heading found the three tab groups and nothing under them | Back to h3, as the live page had them |
| M11 | "Jump straight to one" with nothing to jump to | Superseded: the work page is now a tab list, see below |
| M12 | Calendar paged backwards for ever; all eight slots offered for today including hours already gone; the mobile tab strip scrolled with no cue; one canonical would have self-referenced a 404 | Previous disables at the current month, past hours disabled on today only, right-edge mask on the strip, canonical matched to the live slug |

## The work page is now a tab list (Edgar, mid-pass)

"On the work page, make the websites showing in a tab, list them, and then you click on it and it shows the website, just so it can look better."

Six stacked case rows became the services tab spine: the six client names listed on the left, the selected project shown on the right with its screenshot, description, delivered list and links. This is his own standing rule from 2026-08-11, that a stack of same-shape blocks becomes a selector showing one at a time.

Reusing `.tab` and `.tab-panel` means the existing keyboard and aria handling applies with no new script. Verified: all six tabs switch, exactly one panel visible each time, every screenshot loads, panels resolve to opacity 1, arrow keys move between tabs and change the panel. Page height dropped from 6421px to 4470px.

The masthead card used to list the same six names and told the reader to "jump straight to one", which nothing did. It now carries what is true of the set: industries, typical build time, design approach, hosting.

---

## Phone pass, 2026-08-21 (after first live deploy)

Edgar opened the deployed site on his handset and sent nine corrections. All
nine are implemented, plus one defect found while checking his point 7.

**Look loop.** Section-by-section captures at 390 before and after every change,
in the session scratchpad under `sweep/` and `sweep2/`. Each fix was measured,
not assumed: the numbers below are computed styles read from Chrome, not values
read off the stylesheet.

| # | Edgar's words | Before | After |
|---|---|---|---|
| 1 | Sections too close to the edges | 16px gutter at 390 | 28px; 31 at 768 and 48 at 1280, within a pixel of before |
| 2 | Pricing not modern, "R500 off" redundant | struck price, live price and label in one run of text, on all 11 cards | old price on its own line, live price below, qualifier trailing, hairline under; promotion announced once |
| 3 | Work heading and filters awkward | two columns at 390, heading in a third of the screen | one column; filters 2x2, 44px targets |
| 4 | Too much space above the heading, heading too small | 72px above, h2 31px | 56px above, h2 36px |
| 5 | Services list sloppy | wrapping row of six long labels | six rows, hairline between, coral dot on the selected one, panel opens directly beneath |
| 6 | Footer icons red | grey outlines | coral fill, paper glyphs, 42x42 |
| 7 | Email and links must work | unproven | real enquiry sent through the live endpoint and delivered; honeypot returns success without sending; 42 internal and 18 external targets resolve |
| 8 | Remove the index block | five-row card in the work masthead | removed; masthead runs as one column |
| 9 | Slider not mobile friendly | auto-sliding rail below the panel | static, above the panel, swipe with snap, clones hidden, selected thumb marked |

**Defect found while checking point 7.** `dielekkerdoos.co.za` is a parked
Hostinger domain: no site, and https does not resolve. Three places on the work
page and the write-up called it live and linked to it. The build is finished and
running on the host's temporary address, so the screenshots and write-up stay
and only the false claim was removed. Pointing the domain reverses three edits.

**Regression at 390, 768, 1280 across 13 pages:** no overflow, no broken images,
no console errors, no reveal element left invisible, all internal links resolve.

**Contrast.** The new coral selected-row style matched every `.tab`, so the
pricing strip picked it up at 18px where coral on paper is 3.89:1 against a 4.5
bar. Scoped to the services list and set at 19.2px/700, where 3.89 is the
correct threshold. What still reports is 32 disabled calendar days and the Visa
mark, both exempt under WCAG 1.4.3.

**Touch targets:** none under 24x24 on any page.

**Not yet done:** this build is committed but not deployed. The live domain
still serves the pre-pass version.

### Independent review round, same night

A site-reviewer with no knowledge of the work returned **five blockers**. All
five are fixed, along with the material findings worth folding into the same
pass.

**B1. The 404 page was dead on the live domain.** Every link on it pointed at a
`new-*.html` draft, and `.vercelignore` keeps those out of the deploy, so a
mistyped URL landed on a page where the logo, six nav links and seven footer
links all 404'd in turn. It read clean locally only because the preview serves
the drafts. Root cause: `promote.mjs` only processed the 13 pages in its map,
so `404.html` was never rewritten and its own leftover check never saw it. The
tool now repairs it too. Verified: 8 links, none broken, zero draft references.

**B2 and B3. The work page contradicted itself.** The masthead and the meta
description both said all six client sites were online; three screens down the
same page said one of them has nothing to open. The write-up carried shared
boilerplate saying "everything below is live" directly under a card reading
"Built, waiting on the domain". Both corrected, and the boilerplate is left
alone on the five write-ups where it is true.

**B4. Point 5 was only technically fixed.** Tapping a service row scrolled the
panel to the top of the viewport, so the sticky header covered its heading and
the row list scrolled away entirely: the reader tapped and landed mid-paragraph
with no sign of what they had chosen. The chosen row now parks just under the
header, verified at 80px on rows 2, 4 and 6, with the panel heading inside the
viewport every time.

**B5.** This report is the record; it exists now.

**M1. Reviews at 390 was the worst section on the page.** The rail kept gliding
on a phone and parked wherever it stopped, slicing the previous card mid-word
and starting the readable one 74px in, against a 28px gutter everywhere else.
It stops on phones and becomes a swipe: one card, snapping to the gutter,
measured at left 28. The pause button went with the motion.

Also fixed: the delivery promise on the work page still said "two to three
weeks" where every other page says five to fifteen working days; the enquiry
confirmation overwrote "within one working day" with "the same working day" at
runtime; the endcap made handover claims covering five demo builds; arrow keys
on the project strip selected an invisible marquee clone and jumped the panel;
the phone strip dimmed unselected thumbnails to 55%, which is the wash Edgar
banned; the display heading had become smaller than ordinary headings on
phones; `.booking` was declared twice at top level with the first dead; two
media-query blocks were byte-identical twins; the previous site's `styles.css`
and `script.js` still shipped; the footer printed the location twice; four
em-dashes sat in a demo's comments.

**Left as is, deliberately.** The shared dropdown chevron is inside
`@supports (appearance: base-select)`, so iOS Safari keeps its native control:
correct engineering, worth knowing. "No bought templates" stands; the two
WordPress builds run custom child themes.

**Still not provable without a deploy:** clean URLs (`vercel.json` sets
`cleanUrls`, and the local server does not implement it, which is what hid B1),
Lighthouse, and real iOS Safari.

### Second independent review, same night

Returned again with three blockers. One of them, unanchored `.vercelignore`
patterns, had already been caught and fixed an hour earlier; the reviewer read
the file before that commit landed. The other two were real and are fixed.

**Blocker: in-page navigation cut its own headings in half.** Every anchor
landed its target at viewport top under an 82px sticky header, so tapping
Services on a phone arrived with the heading's first line sliced. The service
rows had been given a header offset in JS; the navigation every visitor
actually uses had not. `scroll-margin-top` now handles it declaratively for
anchors, the skip link and `:target` alike. Verified clear on all four nav
targets at 390 and 1280.

**Blocker: the demo builds asserted real regulatory credentials with nothing
visible saying they are demos.** PIRB registration, SACPCMP supervision, COIDA
cover, certificates of compliance, workmanship guarantees, company registration
forms and an invented street address, all in the first person, for five
businesses that do not exist. `noindex`, the robots disallow and the work page
labels cover the visitor who arrives through the site; they do not cover the
shared link, which is how these are distributed. Every one of the 22 demo pages
now carries a fixed strip naming it a demonstration build for a business that
is not real. Verified at 390 and 1280 on all 22, visible without scrolling.
The five construction pages had no closing `</body>` or `</html>` at all; both
went in with the marker.

**Also corrected:** the figure band promised "nothing rounded up" two lines
above a delivery figure that rounded up, against packages quoting five working
days; the reply-time promise was made at two strengths on one page; nine struck
prices had no reference date behind them, which the Consumer Protection Act
asks for; the 404 page's footer had drifted from the other thirteen because
promote handles it on a separate path; four one-value-per-role breaks measured
from computed styles, including the only 500-weight headings on the site and a
display heading sitting 4px from an ordinary one; a 550ms hover on buttons;
sixteen em-dashes in a demo's CSS and JS; two TODO markers; stock adjectives;
a promote check that reported "leftover references: NONE" while 28 remained.

**Raised and deliberately not actioned, for Edgar:**

- The privacy policy cites GDPR and never mentions POPIA, which is the statute
  that actually gives South African readers those rights. That is legal copy
  carried across from the live site and his call, not mine.
- The lower half of the home page runs roughly 7,900px of continuous light
  ground with no dark anchor. The obvious fix is flipping a band to ink, and he
  has rejected exactly that change before, so it stays as it is until he says
  otherwise.
- The logo strip shows nine businesses while the work page says six client
  builds. Compatible (the strip is not limited to featured case studies) but
  worth a look.

## Repetition pass, 2026-08-22

Edgar, reading the deployed pay page: "it feels like we are just saying a lot
of things." Measured, he was right, and not only there. The same promise was
being made three to five times per page in slightly different words.

Counted before and after (visible copy, scripts excluded):

| page | phrase | before | after |
|---|---|---|---|
| pay | "you see the exact amount first" | 3 | 1, masthead card |
| pay | Payfast security | 5 | 1, trust strip |
| pay | prices match the pricing page | 2 | 1, closing section |
| pay | headings containing "pay" | 4 | 2, the H1 and the two-ways H2 |
| home | "within one working day" | 4 | 1, the Answered-fast card |
| home | "plan and a price before any work starts" | 3 | 1, the hero form |
| contact | "one working day" in prose | 6 | rows, sent-panel, timeline, booking: each functional |
| contact | "a quote costs nothing" | 4 | 1, the masthead fact row |
| packages | "separate monthly add-ons" | 6 | 1, the masthead |

Every slot that lost a repeat either went entirely or now carries a fact the
page did not have: the home form foot states the privacy line, the contact
"Before you write" block gives actual preparation guidance instead of
restating three promises made one screen up, the packages panel intros
describe the product type and nothing else.

Also caught: the pay masthead said "cancel any time" while the bullet below
says "in writing before the next billing date". The loose version is gone.

Verified after: picker still builds the real /api/payfast URLs, cancel-note
still script-driven, 13 pages clean at 390, 768, 1280, all links resolve, no
console errors.

## Colour system final state, 2026-08-23

Edgar's colour push, settled over three rounds and signed off on screenshots:

- **Coral**: heading accent words, button
  hover everywhere, the arrow thread in every link, the top edge on the teal
  form cards, footer social tiles, review stars (darkened mix at text size).
- **Teal**: the ground of two band roles (reviews on home, the closing CTA on
  every page) and the form and info cards on every masthead, all one 16%
  --ground-teal token. White fields sit on the teal cards, flipped at Edgar's
  call after the tinted-field version.
- **Reverted on his eye**: the tinted services panel, the "from 10 Google
  reviews" badge tail, the hero chevron mark.
- The Google badge is G, five stars, 5.0, linked to the listing, beside the
  reviews heading on desktop and under it on phones.

Verified after the final flip: card tint identical on contact, pay and all six
write-ups; thirteen pages clean at 390, 768 and 1280; contrast register at its
exempt-only baseline; no console errors; payment picker and enquiry payloads
unchanged by the styling passes.

## LAUNCHED, 2026-08-23

The go/no-go review's blocker (home Platinum at R5,499 against a R5,999
checkout) and its polish items were fixed, the reviewer's verdict flipped to
GO, and the build deployed. Verified on the live domain after the alias: ten
pages clean at 390 and 1280 with zero console errors, both Platinum cards
showing struck R6,499 and R5,999, the teal seam rule, red buttons and on-ink
arrows all serving. This closes the redesign: every further change is normal
site maintenance.

## Copy density and the craft rows, 2026-08-23 (post-launch)

Edgar, on the live site: "too much wording everywhere you have to read way to
much all over the site". Every page lost its restating second sentences,
qualifying tails and FAQ padding, keeping the facts and dropping the filler.
Home 1784 -> 1591 words, projects 1659 -> 1252, packages 1161 -> 954, contact
913 -> 746, and each of the six project write-ups roughly 60 words lighter.
Terms and privacy were left alone: legal text, and both already open with a
short summary card.

He then sent the six craft points with "make this look better more ux ui".
They were a wall of identical rows on a phone, icons thinner than the text
beside them. The rows are divided by the existing hairline token with the gap moved into
row padding, and the icon grew with a heavier stroke. A coral-tinted chip
behind each icon was tried in this pass and rejected the same day as an
AI-template tell; it is gone and must not return. The pattern is
shared with the "what we delivered" list on all six write-ups, so seven pages
moved on one CSS change and no markup.

Gates: 13 pages at 390/768/1280 with no problems, 18 internal links sound,
zero console errors, one value per role held (h2 36/51.2, radius 4, button
61.1, control 55.1), reveal opacity 1 on every craft row at both widths,
contrast register unchanged (the exempt disabled calendar days and the Visa
mark only).

## Review round 4 and the phone pass, 2026-08-24

Independent review of the copy trim, the craft list and the rebuilt contact
index returned NO-GO on one blocker: in the reach index the value column was
minmax(0, 1fr), which may shrink below its content, so between 721 and about
795 the email address ran underneath its own arrow. Three columns need roughly
230px each, so the list now stacks below 861 rather than 721 and the value may
break as a last resort. Measured clear at 721, 744, 768, 800, 840, 860, 861,
900, 1024, 1280 and 1440, tightest clearance 19px.

Also from that review: a stray closing div on the work page, dating to the
original build, removed from both copies; the CSS comment that still described
the deleted chip, rewritten; the upsell sentence dropped from the work page,
because item five of that list is hosting and management at R199 a month; and
the contact page second preparation heading renamed, since the page asked
twice to be prepared.

Edgar on the phone the same morning: the four assurance blocks in the closing
CTA kept a white card ground on the teal band. The 620px rule turns them into
flat rows and clears the ground, but a later two-class rule put the ground back
at every width. Scoped to 621 and up. Their icons were drawn in ink while every
other icon list draws in coral, now coral. The craft list opened with a hairline
above its first row, which reads as a stray rule rather than a divider; rules
now fall between items only, in both lists.

The ground bug had no detector, so tools/_grounds.mjs was written: at 390 and
768 it flags any element painting a ground different from the band behind it
while carrying no border, radius or shadow to justify being a card. Clean
across all 13 pages.

The booking calendar day cells were square, which in a 620px seven-column grid
made every cell 85px and stood the month 620px tall, leaving 333px of dead
ground beside the form. Rows take a 44px height instead; the gap between the
two columns is now 86px.

Look loop: chip rejected round 1, removed and re-shot round 2, accepted. Reach
index rebuilt across three rounds (stranded arrow, then unclosed grid, then
pinned to the value line) and shot at 390 and 1440 with hover proof before it
was shown. Gates green: 13 pages by three widths, no console errors, 18 links,
contrast exempt-only, grounds clean.

## Deep pass on pay and pricing, 2026-08-24

Edgar, before leaving for two hours: the payments page does not look
professional, the pricing page add-ons read as information thrown at you,
and on "Not sure which one fits?" the word is red while the question mark is
black. Take the time, improve the UX, keep the vibe.

The question mark was not one heading. Every heading that ends on its accent
word closed the span before the punctuation, so a coral word was followed by
an ink full stop in 37 places across 20 files. Punctuation that falls
immediately before the closing heading tag now sits inside the span; where
the accent is mid-heading the stop still follows ink words and stays ink.

The add-on rows said everything twice. Hosting's paragraph and its bullets
both listed hosting, SSL and email; Extra services listed photography,
branding, social, Ads and SEO in the paragraph and again in the bullets. The
paragraphs went, the bullets stayed, and the one fact that lived only in
prose, R249 for stores and directories, moved to the price column. The name
column came in from 0.8fr to 0.55fr now that it holds one word, the price
track widened to 210px to hold its note, and the bullets tightened to a spec
rhythm. Section height 1231px to 1010px with nothing removed but repetition.

The split rows bottom-aligned their two columns with align-content:
space-between, which shares the slack across every gap. On the pay page that
put 143px between a heading and its own one-line paragraph, and 129px before
two bullets: three things adrift in a column rather than a block of copy.
Columns now hug their content and align at the top. The section-geometry
rule stands, but alignment cannot be manufactured by inflating gaps.

The pay page's first step stacked all eight plans as eight identical cards
under three headings. It now uses the tab pattern the pricing page already
uses for the same three types, driven by the shared handler, so the picker
shows three cards instead of eight. Tabs had never appeared on a dark band,
so .tab colour was ink on ink and the types were invisible; they take the
on-ink pair now. Both journey rows had their arrow in the class that means
"price", parked 500px from the words it belonged to; it moved onto the title
and the row reads as a link.

The three plan cards started their tick lists on three different lines,
because one description was a line shorter and, on the directory tab, "From
R14,499" was long enough to push its period label onto a third line. The
description reserves two line boxes and the period always takes its own line.
Measured 0px spread on cards and lists across all three tabs, once the
reveals had settled; before that wait the numbers read 2 to 3px off, which is
the animation mid-flight rather than the layout, and the align sweep now
waits for it too.

Both type strips ran off the edge of a phone, the pricing page's by 85px and
the picker's by 34px, sliced at both ends for the sake of a scroll nobody
would notice. Three short labels wrap onto two lines below 620px instead.

tools/repeat-sweep.mjs was written for the complaint underneath all of this,
that the pages say the same thing several times. It compares every text block
on a page against every other and reports heavy word overlap, ignoring
parallel structure, since three plan cards listing the same features are
meant to echo. First run: 123 overlapping pairs. After cutting the add-on
prose, the hosting line the home page ran twice, the store group intro that
repeated its own first card and the solar demo intro that pre-empted both its
bullets: 21, all of them FAQ answers restating a card fact, which is correct.

Gates: 13 pages by three widths, no console errors, 18 links, contrast
exempt-only, grounds clean, alignment clean, no em-dashes. Both payment
journeys exercised end to end at 1280 and 390, correct Payfast keys and
amounts against api/payfast.js.


## Self-directed quality pass, 2026-08-31

Edgar asked for a pass with no direction from him: find the faults, fix them,
report once. Audited all seven pages at 375, 768, 1280 and 1440 with measured
computed styles rather than by reading the stylesheet.

Twelve faults found and fixed. Consistency: four unrelated clamps were doing
one big-number job (48, 44, 36 and 32px), now three declared tokens, --fig-lg,
--fig-md and --fig-sm; the chat button carried the only 999px pill and the last
drop shadow on the site, both gone; .wordstack declared font-size three times
with two dead, now one. Performance: 22 work-page images had no dimensions and
18 logo marks loaded eagerly below the fold. Correctness: the pay page's
Continue shipped as href="#", a live link to nowhere, and now ships inert with
aria-disabled and is enabled by script only once a plan is chosen. Motion: the
logo marquee ran full bleed with no mask and sliced a mark in half at both
edges, and now fades like the reviews rail.

Clean on audit and left alone: 66 of 66 interactive elements had focus rings,
no heading orphans, no horizontal overflow at any of the four widths, no
media-query override bugs, 404 present and styled, every image had alt text.

Two mistakes made and corrected inside the pass. A blanket 1200x900 was stamped
on every undimensioned image, which trades one layout shift for another; and
the marquee mask first landed on .hero because `overflow: clip` appears in both
rules and the insert matched the first, which briefly faded the whole hero.

Independent review returned GO with seven gaps, four of them introduced by this
pass. All seven fixed: the work page's images reused one file in two boxes of
different ratios, so no single pair could be right and the attributes came off,
since the CSS aspect-ratio already reserves the box; the logo strip's blanket
200x72 was wrong for all nine marks and its lazy attribute reversed a
documented decision, since off-screen marquee marks may never load, so real
dimensions went on and eager loading came back; .pcard-price never took a token
and out-sized the section heading on a phone; the chat button dropped its
shadow at rest but grew one on hover; and --fs-lead computed 16.96px against a
16px body, because .lead had a token and a line-height but never a size, so
every lead on the site rendered as body copy. It now runs 1.13x body at 375 and
1.42x at 1280.

Edgar's calls during the pass: the build panel he picked on 2026-08-26 was
removed entirely, with its styles and script; and the services band and its
selected-service panel swapped grounds, the band to white and the panel to
grey, which also returns the home tone ladder to grey, white, INK, white, INK,
grey, white, grey, white, TEAL, white.

Not done: the work page masthead was rejected twice, first as a collage and
then as a list of the client sites, which let a visitor count them. Three
replacements are with Edgar to pick from and none of them enumerates the work.

Gates: 13 pages by three widths, no console errors, 18 links, contrast
exempt-only, alignment and ground sweeps clean, no em-dashes.

## Type change and the /better pass, 2026-09-02

Two batches on one day. The first changed a typeface across all 14 pages, the
second was a self-directed audit. Rounds, in order.

**Round 1, the look target.** Edgar sent a crop of a heavy headline and asked
for "a bolder type of font". Four heavy treatments were built on the real page
and shot at 1280 and 390, each on three sections including the ink band that
matched his crop most closely: Manrope pushed to 800, Archivo 900, Bricolage
Grotesque 800, Anton. Verdict: he picked Archivo, option 2.

**Round 2, first render after the swap.** Found: the display face leaked onto
card titles, where a 900 weight at h3 size reads as a mistake. Fixed by
excluding the two cards on the site that hold an h2. Verified by walking all 13
pages at 390, 768 and 1440 and reading the computed family back: 67 section
headings on Archivo, every card title still Manrope, no silent fallback, no
clipped heading, no sideways scroll.

**Round 3, the /better audit.** 35 faults found by measurement across 14 pages
at 375, 768, 1280 and 1440. A blocker among them: the contact form quoted the
struck-through list prices while api/payfast.js charges R500 less, on all three
website types. Also the value strip (six consecutive light bands on the home
page, four on pricing, with no dark anchor in either lower half), the pricing
cards sitting at 1.000:1 against their own band, content clipped and
unreachable below 349px, four rails moving with no pause control, and focus
falling to <body> on three separate journeys. 33 fixed, 2 left with reasons
stated.

**Round 4, independent review in a fresh context.** Returned with one blocker
and ten gaps. Two of the ten were caused by round 3 itself: moving the pricing
masthead to paper fixed the cards below it and left its own card at 1.000:1,
and the new pause button landed under the fixed chat button, reachable at 3 of
9 sample points. All ten re-measured after fixing: masthead card now grey on
paper, plan names one size on both pages (16px), pause button reachable at 9 of
9, footer headings back on Manrope, booking confirmation lands focus on
#book-done, and today's date closes once its last slot has passed rather than
offering eight disabled ones.

**Verdict: passed.** Gates at close: 13 pages by three widths, zero console
errors, 18 links, contrast sweep clean, alignment, ground and tone sweeps
clean, zero em-dashes, no placeholder text. Not verified locally and still
deploy-gate items: the real send-mail endpoint, the live Payfast checkout,
clean-URL routing and field Core Web Vitals.


## 2026-09-03 evening: from-scratch rebuild, branch `edweb-next`

Scope: every page rebuilt on a new stylesheet and script. Pages covered:
new-home, new-projects, new-packages, new-contact, new-pay, the six
new-project-* write-ups (navigator, crazydaizy, teetotrail, spiralguard,
lekkerdoos, muire), new-privacy, new-terms, 404. Look-target: Edgar's
standing rulings (one face Manrope 700, four tokens, light base, no dark
mid-page bands except the one statement/figures band, no pinned headings)
plus the modern-design-playbook bar (fluid type, scroll-driven motion, one
living element, asymmetric splits, designed hovers).

### First-render look loop (real Chrome via DevTools MCP, 1440x900 and 390x844)

Round 1, home 1440: hero, pinned work rail, services tab spine, statement
band, pricing, process, reviews, FAQ, CTA, footer all rendered; entrance
choreography, cycling word, statement words lighting up and count-up figures
confirmed live. Faults: work tiles too tall under the fixed header; services
column sticky with nothing to pin against; "Services" nav link marked current
on the home page. All three fixed (tile width 56vw/800 max, sticky removed,
anchor links skipped by the current-page marker).

Round 2, home 390: single column, chat panel under the copy, rail mode for
the work section, no horizontal overflow (scrollWidth 390). Mobile nav
toggle, chat chip (fallback answer), services tab switch and FAQ open all
exercised and confirmed by DOM state.

Round 3, inner pages 1440 (projects, packages, contact, pay, one write-up,
privacy): rendered on the shared shell. Faults: demo tiles left a dead half
(5 in a 2-up grid), replaced by a manual prev/next rail; pay step showed a
focus ring after programmatic focus, removed. Pay picker exercised end to
end: Business Silver + hosting and management produced
`/api/payfast?website=business-silver&monthly=mgmt-standard` and "Pay R3,499
now". Contact form validation names the missing fields.

Edgar correction mid-build (crop of the FAQ band): "don't like it when the
header moves with the scroll". Sticky FAQ side column removed; only the work
rail's media stage still pins. Harvested to OS TASTE-PROFILE the same
session.

### Independent review (site-reviewer, fresh context)

Verdict BLOCKED on one item, this QA entry missing; four gaps. Actions:
staggered work-grid rows removed (aligned tiles per the 2026-08-19 ruling);
snap rails got `scroll-padding-inline` so the first tile lines up with the
heading on mobile; footer gets 64px bottom clearance on mobile so the chat
launcher never sits on the last line. Ink `#1c1c1c` kept: settled with Edgar
on 2026-08-23 (three rounds, recorded in project memory and HANDOFF), the
project CLAUDE.md line quoting `#2b2b2b` predates that ruling. Reviewer
verified: Manrope only at 700, zero em-dashes, no ghost buttons, no eyebrows,
prices match PACKAGES.md and `api/payfast.js`, 0 console errors, 0 broken
images, no overflow at 390 or 1440.

### Sweeps

Em-dash sweep over all new files: 0. Stray hex sweep over the stylesheet: only
the four tokens plus `#000` inside a mask gradient. Asset sweep: every
`assets/` path resolves on disk.

### Not checked locally (launch gate)

Real form send, real chat turn against the Anthropic API (needs
`ANTHROPIC_API_KEY` in the hosting env), Lighthouse on a hosted URL, clean-URL
routing.

### Edgar's first round of corrections (2026-09-03 evening, all applied)

Particles stronger and only on paper sections; hairline above the logos
removed; logo marquee no longer pauses on hover; statement rewritten ("and
the results speak for us"); reviews three per view, paging by three; teal
closing band replaced by the soft grey; no pinned section headings. Two
sections went to three-option bake-offs in one artifact
(https://claude.ai/code/artifact/4af07249-913f-440d-9ca0-f61d4d8e1f09):
work section WORK 1 (aligned two-up grid) and add-ons ADDON 1 (white plan
cards) won and are built in; rejected variants and the rail engine removed
from CSS and JS. Prices moved to R1,000 off across every surface, shown as a
coral deal sticker. Verified after the swap: work tiles align in pairs
(tops 324/835/1347 at 1440), add-on price lines align (372 x3), 0 console
errors, script passes `node --check`.

### Go-live pass (2026-09-03, late)

Mobile 390 checked page by page in real Chrome (home at seven scroll
positions, contact, packages, pay with a plan chosen, work with the demo
rail, one write-up, 404): no horizontal overflow on any page, launcher
clears the footer. Fixes from the pass: pricing type tabs wrap instead of
clipping, work and demo captions left-align on phones, review cards size to
their own content on phones. Forms: contact form posts every field
`api/send-mail.js` reads, `website_type` derived from the package key so the
enquiry routes; conversion fires only on `sent: true`. Payfast picker
produces the right endpoint and amount. Promote run: 14 pages, zero
leftover draft references, 404 links repaired. Committed 0878cda on
`edweb-next`, fast-forwarded into `edweb-logo-refresh`.

## Work page quality pass (2026-09-04)

Scope: `/projects`, plus the shared stylesheet and script, plus the five demo
sites under `/demos/`. Triggered by Edgar pointing at the closing checklist
("a large dead space under it") and then at a demo page that "looks wrong".

**Look target.** The page's own client-work grid: full-bleed captures, flat
rows, no boxed cards, a link out at the end of each band. The closing section
had to read as part of that page, not as a footnote before the footer.

**Round 1, structure.** Measured with a section probe at 1440: `#standard`
held 263px of content inside a 567px band (46%), six one-line rows with
hairline rules under each. Rebuilt as `.standards`: six items, each a coral
tick, a bold name and a supporting line, three across, closing on a link to
`/packages`. After: 492.8px of content in 732.8px, symmetric 120px padding,
rows equal within a row at 1440 / 768 / 375 (78.1 / 77 / 75.5px).

**Round 2, measured sweeps.** `align-sweep` reported four columns off a shared
line; fixed the demo-rail captions (39px at 768, captions now stack in one
column below 900px) and the stat-row labels (26px at 1280 and 1440, two lines
reserved where figures share a row with dividers). Sweep went 4 -> 1; the
remaining item is the packages add-on row at 1280, documented and not fixed.
`ground-sweep` clean. `repeat-sweep` no repeated claims.

**Round 3, audit (site-auditor).** Fixed: work-tile links exposing an empty
accessible name (the `<a>` wraps a `<figure>`, so name-from-content is
blocked), paper on `--coral` at 3.89:1 against a 4.5:1 bar, a 38px overflow at
320px from a nowrap value, carousel arrows enabled at the ends and doing
nothing, mobile menu leaving focus behind it with no outside-click dismissal,
heading order skipping levels twice, focus landing on an unrevealed tile, an
unnamed chat drawer, wrong declared image aspect ratios, unused 400w variants,
identical demo Book links, missing og:url / twitter tags / structured data.

**Round 4, the demo pages.** `/demos/<name>/` is 308-redirected to
`/demos/<name>` by `cleanUrls`, which moves the document base up a level, so
every relative `styles.css`, `script.js` and image 404'd in production. Live
pages were rendering as raw HTML. Each demo page now pins `<base href>`. The
first attempt inserted it after `<header>` rather than `<head>` (these files
have no literal head element) and did nothing; corrected to sit directly after
the charset meta on all 28 pages. Verified live: construction demo renders.

**Round 5, review (site-reviewer, fresh context).** Returned. Cleared since:
supporting lines back to 16px, the closing row reuses `.pricing-more`, the
stat-label reservation scoped to widths where dividers exist, the masthead card
title no longer a competing h2, and the SEO line rewritten so it does not
contradict the packages page. Left open for Edgar: the value strip below the
masthead (M3), whether the closing section keeps the tick-grid shape (M2),
three structurally identical section openers (M4), and whether `/projects`
moves to the three-across work grid that won on the home page (M9).

**Evidence.** Zero console errors at 375 / 768 / 1280 / 1440 on projects,
index, packages, contact and pay. No horizontal overflow at 320 / 375 / 768 /
1280 / 1440. Rail paged 0 -> 1308 -> 0. Captures in the session scratchpad
(`better/v3-1440.png`, `better/std-view-1440.png`, `better/std-view-390.png`,
`better/live-demo-3.png`).

**Not measured.** Throttled-mobile Lighthouse. Field Core Web Vitals.
