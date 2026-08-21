# Edweb Media (edwebmedia.com), state handoff

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

Four brand tokens only: ink `#2b2b2b`, paper `#fafafa`, coral `#e0474c`, teal
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

## Open

- Pointing `dielekkerdoos.co.za` at its finished build reverses three edits on
  `new-projects.html` and `new-project-lekkerdoos.html`.
- The shared dropdown chevron is inside `@supports (appearance: base-select)`,
  so iOS Safari still shows the native control.
