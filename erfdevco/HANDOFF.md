# ERFDEVCO static site: handoff

Last rebuild: **2026-08-28** (v7, Altnest direction). Branch `erfdevco-custom`.

## What this is
A pure static site (HTML + CSS + vanilla JS, no build step) for ERFDEVCO, the
South African farm and agricultural property agency run by Martiens Du Plessis.
It is intended to replace the WordPress + Directorist build at erfdevco.com.

## Design direction
Look target: **altnest.webflow.io**, measured live in a browser at 1440. What
was taken from it, and what was deliberately changed:

| Measured on the reference | Kept | Changed for ERFDEVCO |
|---|---|---|
| Tenor Sans 400, uppercase, negative tracking (-0.06em at 84px) | Yes | Same face, same tracking curve |
| Instrument Sans 400, 16/24 body | Yes | Same |
| Flat 140/140 section rhythm | Yes | Fluid `clamp(5.5rem, 8.6vw, 8.75rem)`, still flat |
| Container 1550 / 15px gutters | Narrowed | 1480, gutter `clamp(1.25rem, 3.2vw, 2.75rem)` |
| Radius set 4 / 5 / 6 / 100% | Yes | 6 media, 6 card, 4 chip, 4 field |
| One full-bleed black chapter band | Yes | Estate green `#0b1710`, not black |
| Blue-grey body text `#475676` | No | Warm green-grey, derived from the brand ink |
| Three-across property card row | Partly | Every card one size: home two across, listings three across |
| Hero with two buttons | No | Hero plus a **search rail fused to its bottom edge** |
| "Featured developments" black band | No | **Browse by farm type**, a 3x3 tile block, no empty cell |
| Testimonial slider | No | **The mandate**: real credentials, no invented testimonials |
| Odometer sales stats | No | Counters on what the listing schedule holds (all true) |

The one section with no equivalent on the reference is **the listing schedule**:
the eighteen sections and 103 fields of ERFDEVCO's real Directorist listing form,
published as the promise the site makes to a buyer. That is the site's own idea
and the reason its listings read differently from Property24's.

## Brand tokens (`:root` in styles.css)
Four values, everything else derived with `color-mix()`. Never add a stray hex.

- `--ink` `#12271d` estate green
- `--ink-deep` `#0b1710` chapter band and footer
- `--gold` `#c8900a` the single accent, used **only on ink** (6.5:1)
- `--paper` `#ffffff`
- `--gold-deep` = `color-mix(--gold 60%, --ink)`, the light-ground gold. Mixed to
  60% so it clears 4.5:1 on **both** paper (5.51:1) and the stone band (4.70:1).
  Do not lighten it back toward `--gold` without re-measuring.

Type: **Tenor Sans** display (uppercase, negative tracking), **Instrument Sans** body.

## What the site actually does
Not a brochure. The pieces that make it behave like a working portal:

- **Hero** crossfades three frames of South African land on a 27s cycle, each
  frame drifting in scale. Held still under `prefers-reduced-motion`.
- **Search rail** fused to the hero's bottom edge: farm type, province, extent.
  Routes to `listings.html` with query parameters the listings page reads.
- **Listings** filter by farm type, sort by most recently listed, price either
  way and extent either way. Filter state syncs to the URL, so a filtered view
  is a shareable link.
- **Shortlist**: a heart on every farm, stored in `localStorage` under
  `erfdevco:shortlist`. Never leaves the device, never posted anywhere. The
  Shortlist chip carries a live count and filters to saved farms only, with its
  own empty state.
- **Cards** carry the reference, farm type, status (a genuinely new listing gets
  the gold dot) and the recorded fact count for that farm. Every card is the
  same size on every page: the home page runs two across, the listings page
  three, and one card never gets a feature treatment the others do not.
- **Farm page** opens on a schedule spine: section names down the left with
  their field counts, one panel open beside them, a gold marker on the selected
  section, arrow keys moving between them. "All sections" opens the lot.
