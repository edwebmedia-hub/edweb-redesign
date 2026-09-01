# ERFDEVCO QA report

Site: `client-cms/erfdevco`, branch `erfdevco-custom`. Served for testing at
`http://localhost:4211` (`node .claude/static-server.mjs 4211 erfdevco`).

Look target: **altnest.webflow.io**, measured live in Chrome at 1440 (Tenor Sans
uppercase at negative tracking over Instrument Sans, flat section rhythm, 4 to
6px radius, one full-bleed dark chapter). Retokenised to estate green, gold and
warm canvas. The design direction, what was kept from the reference and what was
deliberately changed, is the table at the top of `HANDOFF.md`.

---

## Round 1, 2026-09-01: self-directed quality pass

Method: full-page captures at 375, 768, 1280 and 1440 with OS
`tools/chrome-shot.mjs`, plus a measurement harness (`_erf-audit.mjs`) for the
value strip, one-value-per-role, row geometry, tap targets and contrast. OS
`ground-sweep`, `align-sweep` and `repeat-sweep` all run.

**39 faults found, 37 fixed, 2 declared.** Groups: value strip 6, Edgar's named
corrections 5, row geometry 7, type and consistency 5, mobile 5, cards 4,
content and truth 3, contrast 2, missing function 2.

Five more were introduced during the pass and caught before it closed: a map
tooltip parking off-canvas (73px overflow at 390 and 768), a `.split--action`
rule appended after the mobile reset so it never collapsed, a compare grid that
assumed two farms when three can be compared, printing coming out white on
white, and a patch script that logged success but aborted before saving.

Declared, not fixed:
- The bond slider panel has vertical space beside the taller result panel.
  Filling it would be padding.
- The schedule spine leaves space under a short section. On a dark band that
  reads as a designed band rather than a dead half.

## Round 2, 2026-09-01: independent review and accessibility audit

Two agents in fresh context: `site-reviewer` (judged against the taste profile
and quality standards) and `site-auditor` (WCAG 2.2 AA, Core Web Vitals, SEO).
Between them, 8 blockers and a long must-fix list. All 8 blockers cleared.

### Blockers cleared

| # | Fault | Fix | Verified by |
|---|---|---|---|
| R-B2 | Honeypot was in the accessibility tree with the label "Farm name", on a farm site. A screen reader user fills it, the handler shows "your message has been sent" and sends nothing. | `aria-hidden` + `inert` on the wrapper, and a trip no longer claims success: it gives a route that works. | `aria-hidden="true"`, `inert` present on both forms |
| R-B3 | "103 Facts recorded per farm" was false on every listing. No farm records more than 68; 103 is the size of the schedule. | Stat relabelled to the schedule's 18 sections; about counter labelled "Fields in the schedule". | max `factCount` in the data is 68; no page now states a per-farm count |
| R-B4 | Property24 syndication and a no-listing-fee promise asserted seven times, neither verified anywhere. | All seven removed. Replaced with claims that hold: one schedule, one practitioner, mandate and commission agreed in writing. | grep for Property24, "no listing fee", "R0" returns nothing |
| R-B5 | Poultry and dry land farms are offered in the search rail but dead-end on "0 farms currently listed", reading as no stock at all. | Empty state names the type and says we take mandates on it; results line names the filter. | `?type=Poultry%20Farm` renders "No poultry farms on the books right now" |
| R-B6 | No privacy or POPIA notice on a South African site running two forms. | `privacy.html` written: responsible party, Information Officer, what is collected, why, retention periods, localStorage, Google Fonts, rights, Regulator contact. Linked from all eight pages and the sitemap. | privacy link present on 8/8 pages |
| R-B1 | No QA record for seven pages built against a new ground. | This file. | |
| A-B1 | Compare tray collapsed on itself at 375: the call to action covered slot 3 and its remove button, so a phone user could not deselect a farm. | Tray wraps below 640, slots and remove buttons enlarged. | overlap test at 375 returns "clear" |
| A-B2 | Compare table headers never stuck. `position: sticky` resolved against `.cmp-wrap`, and `overflow-y: visible` beside `overflow-x: auto` computes back to `auto`, so it stayed a scroll container. Scrolled 1200px into a 96-row table the headers were at -1200. | The phone layout stacks the table, so nothing needs to scroll sideways at any width; the wrapper stops being a scroll container and thead sticks under the site header. | headTop 71 / 71 / 83 / 83 at 375 / 768 / 1280 / 1440 |

