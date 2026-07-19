# Helix SpiralGuard — project facts

Operational facts for this site. Most content (products, prices, contact, brand) lives in the
site files themselves; this doc captures the things that previously existed **only in chat**
(recovered 2026-07-19 from the build/deploy session before those chats are deleted).

## Identity
- **Client / brand:** Helix SpiralGuard ("SpiralGuard" = the product line, "Helix" = the brand). Use "Helix SpiralGuard" for primary name displays; mid-sentence body copy may use "SpiralGuard".
- **Business:** locally manufactured spiral-wrap protection for hydraulic/pneumatic/industrial hoses and cables. Cape Town, Western Cape; supplies nationwide.
- **Live URL:** https://spiralguard.co.za/

## Hosting & deploy  (recovered from chat)
- This `spiralguard-redesign/` folder **is the live site**. It was deployed to spiralguard.co.za and **replaced an older Hostinger-built site** that previously lived there.
- **Deploy method:** `vercel --prod --yes` run from inside `spiralguard-redesign/`, then aliased to spiralguard.co.za. Vercel project `spiralguard-redesign` (see `.vercel/project.json`). This is a CLI deploy (not git-push auto-deploy).
- First committed to this repo on 2026-07-18 as commit `2a784a7` (whole site, 16 files, with the contact-form spam protection).

## Email & DNS  (recovered from chat — verified healthy 2026-07-13→14)
- Mailbox **info@spiralguard.co.za** on Hostinger. Contact form sends via `api/send-mail.js` (nodemailer → `smtp.hostinger.com:465`). Live sends need the **`SMTP_PASS`** env var set on the Vercel project.
- DNS email auth all configured and passing: **SPF pass**, **DKIM pass** (Hostinger selector `hostingermail-a`), **DMARC** active.
- DMARC record includes a `rua=` tag pointing at Edgar's address, so providers (e.g. Microsoft) email **daily aggregate XML reports**. These are normal — only act if a report shows `fail` rows from unknown IPs (spoofing). To stop them, remove `rua=` from the DMARC TXT record.

## Contact form
- Vercel serverless `api/send-mail.js`: honeypot field named **`website`** (the obvious `company` name was already a real field), per-IP rate limit (5 / 10 min), name/message length caps. `send-mail.php` is a legacy PHP fallback with the same guards.

## Content provenance
- Products (SG-15 / SG-20 / SG-25 at R18 / R25 / R32 per metre, plus 50m/100m bulk pricing), the −40 °C to +100 °C spec, phone **+27 84 620 4583** and all copy live in the site files and are the current source of truth. No separate client-signed-off source for these was found in chat — if the client has not formally confirmed the prices, treat them as confirm-before-change.

## Health pass — 2026-07-19
Retrofit health pass run through the Website OS: see [AUDIT.md](AUDIT.md) (findings D1–D10 + open items O1–O9) and [QA-REPORT.md](QA-REPORT.md) (fix log + QA evidence). No redesign. Open items O1–O9 await Edgar's decisions; fixes not yet committed (were made on the wrong branch — commit on a fresh `spiralguard-*` branch off main).