- **Schedule meter** states the farm's own numbers: measured facts recorded and
  how many of the 18 sections apply, with a line saying sections that cannot
  apply are left out rather than filled in.
- **Photo viewer** on the gallery: click or keyboard, arrow keys to move, Escape
  to close, focus returned to the thumbnail that opened it.
- **Print the schedule** turns the farm page into a clean paper brochure: no
  chrome, every section open regardless of the tab, two columns, and a contact
  footer for whoever is holding the page. See section 22 of styles.css.
- **Direct enquiry** per farm: the form prefills the reference, and the chat
  link carries the reference, title and price in its message.
- **Free text search** across title, district, province, farm type, reference
  and summary, debounced, cleared with Escape.
- **Map search** on the listings page. Real province outlines from Natural
  Earth 1:50m admin-1 data (public domain, CC0), reprojected to Web Mercator,
  Douglas-Peucker simplified to 12 KB of path data and served from
  `data/za-provinces.json`. Farms are pinned at their district's real
  coordinates through the same projection, so every pin lands inside its own
  province (verified with `isPointInFill`). Provinces holding stock are
  interactive, empty ones are muted. Clicking a province filters the list and
  writes to the URL; pins for filtered-out farms fade. The province tally
  beside the map does the same job for keyboard and screen readers. If the
  geometry fails to load the whole panel removes itself rather than taking the
  listings down with it.
- **Bond calculator** on every farm page. Deposit, rate and term as sliders
  over the standard amortisation formula, returning the monthly repayment, the
  deposit, the amount bonded and total interest. Nothing is sent anywhere and
  the default rate is a starting point, labelled as arithmetic rather than a
  quote.
- **Similar farms** under each listing, matched on farm type first, then
  province, then price proximity.
- **Share** on each farm: the native share sheet where the browser has one,
  clipboard everywhere else, with the button confirming the copy.
- **Structured data** per listing, injected as `Product` with a ZAR `Offer`
  and the extent, province, farm type and recorded field count as
  `additionalProperty`, so a farm can surface as a rich result.
- **Compare**, the feature the uniform schedule exists for. Tick up to three
  farms, a tray rises with the selection, and `compare.html` lines them up
  field for field across the union of every section either farm answers.
  Rows where they differ are shaded, a toggle hides the rows where they agree,
  and fields one farm does not answer read "Not recorded" rather than blank.
  It prints too. No other SA farm portal can do this, because no other one
  holds the same fields on every listing.

## Pages
- `index.html` hero, search rail, 4 featured farms in a 2x2, agency split, counters, farm-type
  chapter, the listing schedule, the mandate, six services, CTA
- `listings.html` search, filter chips, sort, shortlist filter, empty state
- `listing.html?id=` JS-rendered from `data/listings.json`: gallery, 6-fact grid,
  description, 10 spec groups, sticky enquiry form
- `compare.html` side by side schedule comparison of two or three farms
- `data/za-provinces.json` province geometry for the map (Natural Earth, CC0)
- `about.html`, `contact.html`, `404.html`
- `sitemap.xml`, `robots.txt`, `vercel.json` (cleanUrls + security headers)

## Listings data
`data/listings.json` holds **nine sample farms**, marked as demo in the file's
`note` field. Seven provinces, eight farm types, R6.95m to R37.8m, 21 ha to
3 400 ha, so the filters, the search and the sort orders all have something
real to bite on:

| Ref | Farm | Province | Type | Extent | Price |
|---|---|---|---|---|---|
| ERF-VIN-014 | Weltevrede Vineyard Estate | Western Cape | Vineyard / Orchard | 68 ha | R24 500 000 |
| ERF-LST-021 | Grootvlei Cattle & Grazing Farm | KwaZulu-Natal | Livestock | 412 ha | R16 800 000 |
| ERF-GAM-008 | Rietfontein Game Farm | Limpopo | Game | 1 240 ha | R31 000 000 |
| ERF-IRR-033 | Sonop Citrus & Irrigation Farm | Limpopo | Irrigation | 186 ha | R28 900 000 |
| ERF-CRP-042 | Rietkuil Grain & Sunflower Farm | Free State | Crop | 780 ha | R21 500 000 |
| ERF-LST-047 | Kareepoort Sheep & Karoo Grazing | Northern Cape | Livestock | 3 400 ha | R14 200 000 |
| ERF-DRY-009 | Melkhout Dairy Farm | Eastern Cape | Dairy | 268 ha | R32 500 000 |
| ERF-MIX-027 | Nooitgedacht Macadamia Estate | Mpumalanga | Mixed | 154 ha | R37 800 000 |
| ERF-SMH-053 | Klipheuwel Olive Smallholding | Western Cape | Smallholding | 21 ha | R6 950 000 |

Each is built to the shape of the real listing form so the layout can be judged
on real content. **Replace all nine with real mandates before launch.** The spec
group keys match the form's own section names, so a real listing is a
copy-and-fill job, not a schema change. `factCount` and `sectionCount` are
derived, not typed: regenerate them if you edit a farm's `specs`.

Photography is licence-free Pexels stock in `assets/`. Swap for the client's own
property photographs as mandates come in.

## The /better pass (2026-09-01)
A deep quality pass run against 39 faults found by measurement and full-page
captures at 375, 768, 1280 and 1440, not by guessing. What changed structurally:

**The ground.** The page ran on pure white with a 5% stone tint doing the work
of alternation, which is exactly the failure Edgar has named: a 5% deeper shade
of the same paper is the same value. The page ground is now warm canvas
`--canvas #f6f4ef`, panels and cards are white surfaces on it, and real
alternation comes from ink bands. The listings map became a full-bleed ink
band, the farm page's schedule became an ink band, the compare page gained an
ink masthead where it previously opened on white, and contact gained a dark
band. Measured strips now alternate on every page.

**Cards.** A farm card was a photo with a naked body on a flat page. It is now
a white surface with a hairline and one hover lift, and the three facts that
sell the farm sit in a measured tray at its foot: value first, label under it,
instead of a grey sentence. Titles reserve two lines so price and tray line up
across a row.

**The farm page.** The three headline figures now open the page at 3rem and
the remaining three sit quieter below the gallery, so no figure is stated
twice. The bond heading stopped being a half-empty row.

**Type.** Five body sizes became two roles. Nothing renders below 12px.
Paragraph measure capped so nothing runs past about 68 characters.

**The bans.** Eyebrows went from one above nearly every heading to three that
carry real data (an error code, a category, a listing reference). The status
chip lost its dot and reads white. Both on Edgar's instruction.

**Filters.** Price band, extent band and a clear-all, which a property portal
needs and this did not have.

Contrast was re-measured by compositing alpha over the real ground rather than
from computed styles, because three of the failures the naive sweep reported
were the translucent-ground artefact recorded in OS memory. All pass.

## Correctness pass (2026-08-28, found by auditing rather than guessing)
Four real defects the audit turned up, all fixed:

1. **The forms were losing data.** The contact form collected a reason and a
   province and posted neither, so a seller who picked "I want an idea of what
   my land is worth" in the Free State reached the inbox as an unlabelled
   message. Both forms now send every field the visitor filled in, plus the
   page they sent it from, and the subject line names the reason so an enquiry
   can be triaged from the inbox list. The farm enquiry also carries its
   reference and the listing URL.
2. **Farm pages were `noindex`.** On a property portal the listings are the
   pages that should rank. The robots tag is gone and each farm now sets its
   own title, description, canonical and share card from its data as it
   renders, and all nine are in the sitemap.
3. **The bond sliders were mute to screen readers** ("20", not "20 per cent"),
   and the schedule spine was a tablist in class name only. Sliders now carry
   `aria-valuetext`, panels are real `tabpanel`s owned by their tabs, and the
   tabs use a roving tabindex so Tab reaches the group once and arrows move
   inside it.
