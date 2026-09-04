# Edweb Media (edwebmedia.com), state handoff

## 2026-09-03: full rebuild LIVE at edwebmedia.com (tip fd57c4d, launched 20:45)

Edgar asked for the whole site redone from scratch ("boring", "I don't like
the flow") with an AI chatbot, delivered once at 95%+. Built in the worktree
`C:\Users\edgar\edweb-next` on branch `edweb-next` (cut from
`edweb-logo-refresh`, the live branch). The shared working copy was left alone.

**What changed.** Every draft page was rewritten: `new-home.html`,
`new-projects.html`, `new-packages.html`, `new-contact.html`, `new-pay.html`,
the six `new-project-*.html` write-ups, `new-privacy.html`, `new-terms.html`,
`404.html`, plus `new-styles.css` and `new-script.js` from a blank file. Prices,
plan keys, the Payfast endpoints, the send-mail fields, the Ads conversion
label and all facts were carried over unchanged. `api/payfast.js` and
`api/send-mail.js` are untouched.

**Design system (new-styles.css).** Same four tokens. One face, Manrope 700
headings (Edgar's 2026-09-03 ruling). Four radii with jobs (4 control, 14 card,
10 media, pill). Value strip on home: paper hero, grey work rail, paper
services, ink statement band, grey pricing, paper process, grey reviews, paper
FAQ, teal CTA, ink footer. Fixed header goes solid on scroll. One living
element: a drifting teal/coral dot field on a fixed canvas behind the whole
page (`.backdrop`), static under reduced motion. Home signature moves: cycling
verb in the h1, the AI chat panel as the hero's second half, an aligned two-up
grid of six full-width captures (Edgar picked it over a pinned rail, a featured
switcher and editorial rows, 2026-09-03), the statement band's words lighting
up under scroll, scroll-driven card rises on the process steps. Pricing add-ons
use the same white plan card as the packages (his pick over an ink block and a
comparison table). No pinned/sticky section headings anywhere
(Edgar, 2026-09-03: "don't like it when the header moves with the scroll").

**AI chat.** `api/chat.js` (CommonJS, fetch straight to the Anthropic Messages
API, no new dependency; model `claude-sonnet-5`, override with `CHAT_MODEL`).
Facts and rules live in the file: prices from OS `business/PACKAGES.md`,
process, contact, payment terms. Leads (`LEAD: name | phone | need`) are
stripped from the reply and emailed to info@edwebmedia.com through the existing
SMTP setup. Rate limit 40 turns / 10 min / IP. The widget (`Chat` in
new-script.js) mounts inline in the home hero and as a drawer behind the
"Ask Edweb" launcher on every page; history is shared via sessionStorage. When
`/api/chat` is unreachable (local preview, missing key) it answers the common
price/time/hosting/contact questions from a built-in fallback and points to
WhatsApp, so the panel never sits dead. **Needs `ANTHROPIC_API_KEY` set on the
hosting project before it goes live.**

**Prices moved 2026-09-03 evening (Edgar: "make this a R1000").** Every once-off fee is now R1,000 under list: business 2,999 / 3,999 / 5,499, stores 4,999 / 6,499 / 8,499, directories 7,999 / 10,999 / from 13,999. Changed together in `api/payfast.js`, `new-pay.html`, `new-packages.html`, `new-home.html`, `new-contact.html`, `404.html`, `new-script.js`, `api/chat.js` and OS `business/PACKAGES.md`. Monthly plans unchanged. Shown as a tilted coral deal tag (`.promo`) with a shine sweep, labelled limited time.

**Post-launch round, 2026-09-04 morning (all live).** Mobile bar and first-heading
spacing, mobile contact form, studio voice (no first name), no portfolio counts,
pricing tabs on home, closing CTA bands removed everywhere, pill buttons,
same-tone neighbours share one gap (`.band--alt + .band--alt` and siblings),
home work grid three across. Rulings harvested to OS TASTE-PROFILE.

**Preview.** `.claude/launch.json` entry `edweb-next` (port 4240, static server
on the worktree). `/api/*` 404s locally by design.

**To go live.** (1) DONE: merged fast-forward into `edweb-logo-refresh` and pushed. (2) DONE: promote run, 14 pages, no leftover draft links. (3) DONE: `ANTHROPIC_API_KEY` plus `ANTHROPIC_WORKSPACE_ID` (identity-linked console keys need it) set on the hosting project. (4) DONE: launched, chat verified live. (5) Still owed: one real form send, one chat turn that captures a lead, /pay?test=1 through the sandbox. Old steps for reference: (2) `node C:\Users\edgar\Edweb-Claude-Website-OS\tools\promote.mjs <redesign>`
to copy drafts onto the live filenames. (3) Add `ANTHROPIC_API_KEY` in the
hosting project's environment variables. (4) Run the launch script. (5) Send
one real form and one real chat lead.

---

Rewritten 2026-08-21. The previous version of this file described the design
that the August 2026 rebuild replaced, down to a different ink value. If
anything below disagrees with the files, the files win.

**Live:** https://edwebmedia.com
**Branch:** `edweb-logo-refresh`, pushed to `github.com/edwebmedia-hub/edweb-redesign`
**Deploy:** Edgar double-clicks `C:\Users\edgar\deploy-edweb.cmd`. It calls the
Vercel CLI as `npx.cmd` by full path with a token read from
`C:\Users\edgar\.deploy-token`, and logs to `C:\Users\edgar\deploy-log.txt`.
Written as `.cmd` because his PowerShell is 5.1: no `&&`, and `.ps1` scripts are
blocked by execution policy. **Claude cannot run it**: a PreToolUse hook denies
any shell command containing "vercel". Prepare the build, commit, hand over the
one click. The git push is backup, not the deploy trigger.

---

## How the files are laid out

The working copies are `new-*.html`, `new-styles.css` and `new-script.js`. The
live filenames are produced from them:

```
node C:\Users\edgar\Edweb-Claude-Website-OS\tools\promote.mjs <this folder>
```

It renames 13 drafts onto their live names, rewrites internal links to the
clean URLs the canonicals promise, drops `noindex`, and separately repairs the
links on `404.html`, which is not a draft but used to point at draft filenames.
CSS and JS are shared by drafts and live pages, so styling changes need no
promote step; HTML changes do.

`.vercelignore` keeps the drafts, `_pre-launch-backup/`, the previous site's
`styles.css` and `script.js`, and 69 unreferenced legacy images out of the
upload. Deploy is roughly 40 MB.

**Rollback** is a copy back from `_pre-launch-backup/`, which holds the pages
that were live before the rebuild.

---

## Pages

`/` `/projects` `/packages` `/contact` `/pay` `/terms-conditions`
`/privacy-policy`, six write-ups under `/projects/`, and five demo builds under
`/demos/`. Demos are fictional businesses, every one labelled as a demo,
`noindex, nofollow`, and disallowed in `robots.txt`.

## Design system

Four brand tokens only: ink `#161616`, paper `#fafafa`, coral `#e0474c`, teal
`#7acfd6`, plus `color-mix()` of those. The one exception is the Visa and
Mastercard marks on `/pay`, which are third-party logos and are documented as
such in the stylesheet.

- `--gutter` drives the page edge: 28px on a phone, 48 on a desktop. Every
  full-bleed rail insets by the same token so nothing runs to the screen edge.
- `--band` is the section rhythm, 56px on a phone and 128 on a desktop, and
  `.band--alt` / `.band--ink` alternate the tone. Each page carries one ink
  band as its dark anchor.
- One value per role, and it is measured rather than assumed: one h2 size, one
  4px radius, one button height, one control height.
- Reveals are `.reveal` plus IntersectionObserver, with a no-JS guard and two
  fallback sweeps so nothing can be left invisible.

## The assistant behaves like a staffed live chat (2026-09-04, commit 6f298f7, NOT DEPLOYED)

- **The opener is typed, not pasted.** A mount with no history shows the typing
  dots for 900ms, then the greeting, then the chips stagger in. Returning
  visitors and `prefers-reduced-motion` skip straight to the text.
- **A teaser bubble speaks first, once per session.** It grows out of the
  launcher (`transform-origin: 100% 100%`, 420ms in, 170ms out), carries a
  static `1` badge on the launcher, and withdraws on its own after 15 seconds.
  The badge stays until the panel is opened.
- **When it fires:** 9 seconds after load, or once the visitor passes 60% of a
  viewport. On the home page the launcher is hidden while the hero panel is on
  screen, so the teaser retries every 1.2s (25 tries) and only lands once the
  launcher is actually visible.
- **It never nags.** `sessionStorage['edweb-chat-teased']` is set when it shows,
  when it is dismissed and when the drawer is opened by any route.
- **No looping attention motion anywhere.** The launcher gets one 620ms settle
  and the class is stripped on `animationend`, because `.chat-launch` also
  animates `transform` on hover and on `.is-hidden`; a filled animation would
  freeze both.
- **`.chat-badge` is a `<span>` inside the launcher**, and the 600px rule hides
  the launcher label with `.chat-launch span`. It is now
  `span:not(.chat-badge)`, otherwise the badge disappears on phones.
- **Chips animate opacity and blur only.** `.chip` owns a hover `transform`, so
  a transform keyframe with `both` fill would fight it.

## Traps this codebase has actually fallen into

- **A flat rule declared after a media query wins.** It silently killed the
  mobile collapse on the work heading and on the booking grid. Every mobile
  collapse now lives at the end of the stylesheet.
  `Edweb-Claude-Website-OS\tools\_override.mjs` detects the pattern.
- **`$$` collapses to `$` inside a JS replacement string**, which kills the
  whole IIFE. Use a function replacement.
- **OneDrive locks files mid-sync.** Write, read back, retry.
- **`python -m http.server` drops files over 100KB here.** Use
  `.claude\static-server.mjs`, and note it does not do clean URLs, so `/packages`
  404s locally while working in production.

## 2026-09-04: deploying is now a git push to `edweb-next`

The Vercel project `redesign` is connected to GitHub
(`edwebmedia-hub/edweb-redesign`, Root Directory `redesign`, production branch
`edweb-next`). A push to `edweb-next` builds and goes live on edwebmedia.com by
itself. No token, no `vercel` CLI, no device-code login. Claude can deploy.

- **`C:\Users\edgar\deploy-edweb.cmd` is now dangerous.** It deploys the
  `edweb-deploy` worktree, pinned to `edweb-logo-refresh`, which does not carry
  the `edweb-next` commits. Running it rolls the live site backwards.
- **Any push to `edweb-next` publishes.** Nothing stands in front of it. Push
  only what is meant to be live.
- `.vercelignore` is still honoured on git deploys: the `new-*.html` drafts,
  `_pre-launch-backup/` and the legacy images all 404 in production (checked
  2026-09-04).
- The same repo is also connected to the `client-cms` and `erfdevco` projects,
  so one push builds previews there too. Neither owns a live domain.
- Same day, the home process row changed: three plain level cards, and Grow on
  ink black leaning 2.2deg out of the row with a lift and teal bullets
  (`.step--feature`). Contact and 404 keep the flat `.step` cards.

## Open

- Pointing `dielekkerdoos.co.za` at its finished build reverses three edits on
  `new-projects.html` and `new-project-lekkerdoos.html`.
- The shared dropdown chevron is inside `@supports (appearance: base-select)`,
  so iOS Safari still shows the native control.
