# Client CMS

An AI-native, multi-site CMS. Ingest any page from a URL, get every text /
image / link / button auto-tagged as an editable "slot", edit it in-browser
(or via chat), have every change pass through a deterministic Guardian, and
publish a static snapshot — optionally to Vercel.

## How it works

1. **Ingest** (`src/ingest`) — fetches a URL, parses it with Cheerio, and
   tags every editable text node, `<img>`, `<a>`, and `<button>` with a
   stable `data-slot-id`. The resulting HTML (with those attributes) becomes
   the **frozen template** — its structure can never change. The initial
   values become content **version 1**.

2. **Content model** — a page is `template` (locked HTML + structural
   sections) + `slots` (id → type/metadata) + a stack of immutable
   **content versions** (`{ [slotId]: value }`). Only slot values ever
   change.

3. **The Guardian** (`src/guardian`) — a pure, deterministic function. Every
   proposed change set (from the editor UI or the AI chat) is run through
   it before a new version is written. It rejects:
   - changes to slot ids that don't exist
   - malformed values (wrong shape/type, unsafe URLs, oversized text)
   - emptying a slot marked `required`
   - emptying an entire structural section (`<header>`, `<nav>`, `<main>`,
     `<footer>`, `<section>`, `<article>`, `<aside>`)

4. **Editor** (`public/editor`) — click any highlighted slot in the live
   preview iframe to edit it inline; a chat box lets you describe a change
   in plain English.

5. **AI chat** (`src/ai`) — turns a plain-English request into a structured
   `{ changes: [...] }` proposal using Anthropic or OpenRouter, then runs it
   through the same Guardian before applying.

6. **Publish** (`src/publish`) — renders every page's current content into a
   static HTML bundle, stores it as an immutable snapshot, and (if a Vercel
   project is configured) deploys it via the Vercel REST API.

## Setup

```bash
npm install
cp .env.example .env
# edit .env: set OWNER_MASTER_KEY and JWT_SECRET at minimum
npm start
```

Open `http://localhost:3000`. Log in with the **Owner** tab using
`OWNER_MASTER_KEY`.

## Storage

Defaults to the filesystem under `DATA_DIR` (default `./data`). To use
MongoDB instead, set `MONGODB_URI` in `.env` (include the database name in
the URI) — no other code changes needed.

## Multi-site / auth

- The **owner** (master key) can create sites, ingest pages, set each site's
  client password, configure publish targets, and access every site.
- Each site can have one **client password**. A client logging in with
  `siteId` + password can only see and edit that site.

## AI chat keys

Anthropic / OpenRouter API keys can be set server-side via `.env`
(`ANTHROPIC_API_KEY` / `OPENROUTER_API_KEY`) or pasted into the chat box's
key field, which is sent per-request and stored only in the browser's
`localStorage`.

## Troubleshooting: "Ingest failed: fetch failed"

If ingest fails immediately for every URL, your network traffic is likely
being intercepted by antivirus/TLS-inspection software (e.g. Norton), which
presents a certificate Node doesn't trust. As a local workaround you can run
the server with:

```bash
NODE_TLS_REJECT_UNAUTHORIZED=0 npm start
```

(Windows PowerShell: `$env:NODE_TLS_REJECT_UNAUTHORIZED="0"; npm start`)

This disables TLS certificate verification for outbound requests — fine for
local development, but don't use it in production. The proper fix is to add
your AV's root certificate to Node's trust store via `NODE_EXTRA_CA_CERTS`.

## Publish to Vercel

In the editor's "Site settings", set a **Vercel project name** (and team ID
if applicable). Provide a Vercel API token either in `.env`
(`VERCEL_TOKEN`) or per-site in settings. Clicking **Publish** renders all
pages, stores the snapshot, and uploads/deploys it via the Vercel REST API.