4. **Images were four times larger than they rendered.** A card 370px wide was
   downloading a 1400px file. Every photograph now has 480w, 800w and 1200w
   variants with `srcset` and real `sizes`, wired into the static pages and
   into the cards, galleries and comparison thumbnails the script renders.
   Measured on the listings page: 68% fewer image bytes at 390, 85% at 768 and
   73% at 1440.

## Weight
The asset folder was cut from 23.8 MB to 7.4 MB, a 69 per cent reduction: twelve
leftover images from earlier iterations that nothing referenced were deleted,
and the rest were re-encoded to the size they actually render at. Full-bleed
backdrops cap at 1800px q78, everything else at 1400px q72. Largest single
file is now 502 KB. Re-run that pass if large originals are added.

## Verification (2026-08-28, headless Chrome via puppeteer-core)
Every page at 1440, 768 and 390:
- 32 page and width combinations swept: 0 console errors, 0 failed requests, 0 broken images
- both form payloads captured and inspected, not assumed: every field arrives
- map: all 9 pins verified inside their own province via SVG isPointInFill
- bond maths checked by hand: R26m at 11.75% over 15 years is R307 874 a month
- 0 horizontal overflow at any width
- 28 of 28 scroll reveals resolve to opacity 1 (plus 60ms, 2.6s and 9s sweeps)
- counters animate to 103 / 18 / 10 / 9
- contrast: gold-deep on paper 5.51, on stone 4.70; gold on ink 6.51; muted on
  paper 8.53; ink on gold button 5.59. All AA.
- interactions exercised: hero search rail routes to `listings.html?type=&province=`,
  filter chips filter and sync the URL, empty state renders, card click opens the
  detail page, form validation fires, one POST reaches `/api/send-mail`, honeypot
  short-circuits, mobile nav opens and closes, header goes solid past 40px.

## Preview
`.claude/launch.json` has two entries for this folder: `erfdevco` on 4210 and
`erfdevco-alt` on 4211, so two sessions can preview at once.

Phone-viewable Artifact of the whole design:
https://claude.ai/code/artifact/ebc59c79-3947-47d4-b210-f0a8b65e703e

## Known gaps before launch
0. **MPRE removed 2026-08-28.** "Master Practitioner in Real Estate" was on the
   site 10 times but is not on the approved email signature and nothing in this
   project confirms it. Removed rather than shipped on an assumption. If
   Martiens confirms he holds it, it goes back in one pass. See
   CONFIRM-BEFORE-LAUNCH.md.
1. Nine demo listings to be replaced with real mandates.
2. `api/send-mail.js` posts to `info@erfdevco.com` and needs `SMTP_PASS` set as
   an env var at deploy time.
3. No real physical address published: the client has only ever confirmed
   "Kleinbaai, Western Cape".
4. Domain swap from the WordPress build is a separate decision, not done here.

## Rules that bite in this folder
- `script.js` is shared by every page. Each feature guards its own markup, so a
  page missing a block does not break the rest. Keep that pattern.
- Reveal-on-scroll must never leave content invisible: the hidden state is armed
  only by the `.js` class on `<html>`, and three sweeps force everything visible.
- No em-dashes or en-dashes anywhere in output. Swept clean.
- One site per branch: this work belongs on `erfdevco-custom` only.

---

# Session addendum, 2026-08-28 (email + Property24 thread)

This section covers work done in a parallel chat that is not reflected above.

## CRITICAL: info@erfdevco.com does not exist

Verified in Hostinger hPanel on 2026-08-28. The domain erfdevco.com has:

- exactly ONE mailbox, `martiens@erfdevco.com`
- no email alias
- no forwarder
- no catch-all

So anything sent to `info@erfdevco.com` bounces. It was published in several
places and all of them are now pointed at `martiens@erfdevco.com`:

