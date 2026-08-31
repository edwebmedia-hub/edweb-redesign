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
| Three-across property card row | No | Uneven 4/2 then 3/3 grid, feature card first |
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
  the gold dot) and the recorded fact count for that farm.
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
- **Compare**, the feature the uniform schedule exists for. Tick up to three
  farms, a tray rises with the selection, and `compare.html` lines them up
  field for field across the union of every section either farm answers.
  Rows where they differ are shaded, a toggle hides the rows where they agree,
  and fields one farm does not answer read "Not recorded" rather than blank.
  It prints too. No other SA farm portal can do this, because no other one
  holds the same fields on every listing.

## Pages
- `index.html` hero, search rail, 4 farms, agency split, counters, farm-type
  chapter, the listing schedule, the mandate, six services, CTA
- `listings.html` search, filter chips, sort, shortlist filter, empty state
- `listing.html?id=` JS-rendered from `data/listings.json`: gallery, 6-fact grid,
  description, 10 spec groups, sticky enquiry form
- `compare.html` side by side schedule comparison of two or three farms
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

## Weight
The asset folder was cut from 23.8 MB to 7.4 MB, a 69 per cent reduction: twelve
leftover images from earlier iterations that nothing referenced were deleted,
and the rest were re-encoded to the size they actually render at. Full-bleed
backdrops cap at 1800px q78, everything else at 1400px q72. Largest single
file is now 502 KB. Re-run that pass if large originals are added.

## Verification (2026-08-28, headless Chrome via puppeteer-core)
Every page at 1440, 768 and 390:
- 32 page and width combinations swept: 0 console errors, 0 failed requests, 0 broken images
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
