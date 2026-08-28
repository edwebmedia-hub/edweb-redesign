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

## Pages
- `index.html` hero, search rail, 4 farms, agency split, counters, farm-type
  chapter, the listing schedule, the mandate, six services, CTA
- `listings.html` filter chips + province/size params, empty state
- `listing.html?id=` JS-rendered from `data/listings.json`: gallery, 6-fact grid,
  description, 10 spec groups, sticky enquiry form
- `about.html`, `contact.html`, `404.html`
- `sitemap.xml`, `robots.txt`, `vercel.json` (cleanUrls + security headers)

## Listings data
`data/listings.json` holds **four sample farms**, marked as demo in the file's
`note` field:

| Ref | Farm | Province | Extent | Price |
|---|---|---|---|---|
| ERF-VIN-014 | Weltevrede Vineyard Estate | Western Cape | 68 ha | R24 500 000 |
| ERF-LST-021 | Grootvlei Cattle & Grazing Farm | KwaZulu-Natal | 412 ha | R16 800 000 |
| ERF-GAM-008 | Rietfontein Game Farm | Limpopo | 1 240 ha | R31 000 000 |
| ERF-IRR-033 | Sonop Citrus & Irrigation Farm | Limpopo | 186 ha | R28 900 000 |

Each is built to the shape of the real listing form so the layout can be judged
on real content. **Replace all four with real mandates before launch.** The spec
group keys match the form's own section names, so a real listing is a
copy-and-fill job, not a schema change.

Photography is licence-free Pexels stock in `assets/`. Swap for the client's own
property photographs as mandates come in.

## Verification (2026-08-28, headless Chrome via puppeteer-core)
Every page at 1440, 768 and 390:
- 0 console errors, 0 failed requests, 0 broken images
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
1. Four demo listings to be replaced with real mandates.
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