- `index.html` JSON-LD `email` field
- `contact.html` (mailto link and the general-enquiries row)
- `api/send-mail.js` `CLIENT_EMAIL` constant, which is where the contact form
  delivers. This one was the real bug: every form submission would have
  bounced.
- `api/chat.js` system prompt

The printed yard board, the SOLD board and the Martiens email signature only
ever used `martiens@erfdevco.com`, so nothing printed is affected.

If the client wants info@ to work it has to be created as an alias in hPanel
first. Do not put it back on the site before that exists.

## Mailbox is full and it is not the client's mail

`martiens@erfdevco.com` sits at 1023.96 MB of 1024 MB on Hostinger's **Free
Business Email** plan (1 GB per mailbox). Every other Edweb domain is on the
same free plan, they are just not full.

Checked every folder in Titan webmail: Inbox, Sent, Drafts, Spam all empty.
Trash was emptied during the session and freed about 40 KB. Seven sub-folders
sit under Trash and are all empty: Agente, Lauricia, Capitec, Discovery Bank,
MJ, Prop 24, Prop24. No email import was ever run. No catch-all, no forwarders.

So the server is charging for data that is not visible in any folder. That is
either IMAP mail deleted but never expunged, or a quota counter that has not
recalculated. Neither is fixable from the webmail screen.

A folder named "Capitec" appeared in the list mid-session, which means an IMAP
client (Martiens' Outlook) is connected and actively syncing his personal mail
structure into this business mailbox. Those folder names are his own filing
folders, not anything ERFDEVCO generated. If the quota is cleared and Outlook is
left as it is, it will refill.

Next action, for Edgar: Hostinger live chat, ask them to recalculate the mailbox
quota and purge deleted-but-unexpunged data. Wording is in the chat. Then check
Outlook on Martiens' side. Do not upgrade the plan until that is done.

While it sits at 100% the mailbox rejects incoming mail with attachments.

## Property24: PropCtrl question, email drafted but NOT sent

Client wants listings pushed from the new site to Property24 plus three or four
other portals. Open question: is PropCtrl required.

Researched and verified by opening the pages:

- **PropCtrl is Property24's own back-office product**, not a third party.
  property24.com/products/online-management-software calls it "SA's favourite
  real estate back-office system". Pricing is "office dependent" and the public
  rate card link 404s, so only the account manager can quote it.
- **PropCon is a separate company** (propcon.co.za) that syndicates one listing
  to Property24, Private Property, ImmoAfrica and Gumtree. Farms and vacant land
  are supported property types. It has a public pricing calculator and a free
  trial. This already solves the multi-portal requirement out of the box.
- Third-party systems demonstrably do feed Property24 (PropCon, Prop Data,
  Entegral, Cloud Property Solutions all syndicate into it).

NOT verified, and this is what the email asks:

- whether Property24 will accept a feed from a plain website rather than an
  established CRM vendor
- what PropCtrl costs
- what PropCon costs

A short email to Caron at Property24 was drafted in chat and approved by Edgar
but had not been sent when this chat was parked. It asks four things: can we
load listings straight into a P24 back office, what does PropCtrl cost for a one
office agency, can P24 pull automatically from erfdevco.com, and is there a bulk
CSV upload.

Her answer decides the architecture:

- **If P24 takes a feed:** build one feed off the site, every portal pulls the
  same one, the website stays the master record. Cheapest and cleanest.
- **If P24 insists on a CRM:** the CRM becomes the master record and the website
  reads from it instead. More work, plus a monthly fee. PropCon likely beats
  PropCtrl there because PropCtrl only serves Property24 while PropCon covers
  four portals. Neither has been priced.

## Content fixes made this session

- Eyebrow labels sat above all eight sections, which is the repetition tell in
  the OS taste profile. Cut to two.
- A counter claimed "103 fields per listing". No listing has 103, the demo data
  populates 60 to 68 because a vineyard does not answer the game-farm section.
  Relabelled to "fields in the schedule".
- Statement headline was "Building dreams one farm at a time", an empty-verb
  headline banned in the AI-slop six. Now "One practitioner, one mandate, one
  farm at a time".
- The site spelled the client "Martiens du Plessis". The approved email
  signature spells it "Du Plessis". Fixed across five pages.

## Verified client facts, do not re-ask

Checked against the email signature Edgar approved and installed in Hostinger
webmail (`Desktop/Companies/ERFDEVCO/erfdevco-signature-martiens.html`):

- phone `082 900 5019`
- `B.Econ (Stell.)`
- `Registered with the PPRA`
- based in `Kleinbaai, Western Cape`
- name spelled `Martiens Du Plessis`

Still unverified: the MPRE / Master Practitioner in Real Estate designation.
See CONFIRM-BEFORE-LAUNCH.md.

## Session close 2026-09-03 evening (rounds 12 + receptionist live + cuts)

State on disk = state on production https://erfdevco.vercel.app (deployed after
every change below; branch erfdevco-custom pushed to origin at ef0b18a).