### Accessibility must-fixes cleared

| Fault | Before | After |
|---|---|---|
| Closed mobile menu keyboard-focusable and read by screen readers | four focusable links, `visibility: visible` | `visibility: hidden`, focus test returns false |
| Map pins focusable but absent from the accessibility tree (`role="img"` made the subtree presentational) | 0 pins named | `role="group"`, 33 pin names in the tree |
| Lightbox had no focus cycle: Tab and Shift+Tab both slammed back to Close, so Previous and Next were unreachable | 1 reachable control | cycles prev, next, close |
| Vertical tablist answered only Left and Right; ArrowDown scrolled the page | ArrowDown did nothing | ArrowDown moves to the next tab; Home and End added; `aria-orientation="vertical"` |
| "All sections" tab had no roving tabindex, so the tablist shipped with two tabbable elements | 2 tabbable | 1 tabbable |
| Bond sliders had a 173 x 2px hit box | 2px tall | 26px tall, track painted by the pseudo-element |
| Focus ring used bright gold: 2.56:1 on canvas, and the same colour as the gold button | below 3:1 on every light ground | two-tone ink ring with a light halo, gold reserved for ink grounds |
| Hero gold headline over the first crossfade frame | median 2.15:1, min 1.08, **83.9% of its area below 3:1** | median 5.62 / 5.78 / 6.16 per frame, min 3.54, **0% below 3:1** |
| Compare tray stayed focusable after being dismissed | 5 focusable controls for farms no longer selected | `visibility: hidden` when not raised |
| Error message red | 3.97:1 on canvas, 4.20:1 on ink | darkened on light grounds, lightened on dark |
| Unknown listing id silently rendered a different farm at HTTP 200 and rewrote the canonical to it | showed Weltevrede for any bad id | not-found state, `noindex` set |
| Fourth compare selection did nothing, silently | no feedback | announced through a live region |
| Compare table did not re-render after tray edits | stale counts | re-renders on `erf:compare` |
| `aria-disabled` on a link that still navigated | navigated | `href` removed while disabled |
| `listing.html` CLS 0.48, caused by `#listing-detail` growing 266px to 9214px | 0.48 | `min-height` reserved on the container |
| Hero preload fetched the full 1800w file alongside the srcset pick | 202KB wasted on mobile | `imagesrcset` and `imagesizes` match the img |
| Two in-viewport crossfade frames marked `loading="lazy"` | delayed the first paint | lazy removed, `fetchpriority="low"` |
| `script.js` render-blocking on every page | blocking | `defer` on all eight pages |
| about.html counters rendered "0" with JS disabled | claimed zero fields | ship their real numbers |
| Canonical said `listing.html?id=`, sitemap said `listing?id=` | disagreed on all nine farms | sitemap matches |
| Stray `</div>` in index.html | unbalanced | all eight pages balanced |
| Stale data note said "Four sample farms" | wrong | says nine, and that no farm answers all 103 |

## Round 3, 2026-09-01: Edgar's three section picks

Three sections were rebuilt after he picked one live option each from
https://claude.ai/code/artifact/894540e1-8c2b-44d5-9e69-823077b8b332.

| Pick | Section | Was | Is |
|---|---|---|---|
| A2 | index, the schedule block | A flat checklist of eighteen headings with a field count beside each. Stated what we hold. | The five questions a farm buyer asks first. A vertical tablist; each answer is pulled off a named farm currently for sale and links to its full schedule. |
| B5 | index, the numbers band | Four counters in a row, one of which asserted the unverified syndication claim. | The country. Nine province outlines drawn inline, gold pins from the listings file, and three numbers hung off the map. |
| C8 | contact, the DIRECT card | A boxed card beside a squeezed form. | Four labelled columns on ink, read like a letterhead, with the form given the page underneath. |

