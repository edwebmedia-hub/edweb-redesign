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

## Round 5, 2026-09-01: the experience pass

Full-page captures of six pages at 375 and 1440 first, 34 faults and gaps
listed before any code. The themes:

**The farm page spoke in reference numbers.** The breadcrumb ended in
ERF-DRY-009 and wrapped mid-token on a phone; the same ref repeated in the
eyebrow directly below; the messaging button was addressed to the ref; the
enquiry card was headed "Enquire on ERF-DRY-009" and its prefilled message
repeated the ref a fifth time. Every one of them now names the farm. The ref
lives in one place, the eyebrow, where a valuer expects it.

**A phone buyer paid four screens of chrome before the price.** Four stacked
full-width action buttons between title and price became a 2x2 grid, 129px.
The gallery stacked four screen-height photographs down the page, about
4000px; now the lead photograph plus a row of thumbnails, 338px, all opening
the same lightbox, which also answers a swipe now.

**A 6700px page got an in-page nav.** Photos, About, Schedule, Bond, Similar,
Enquire; sticky under the header, the current section marked in gold by a
scrollspy, one scrolling line on a phone, hidden in print. The enquiry card
holds sticky beside the long about text.

**Cards dropped a third of their furniture.** The FOR SALE chip said nothing
on a site where every farm is for sale; only a status that differs (New
listing) earns the corner. The gold square before "facts recorded" was the
same family as the chip dot already banned; the credentials list carried the
same squares, now thin rules. The save button lost its translucent blur
(recorded ban) for solid paper with a shadow.

**The six services became the question pattern.** Six identical stacked rows
are the exact shape the tabs-for-repeated-sections rule names. Same mechanic
as the buyer questions, one pattern site-wide; the wiring now handles every
tablist on a page, not just the first.