Shipped this stretch:
- AI receptionist LIVE end to end: api/chat.js + assets/chat-widget.js on all
  pages. ANTHROPIC_API_KEY is set on Vercel production (Edgar's own console key
  "erfdevco-site"; console also holds an unused spare "erfdevco-prod" that
  Edgar was told to delete). 30-question guardrail suite re-run against the
  live endpoint 2026-09-03: QA-REPORT.md "Round 12b" + raw transcript in
  CHATBOT-GUARDRAIL-RESULTS.json (vercelignored). Verdict: passes; two soft
  notes (phone-only lead not asked for name; 4 replies over 55 words).
- Round 12 mobile pass: credentials stack flush-left under 640, all big-photo
  scrims lightened + turned vertical on mobile, photo grade filters, chat fab
  52px mobile.
- Hero: sunny land-caledon-fields frame now leads the crossfade (storm frame
  second with its own brightness lift), preload updated, scrims thinned again.
- REMOVED from home at Edgar's order: the "One practitioner" statement band and
  the "Six services" tab section. Statement CSS stripped (credentials list kept
  for about.html). Home now ends buyer-questions then footer.
- Hero line trimmed to "Farms sold on what the land carries" (gold on
  "carries"), title cap 22ch: 2 lines desktop, 3 mobile.

OPEN, next session:
1. Mobile hero text pick pending. Edgar has 3 live-CSS options on his phone:
   https://claude.ai/code/artifact/d25d29fd-652f-489b-9c4a-935db6ce5c37
   He answers "hero 1/2/3". Build the winner EXACTLY as shown from these
   overrides (all inside @media (max-width:640px)):
   - hero 1 Tidy: .hero{min-height:100svh;padding-bottom:2.75rem}
     .hero__lede{font-size:.95rem;line-height:1.55;max-width:38ch;margin-bottom:1.6rem}
     .hero__actions{display:grid;grid-template-columns:1fr 1fr;gap:.7rem}
     .hero__actions .btn{padding-inline:.4rem;justify-content:center;font-size:.72rem;letter-spacing:.06em}
   - hero 2 Editorial: .hero{min-height:100svh;padding-bottom:2.5rem}
     .hero__inner{border-left:4px solid var(--gold);padding-left:1.25rem;margin-left:.25rem}
     :root{--fs-hero:2.05rem} .hero__title{letter-spacing:-.03em;line-height:1.06}
     .hero__lede{font-size:.9rem;line-height:1.6;max-width:34ch;margin-bottom:1.5rem;color:color-mix(in srgb,var(--paper) 76%,transparent)}
     .hero__actions{gap:.6rem} .hero__actions .btn{padding-inline:1.3rem;font-size:.75rem}
   - hero 3 Poster: .hero{min-height:100svh;align-items:center;padding-bottom:3rem}
     :root{--fs-hero:2.9rem} .hero__title{line-height:1.0} .hero__lede{display:none}
     .hero__actions{flex-direction:column;align-items:flex-start;gap:.75rem;margin-top:2.4rem}
   (Options were shot BEFORE the headline trim; the winner gets the current
   shorter headline. Screenshots showed the old 3-span markup; irrelevant.)
