# ERFDEVCO: confirm with Martiens before the site goes live

Every fact below is published on the custom site. Verified items were checked
against the email signature Edgar approved and installed in Hostinger webmail
(`Desktop/Companies/ERFDEVCO/erfdevco-signature-martiens.html`).

## Verified, no action needed
- Phone `082 900 5019`
- `B.Econ (Stell.)`
- `Registered with the PPRA`
- Based in `Kleinbaai, Western Cape`
- Name spelled `Martiens Du Plessis` (capital D, now matched site-wide)
- `info@erfdevco.com` / `martiens@erfdevco.com`

## RESOLVED 2026-08-28: MPRE removed
- **"Master Practitioner in Real Estate" / "MPRE"** appeared 10 times across
  index.html, about.html, contact.html, listing.html, listings.html and
  script.js. It is NOT on the approved email signature and no source in this
  project confirms Martiens holds it, so **all 10 occurrences were removed**
  rather than shipped on an assumption. The site now claims only what is
  verified: Managing Director, B.Econ (Stell.), registered with the PPRA.
  **If Martiens confirms he holds it, say so and it goes back in one pass.**

## Numbers on the page, confirm they match his real listing form
- 18 schedule sections
- 103 fields across those sections
- 10 farm categories
Both the eighteen-section list and its per-section field counts are published
on the homepage. They came from the demo build, not from Martiens. The demo
listings themselves only populate 60 to 68 fields each, because a vineyard
does not answer the game-farm section.

## Demo content still in place
`data/listings.json` holds NINE sample farms (Weltevrede, Grootvlei,
Rietfontein, Sonop, Rietkuil, Kareepoort, Melkhout, Nooitgedacht, Klipheuwel).
They are realistic but invented, including their prices, yields, water figures
and listed dates. Replace with real mandates before launch, and remember the
comparison page publishes these numbers side by side, so a wrong figure is more
visible here than on a normal listing site.

## REMOVED 2026-09-01: two unverified commercial promises
Both were published seven times between them and neither was ever verified.
Both are now off the site. They go back the moment Martiens confirms them.

1. **Property24 syndication.** The site said "Every mandate goes onto
   erfdevco.com and onto Property24". Project notes record that Edgar agreed
   this service with the client on 2026-08-14 and that the client pays
   Property24 directly, but nothing confirms an agency account is live.
   **Action: confirm the Property24 agency subscription is active.**
   **Update 2026-09-01, answers from Property24 in writing:**
   - PropCtrl IS Property24's back office; capturing in PropCtrl is capturing
     into Property24. No separate route.
   - Property24 does NOT pull listings from external websites, and there is
     no spreadsheet/CSV bulk upload.
   - The capture-once route they name themselves: a developer-built API feed
     from our side into the Property24 portal, built to their specification.
     That developer is Edgar; the site's `data/listings.json` already holds
     every farm as structured data, so the feed would be generated from the
     same file that renders the site. erfdevco.com becomes the master record,
     Property24 the mirror.
   - The claim stays OFF the site until the feed (or manual PropCtrl
     capture) is actually live, not merely possible.
2. **"There is no listing fee."** A pricing commitment that appears nowhere in
   any record. The same notes mention a monthly labour fee to Edgar, which is
   not the same thing as free to the seller.
   **Action: ask Martiens what a seller actually pays, if anything, to list.**

## Staging deploy (2026-09-02)
Live for review at https://erfdevco.vercel.app with an `X-Robots-Tag: noindex`
header in vercel.json so the demo farms stay out of search. **Before real
launch: remove that header line** and point the real domain. The enquiry
forms on this staging link do not send mail yet (no SMTP environment
variable is set on the project); that is a launch-checklist item, not a bug.

## Also confirm
- **Retention periods** in `privacy.html` (two years for a dead enquiry, five
  years where it becomes a mandate, citing FICA) are the standard practice for
  a property practitioner, not something Martiens has stated. Have his attorney
  check the page before launch.
- **Kleinbaai** is given as the office. There is still no street address.

## AI receptionist (added 2026-09-03)

- LIVE on the staging deploy. Key "erfdevco-site" in the Anthropic console,
  billed off the org's prepaid credits (US$5 balance = natural spend cap;
  top up or set auto-reload consciously, never blindly).
- BEFORE LAUNCH: set SMTP_PASS on Vercel production, or chatbot leads are
  never emailed to Martiens (they only flash in the visitor's widget).
- Guardrail gate passed 2026-09-03, transcript in QA-REPORT.md round 11.