**Forms answer at the field.** One generic sentence for three different empty
fields became a message at each field, specific ("That email address does not
look right"), focus moved to the first, cleared the moment typing starts,
aria-invalid and describedby set. Error red tokenised; the last two ad-hoc
hexes in the file are gone.

**Navigation feels like one site.** Cross-document view transitions with the
header holding still while the page fades under it; smooth in-page scrolling;
scroll-driven drift on the hero and the photo bands (statement and cta moved
from overflow hidden to clip, the recorded view-timeline lesson); a press
state on every button; brand gold selection colour; theme-color on all eight
pages so the phone browser chrome matches the header. All of it absent under
prefers-reduced-motion, measured: hero and band animations compute to none.

Verified after: 32 page and width combinations clean; ground and align sweeps
clean; repeat-sweep has three new pairs, all the farm's own name in the crumb,
the About heading and the Enquire heading, which is the point of naming the
farm; no-JS still shows one open panel per tablist and all reveals visible;
scrollspy marks Bond at the bond band; field errors render, focus and clear;
tray absent on the compare page; zero page errors anywhere.

## Round 6, 2026-09-01: independent review, fresh context

`site-reviewer` verdict RETURNED, one blocker: **"nine provinces" claimed as
stock while the data holds farms in seven.** The map intro said "9 farms on
the books across nine provinces" one screen above a map drawing Gauteng and
North West muted; the footer repeated "for sale across all nine South African
provinces" on seven pages; the index meta, OG description and hero lede said
"we list, in all nine provinces". Same truth class as the "103 facts" blocker
in round 2, and static text, so replacing the demo data would not have fixed
it.

Cleared: the map line now derives its province count from the same data that
paints the pins ("9 farms on the books in seven provinces", "all nine" only
when it is true); every static line is service-area framing ("for sale across
South Africa, with mandates taken in any of the nine provinces"), which stays
true whatever the stock does. Acceptance grep: the only remaining "nine
provinces" strings are the mandate framing and the search filter's own scope
label.

Material gaps from the review, disposition:
1. Ghost buttons over photography (hero, cta, 404) sit against the recorded
   no-transparent-buttons ruling. Edgar has seen these through five rounds
   without objecting; left for his call, one token swap if he wants them solid.
2. Meta and lede present-tense claims: fixed with the blocker.
3. No DECISIONS.md by that name; HANDOFF.md carries the record. Left.
4. Launch-blocking carried gaps restated: send-mail CORS wildcard, no rate
   limit, delivery untested, demo data and retention periods awaiting
   Martiens. All already in this report and CONFIRM-BEFORE-LAUNCH.md.

Reviewer confirmed working end to end in its own context: field validation,
?ids compare with URL in step, chips syncing, shortlist persistence, bond
maths with aria-valuetext, lightbox cycle, keyboard tablists, per-farm heads
and schema, noindex not-found, inert honeypot, three widths with zero
overflow, no em-dashes, no banned phrases, token-pure CSS.

## Round 7, 2026-09-02: /better, full-width sweep

Full-page captures of eight pages at 375, 768, 1280 and 1440 first; 34 faults
listed before code, heaviest at 768, the width no earlier round had walked.

Structural:
- **The bond panel stopped being two-thirds empty.** Three full-width rows,
  label, track, value, filling the panel; one slider definition instead of a
  base plus two patch-blocks fighting it (tracks were computing back to 2px).
- **Compare header columns share one geometry.** The 1px table-cell height
  trick makes height:100% real inside th, so the price pins to one shared
  line however the names wrap. Measured: photo tops 632/632/632, price
  bottoms 925/925/925 at 768; 968/968/968 at 1280.
- **The 404 became a route back in**: six farm-type chips styled for the dark
  ground, instead of a dead end with two buttons.
- **Ghost buttons are gone.** The transparent-over-photo secondary button sat
  against the recorded no-glass-buttons ruling on the hero and three CTAs;
  all five are now solid paper. .btn--ghost no longer exists in the file.

Tablet (768):
- Farm action row wrapped 3+1 with SHARE orphaned; the 2x2 grid now holds to
  900. The gallery put 3 thumbnails in a 2-column grid, leaving a dead cell;
  three-across now fills the row.

Mechanics and audit debt:
- Gallery images carry width/height (four were shifting the page).
- The lightbox uses the responsive variants instead of the full original.
- Cache-Control shipped: a day plus revalidation on /assets, no-cache on /data.
- #all-farms reserves its ground (listings CLS 0.22 measured earlier).
- Both forms say what to do when JavaScript is off.
- Farm pages inject BreadcrumbList alongside Product; similar-farms band is
  aria-labelled; the map heading is level 2 by aria-level while keeping the
  sub-heading size, which restores one h2 size per page.
- Heading skips healed on compare and privacy with hidden h2s.
- Target floor on the enquiry-card and footer link stacks (19 to 21px before).
- The old ".bond-f input" patch-blocks and the ghost button pair deleted:
  the dead-CSS complaint from round 6, settled by removal.

Declared, not fixed: inline mailto links inside privacy paragraphs measure
under 24px, which is the WCAG inline exception; the 160px logo serves 3x
screens at 51 CSS px slightly soft, accepted; repeat-sweep's nine pairs are
the farm's own name in crumbs and headings plus the Melkhout prose, declared
in rounds 3 and 6.

Verified after: 32 page and width combinations clean; ground and align sweeps
clean; tablist, counters, no-JS, reduced-motion and detail feature tests all
passing; the bond, gallery, action row, compare headers, 404 and hero buttons
re-captured.

## Round 8, 2026-09-02: reviewer blocker and gaps cleared

Fresh-context reviewer verdict on round 7: RETURNED, one blocker, and it was
round 7's own regression. The 1px table-cell height trick that pins the
compare header columns collapsed the header cells in the stacked phone mode,
printing all three columns of names, refs and prices over the first 220px of
the table at 375 to 640. The trick is now scoped to 641px and up, and the
stacked mode resets cell heights. Acceptance run: at 375, 390, 560 and 640,
with two and with three farms, the deepest header pixel sits 14px above the
first row, all eight combinations; the 375 capture shows all three headers
legible above an uncovered At a glance row.

Reviewer gaps cleared in the same pass:
- Desktop farm pages wrapped four action buttons 3+1 with SHARE orphaned
  (the same fault round 7 fixed at 768, still shipping above 900). Four on
  one row at 1280 and 1440, measured one distinct row top; 901 to 1100 gets
  a deliberate 2x2.
- "Registered" was ellipsised in the card fact tray at 375 (80px word, 78px
  cell). Values may wrap, and below 420px the value size steps once so the
  word fits whole; zero overflowing trays across all nine farms.
- listing.html with JavaScript off said "Loading this farm." forever; a
  static noscript now names the phone number and email.
- Throttled-mobile numbers logged for the first time (375px, slow 4G, 4x
  CPU): LCP index 2.9s, listings 1.7s, listing 3.4s; CLS 0.019 / 0.001 /
  0.047. Listings CLS was 0.178 in the same run before the map band and
  chips row reserved their measured heights (the injected map was stepping
  the cards band down). The two LCPs above 2.5s are the full-bleed
  photography under 4x throttle; recorded as accepted risk.

Left for Edgar: outline (transparent-background, hairline-border) secondary
buttons on flat light grounds (map band, about, compare CTA). The recorded
ban covers glass over photography, which is gone; whether flat-ground
outlines follow is his call, one token if so.

Verified after: 32 page and width combinations clean; acceptance suite green
(compare 8/8, one action row at both desktop widths, zero tray overflows,
honest no-JS state).

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