2. SMTP_PASS still unset on Vercel: chatbot leads and the contact form send no
   email. Needs martiens@erfdevco.com mailbox password. Blocks "leads work"
   claim to Martiens.
3. Token hygiene told to Edgar, unconfirmed: delete Vercel token vcp_4bKO...,
   delete spare console key erfdevco-prod.
4. Waiting external: Property24 answers (feed spec, cost, own-dev approval,
   test env); Martiens: MPRE yes/no + seller listing fee + real mandates to
   replace the 9 demo farms.
5. Launch gate list unchanged in CONFIRM-BEFORE-LAUNCH.md (incl. removing the
   X-Robots-Tag noindex in vercel.json at real launch).

## Evening round 13 (2026-09-03, after the session-close note above)

All APPROVED by Edgar ("perfect") and live at erfdevco.vercel.app, pushed at 472a7f8:
- 13 of his 17 chosen photos placed site-wide (hero crossfade, about splits,
  type tiles, CTA tractor, page heroes, 3 listing cards; 4 people/detail shots
  banked unplaced in that session's scratchpad only).
- Home page: statement + six-services sections REMOVED; five-questions became
  a native details/summary FAQ with the rose-vineyard photo right column.
- Hero settled after 6 rejected options: CENTRED CLASSIC (Helix/Tee-to-Trail
  shape, ruling harvested to OS TASTE-PROFILE), flat scrim, heading
  "Farms for sale in South Africa" with gold country. fs-hero 2.7-5.5rem.
- CTA band pans straight top-to-bottom with scroll. ROOT FIX with it: the
  sideways-overflow guard moved from body to html; body-level hidden had
  every scroll timeline dead since launch (memory lesson rule 10).
- Receptionist widget v2: pulsing gold-ring launcher with persistent
  "Ask about a farm" label until first open, branded panel (mark, gold rule,
  duty dot), avatar bubbles, row chips, round gold send, sessionStorage
  thread restore across pages. E2E tested live. Fixes: avatar CSS path needed
  assets/ prefix; .chat-chips[hidden] needed display:none (grid beat UA rule).

Still open, unchanged: SMTP_PASS (no lead/contact email), real mandates for
the 9 demo farms, launch gates in CONFIRM-BEFORE-LAUNCH.md, P24 + Martiens
answers. Vercel token from this session must be deleted by Edgar.

## Round 14 (2026-09-04): phone manners and answered hearts

All live and approved-in-passing, pushed at d0a8ed3:
- Chat on mobile: no label in the DOM at all (was rendering raw over the
  circle from stale cached CSS), native slide-up sheet, backdrop tap closes,
  swipe-down on the header closes, scroll locked behind, 16px input (no iOS
  zoom), no autofocus keyboard slam, safe-area padding. Chat layers moved
  above the site header (z 110/120/130) because the header stole taps.
- Every page now loads styles.css / script.js / chat-widget.js with ?v=14 so
  stale phone caches cannot resurface old CSS. Bump the number on future
  asset-affecting deploys.
- Hearts: tapping one now toasts "Saved to your shortlist. View it" linking
  listings.html#shortlist, which lands with the Shortlist chip active. The
  chip and counter already existed; now they are discoverable.
- Compare: thead cards condense when pinned (.cmp-table.is-stuck via a
  sentinel IntersectionObserver): photos/ref/district fold away, title+price
  strip ~99px, so the page scrolls as one piece.
- FAQ photo is absolutely positioned inside .faq-photo: the list defines the
  row height, the image can never stretch the section again.

Open unchanged: SMTP_PASS, real mandates, launch gates, P24/Martiens answers.