Faults found and fixed inside this round, each caught from a capture or a
measurement rather than from reading the diff:

| Fault | Evidence | Fix |
|---|---|---|
| Four facts in the picked prototype did not exist in the data: a combined borehole yield, a dam capacity, a camp count and two equipment rows were invented labels. | assertion against `listings.json` failed on 4 of 21 rows | Every row is now read out of the data file by key, and the build asserts each key exists. A wrong fact cannot reach the page without failing the build. |
| All five answers rendered at once, 1838px of stacked panels. `display: flex` on the panel beat the user agent's `[hidden]` rule. | panel height 1838 where the list needs 401 | `.qa__a[hidden] { display: none; }` |
| Question rows were 367px tall on desktop because `flex: 1` stretched five of them across the panel's full height. | measured tap height 367 | Panels sized first, questions share the height; 80px each at desktop, 55px at 375. |
| The contact details band sat directly under the photo hero: two dark values touching. | computed grounds ink, ink, canvas, ink | Details moved below the form and the last band changed to the white surface. Strip is now photo, canvas, ink, white. |
| On a phone the contact columns 2 to 4 were indented and column 1 was not. `.cband > div + div` outweighs a media query, which adds no specificity. | 375px capture | The mobile reset matches the selector weight. |
| The selected question was marked by a gold bottom border, which read as a rule between two rows rather than a mark on one. | 1440px capture | A gold bar in space every row reserves, so opening one moves no text. |
| The number column was 5.5rem wide for a two digit number, stranding the label. | 1440px capture | Column and type sized to each other. |
| The heading said "Nine provinces" directly above a row labelled "Provinces". | repeat-sweep | Heading names the range instead. |

Verified after: counters land on 9, 10 and 18 with JavaScript on, with it off
and under reduced motion; nine pins painted; the country still draws with
JavaScript off because the province geometry is inlined; click, ArrowDown, Home
and End all move the selection; one tabbable question at a time; closed answers
are not in the tab order; both columns start and finish on the same line at
1280 and 1440 (6448 to 6849 on both); 32 page and width combinations clean;
ground-sweep and align-sweep clean; no em-dashes; all eight pages balanced.

Declared, not fixed: repeat-sweep reports six overlapping pairs. One is a farm
name appearing both on its card and in the answer that quotes it, which is the
point of the section. Five are the Melkhout description restating figures that
also appear in its schedule. The description sells the farm and the schedule
proves it; removing the prose would leave a table with no story.

## Round 4, 2026-09-01: fewer dark bands, and a usability pass

Edgar: "make it user friendly and i think less of that dark background
sectiosn". Measured first. Share of each page painted dark, before:

| Page | Before | After |
|---|---|---|
| compare | 70% | 23% |
| about | 54% | 38% |
| contact | 43% | 32% |
| index | 40% | 27% |
| listings | 37% | 21% |
| listing | 15% | 15% |

Every flat ink band is gone. What is left dark is a photograph or the footer.
A third light value was added rather than reusing a 5% tint, which reads as
the same value: `--sage`, ink and gold mixed into the canvas, so bands can
still alternate without going dark.

The first measurement said nothing had changed. That was the instrument:
`color-mix()` serialises as `color(srgb 0.85 0.86 0.84)`, whose numbers run 0
to 1, and the luminance function was reading them as bytes, so every mixed
colour came back near black. It now paints the colour to a canvas and reads
the pixel.

Components that had only ever lived on ink then had to be re-lit. Measured by
compositing over the real ground, twelve items failed on the new ground:
white counters at 1.42:1 held there by inline styles, the empty province note
at 1.1:1, gold labels at 3.85 to 3.88:1 where 4.5 is needed. A darker gold
token was added for small text on sage; the inline whites were deleted rather
than overridden, because an inline style beats every rule.

Usability, all found by driving the pages rather than reading them:

| Fault | Fix |
|---|---|
| The compare page showed Show differences, Print and Change selection with nothing selected. An inline `display:flex` beat the `hidden` attribute, the same bug class as the answer panels. | The rule moved to the stylesheet and the group is hidden until two farms are picked. |
| A comparison lived only in this browser's storage, so a buyer could not send it to a partner, a bank or a valuer, who are the people the schedule is written for. | `?ids=` in the address bar wins over storage, and the address bar is kept in step with the selection, so the link on screen is always the one being viewed. |
| Ten filter chips wrapped to 220px on a phone, a quarter of the screen before a single farm. | One scrolling row, snapped, 43px, with the shortlist count pinned in view. |
| "0 farms currently listed" for a type with no stock read as though the agency had nothing. | The line names the filter: "0 farms under Poultry Farm". |
| The similar farms heading said these are what a buyer of this one "usually looks at", which is behaviour the site cannot know, and it claimed a type match even when nothing else shared the type. | The heading says what it can prove and the note states the actual ground each set was matched on. |
| A dead corner under the province list. | The empty province note carries the action a buyer in that province needs. |
| The Compare control on every card was 95 x 18px, footer and breadcrumb links 19 to 20px, all under the 24px minimum. | 26px minimum on all three. |
| The document went h1 then h3 on listings: nine card titles with no section heading above them. | The map heading is an h2 and the results list has one. |
| Four pages carried no structured data and none carried breadcrumbs. | BreadcrumbList on five pages, plus CollectionPage, AboutPage and ContactPage. |
| The logo shipped a 480px, 41KB file into a 51px slot on every page, header and footer. | 160px, 11KB. |
| An eyebrow over a centred heading over a card grid, which is the exact rhythm on the ban list. | Left aligned split with a lede that says something. |
| "Building dreams one farm at a time" on the about page, and its paragraph duplicated the homepage. | Replaced with what actually happens before a listing goes live. |
| Three label sizes doing one job: 12px, 13px and 15px. | Breadcrumbs, eyebrows, column labels and counts all take `--fs-label`. |

Two regressions introduced in this round and caught before it closed: a grid
rule written outside its media query forced two columns on a phone and pushed
a button 88px off screen, and a nowrap button with a long label widened the
document by 30px.

---

## Standing verification

Run after every change in this session:

- **32 page and width combinations** at 390, 768, 1280 and 1536: no console
  errors, no failed requests, no broken or pending images, no horizontal
  overflow, every scroll reveal resolving to opacity 1.
- **OS sweeps**: `ground-sweep` clean at 390 and 768, `align-sweep` clean at
  768, 1280 and 1440 with no hardcoded nudges, `repeat-sweep` zero overlapping
  pairs on every page.
- **Value strip**: every page alternates. index photo, canvas, white surface,
  ink, photo, ink. listings photo, ink, canvas, white surface, ink. about photo,
  canvas, white surface, ink, photo, ink. contact photo, canvas, ink, ink.
- **One value per role**: one h1, h2 and h3 size per page; two body sizes;
  nothing below 12px; button radius one value.
- **Contrast** measured by compositing alpha over the real ground, never from
  computed styles: three earlier "failures" were the translucent-ground
  artefact recorded in OS `memory/LESSONS.md`.
- **Print**: header, enquiry card, bond, similar farms, map and tabs hidden; all
  ten spec groups open; two columns; contact footer present; ink bands print
  black on white.
- **Reduced motion**: hero pinned to frame 1 with no animation, every reveal
  visible, counters at their final value.
- **No JavaScript**: 24 of 24 reveals visible, counters show real numbers.

## Known gaps, carried

1. Nine demo listings to be replaced with real mandates.
2. Social scrapers do not run JavaScript, so a shared farm link shows the
   generic card. Fixing this needs a build step or an edge function.
3. `assets/` is about 15MB on disk because of the responsive variants. What a
   visitor downloads is 68 to 85 per cent less than before the variants existed.
4. Repeat-sweep reports six overlapping pairs, all declared: a farm named
   both on its card and in the answer quoting it, and the Melkhout description
   restating figures its own schedule lists.
5. `api/send-mail.js` sets `Access-Control-Allow-Origin: *`, has no rate limit
   and returns raw SMTP error text.
6. Form delivery never tested end to end: it would send real mail to the client.
7. Screen readers not tested with NVDA or VoiceOver; findings are from the
   Chrome accessibility tree.
