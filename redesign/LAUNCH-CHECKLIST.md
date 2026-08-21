# Launch checklist, Edweb Media rebuild

Prepared 2026-08-21. Everything below that can be done without touching the live site is **done and verified**. What is left needs Edgar.

---

## Ready: verified on all 13 pages

| Check | Result |
|---|---|
| Console errors | 0 |
| Failed requests | 0 |
| Broken images | 0 |
| Scroll animations resolve | 0 stuck |
| Colour contrast (WCAG AA, 3:1 large / 4.5:1 normal) | 0 failures |
| Heading level skips | 0 |
| Duplicate element IDs | 0 |
| Unlabelled form fields | 0 |
| Em-dashes | 0 |
| Exactly one H1 per page | 13 of 13 |
| Horizontal scroll at 375 / 768 / 1280 | none |
| Dead internal links | none |
| Google Ads tag loaded | 13 of 13 |
| Meta description | 13 of 13 |
| Canonical URL | 13 of 13 |
| Social share cards (og + twitter) | 13 of 13 |

## Fixed during this launch pass

1. **Google Ads tracking was missing from every page.** The conversion code in `new-script.js` checks for `gtag` before firing, so a launch would have silently killed all Ads conversion tracking. Loader added to all 13, copied from the current live `index.html` (`AW-16948063813`).
2. **Eight pages had no social cards.** Both policy pages and all six project write-ups. A link shared to a chat rendered as a bare URL. Fixed.
3. **There was no 404 page.** A mistyped URL got the host's default error screen. `404.html` now matches the site, carries `noindex`, and offers the four pages people actually want.
4. **The sitemap was wrong.** It listed `.html` paths on a site that runs clean URLs, and knew nothing about the six project write-ups. Rebuilt: 13 clean URLs with `lastmod`.
5. **The demo sites would have been indexed.** Five fictional businesses competing with the real client pages in search. All 22 demo pages now carry `noindex`, `robots.txt` disallows `/demos/`, and they are excluded from the sitemap.
6. **The discount label failed contrast.** Coral at 13px is 3.49:1 on paper. Mixed with ink it is 6.44:1 and still reads as the accent.
7. **Card marks restored on the checkout.** Real Visa and Mastercard marks, which are the only colours on the site outside the four brand tokens. Deliberate: a recognised card mark is a trust signal at the exact moment someone is about to type a card number, and redrawn in brand colours it stops being recognisable. Screen readers get a text equivalent.

## Promotion is scripted and tested

`C:\Users\edgar\Edweb-Claude-Website-OS\tools\promote.mjs`

Run against a full copy of the site, then served with clean URLs and walked page by page. Result: all 13 URLs returned 200, no `noindex` left, no draft filenames left, no dead links, 404 working, CSS and analytics loading on every page.

What it does:
1. Backs up every live page it will replace into `_pre-launch-backup/`
2. Renames the drafts onto the live filenames, project write-ups into `projects/`
3. Rewrites every internal link to the clean URL, including `?package=` and `?demo=` query links
4. Strips the `noindex` and the promotion-checklist comments
5. Reports anything it could not resolve, and found two real problems on its first run

After promotion the live URLs are:
`/` `/projects` `/packages` `/contact` `/pay` `/terms-conditions` `/privacy-policy`
`/projects/navigator` `/projects/crazydaizy` `/projects/tee-to-trail` `/projects/spiralguard` `/projects/lekkerdoos` `/projects/muire`

---

## What only Edgar can do

1. **Say go.** The project rule is that the live `index.html` is never overwritten until Edgar says to promote, and he was burned earlier in this session by a promotion that ran too early. The script is one command and it backs up first.
2. **Provide a fresh hosting token** for the deploy, then revoke it afterwards.
3. **Send one real enquiry** through the live form after the deploy. The mail endpoint cannot run on the static preview, so the send path is verified by stubbing the response, not by a real email. This is the only launch item that cannot be proven beforehand.
4. **Confirm the pricing deploy.** `api/payfast.js` now holds the discounted fees and it is the same file the current live checkout calls. The pages and the api must deploy together, or the live site advertises R3,999 and charges R3,499.
5. **Check the live site after deploying.** A commit is not a deploy: fetch the real URL and confirm the change is visible.

## Known and deliberate

- **Deploy size is 57.4MB across 321 files**, of which 23.5MB is the five demo sites. Fine for a static host, worth knowing.
- **Reply time says "within one working day"** everywhere. The page being replaced promised the same. "Same working day" was on the draft and was pulled back because it is a harder promise to keep and nothing sourced it.
- **The five demo builds are labelled as demos** with no outbound link, only a "Book this design" button. They are real designs but fictional businesses; presenting them as clients would not survive a prospect asking for a reference.
- **The two policy pages carry no dark band.** They are the flattest pages on the site. A dark band inside a policy document reads wrong and the ink footer closes them.
