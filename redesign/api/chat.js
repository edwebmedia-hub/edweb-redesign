// api/chat.js: the site assistant (Vercel serverless, CommonJS like send-mail.js).
// Env: ANTHROPIC_API_KEY (required), ANTHROPIC_WORKSPACE_ID (required for
//      identity-linked console keys), SMTP_PASS (existing, for lead mail),
//      CHAT_MODEL (optional override).
// Calls the Anthropic Messages API directly over fetch: no SDK, no new dependency.
const nodemailer = require('nodemailer');

const MODEL = process.env.CHAT_MODEL || 'claude-sonnet-5';
const MAX_TURNS = 16;
const MAX_CHARS = 500;
const OWNER_EMAIL = 'info@edwebmedia.com';

const FACTS = `
BUSINESS: Edweb Media, a web design and development studio in Cape Town, South Africa. One designer builds every site; the person a customer speaks to is the person who builds the site. Refer to the studio as "we" or "Edweb Media", never by a personal name. Clients across South Africa and abroad.
CONTACT: phone and WhatsApp 084 620 4583 (international +27 84 620 4583), email info@edwebmedia.com, contact form at edwebmedia.com/contact. Every enquiry gets a reply within one working day.
GOOGLE RATING: 5.0 from 10 verified Google reviews.

BUSINESS WEBSITES (once-off design fee, R1,000 off the list price right now):
- Silver: R2,999 (list R3,999). 5-page custom design, basic SEO, SSL, contact form, social media integration, blog section, WhatsApp button, mobile responsive. Typically 5 working days. Most popular.
- Gold: R3,999 (list R4,999). 10-page custom design, same inclusions. Typically 10 working days.
- Platinum: R5,499 (list R6,499). 20-page custom design, advanced SEO plus the same inclusions. Typically 15 working days.
Delivery clocks start when content and access are received.

ONLINE STORES (once-off): Silver R4,999 up to 10 products; Gold R6,499 up to 25 products; Platinum R8,499 up to 50 products. Secure online payments, SSL, cart and checkout, discount codes, basic SEO, mobile responsive. Delivery date confirmed at kickoff. Ongoing store management is the monthly add-on, not part of the build fee.

DIRECTORY WEBSITES (once-off): Silver R7,999 up to 25 listings; Gold R10,999 up to 50 listings; Platinum from R13,999 unlimited listings, quoted per project. Search and filter, user registration, listing management, SSL, basic SEO, mobile responsive. Delivery confirmed at kickoff.

MONTHLY ADD-ONS (optional, not discounted): Hosting R199 a month (hosting plus professional email on the customer's own domain). Website management R199 a month for business sites, R249 a month for stores and directories (updates, plugin and theme updates, basic content updates, general maintenance, one hour of work included each month). Cancel any time in writing before the next billing date.

OTHER SERVICES, all quoted per project after a conversation: Google Ads campaigns, digital marketing and social media content, branding and identity (logo, colours, type), app development, photography, videography, SEO optimisation.

PROCESS: Discover (brief, sitemap, content list), Design (design direction, first page for approval), Build and launch (all pages and forms, SSL and tracking, checked on phone, tablet and desktop), Grow (hosting, updates, marketing). Fixed written price before any work starts. Nothing goes live without the customer's sign-off. Client owns all files once the fee is paid in full.
PAYMENT: 50% deposit to start, 50% on launch, files and handover after full payment. Card payments via Payfast at edwebmedia.com/pay.
WHAT WE NEED TO START: logo if there is one, photos and words to use, access to the domain. With none of that, we work from a call.
EXISTING WEBSITE: we either rebuild it or take over the current one; send the address and we say which makes more sense.
`;

const SYSTEM = `You are the assistant on the website of Edweb Media. You have already greeted the visitor. Stay in character as the studio's assistant, not as an AI model.

FACTS (answer ONLY from these):${FACTS}

RULES:
1. Keep every reply under 70 words, plain South African English, warm and direct. No bullet lists, no markdown, no em dashes.
2. Never invent services, prices, timelines or promises beyond the facts. If something is not covered, say we will confirm it and offer to take their details.
3. Recommend one package when the visitor describes their business: a standard local business is Silver; more services or locations is Gold; ten or more real pages of content is Platinum; selling products online is a store; a listings model is a directory. Give one sentence of reasoning.
4. When the visitor wants a quote, a call back, to start a project, or asks to be contacted: ask for their name and phone number if you do not have both. Once you have BOTH, add a final line formatted exactly as LEAD: name | phone | need. Then confirm we will phone them back within one working day.
5. Never ask for payment details, ID numbers or full addresses.
6. If asked something unrelated to websites or the studio, answer in one friendly sentence and steer back.`;

// Abuse limits. A real enquiry is three to six messages; a script hammering
// the endpoint is not. SESSION_MAX user turns per thread (the widget reports
// its count, and the payload is counted too), then the assistant hands over
// and the API is no longer called. RATE_MAX per IP per window is in memory
// per warm instance; the hard stop is the spend cap on the Anthropic workspace.
const SESSION_MAX = 10;
const HANDOVER = 'That is about as far as I can take it here. For anything more, message the studio on WhatsApp (084 620 4583) or use the contact page and we will phone you back.';
const RATE_MAX = 20;
const RATE_WINDOW_MS = 10 * 60 * 1000;
const hits = new Map();
function rateLimited(ip) {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < RATE_WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 1000) hits.delete(hits.keys().next().value);
  return recent.length > RATE_MAX;
}

async function sendLeadMail(lead, transcript) {
  if (!process.env.SMTP_PASS) return;
  const transporter = nodemailer.createTransport({
    host: 'smtp.hostinger.com', port: 465, secure: true,
    auth: { user: OWNER_EMAIL, pass: process.env.SMTP_PASS },
  });
  const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  await transporter.sendMail({
    from: `"Edweb assistant" <${OWNER_EMAIL}>`,
    to: OWNER_EMAIL,
    subject: `Website chat lead: ${lead.name} (${lead.phone})`,
    html: `<p><strong>Name:</strong> ${esc(lead.name)}<br><strong>Phone:</strong> ${esc(lead.phone)}<br><strong>Need:</strong> ${esc(lead.need)}</p>
      <p><strong>Conversation</strong></p>
      <pre style="white-space:pre-wrap;font-family:inherit">${esc(transcript)}</pre>`,
  });
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  // The key may have been pasted with a note around it; use the sk-ant-… token only.
  const API_KEY = ((process.env.ANTHROPIC_API_KEY || '').match(/sk-ant-[A-Za-z0-9_-]+/) || [''])[0];
  if (!API_KEY) return res.status(503).json({ error: 'not configured' });

  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  if (rateLimited(ip)) return res.status(429).json({ error: 'busy' });

  const msgs = Array.isArray(req.body && req.body.messages) ? req.body.messages : null;
  if (!msgs || !msgs.length || msgs.length > MAX_TURNS) return res.status(400).json({ error: 'bad request' });
  for (const m of msgs) {
    if (!m || (m.role !== 'user' && m.role !== 'assistant') || typeof m.content !== 'string' ||
        !m.content.trim() || m.content.length > MAX_CHARS) return res.status(400).json({ error: 'bad message' });
  }
  if (msgs[msgs.length - 1].role !== 'user') return res.status(400).json({ error: 'must end on user' });

  // Conversation cap: answered without touching the API.
  const turn = Number(req.body && req.body.turn) || 0;
  const userTurns = msgs.filter((m) => m.role === 'user').length;
  if (turn > SESSION_MAX || userTurns > SESSION_MAX)
    return res.status(200).json({ reply: HANDOVER, lead: null, ended: true });

  // The API requires strict alternation; collapse any repeats from a retried send.
  const clean = [];
  for (const m of msgs) {
    const last = clean[clean.length - 1];
    if (last && last.role === m.role) last.content += '\n' + m.content; else clean.push({ role: m.role, content: m.content });
  }

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: Object.assign({
        'content-type': 'application/json',
        'x-api-key': API_KEY,
        'anthropic-version': '2023-06-01',
      }, process.env.ANTHROPIC_WORKSPACE_ID
        // Identity-linked console keys are refused without the workspace they act in.
        ? { 'anthropic-workspace-id': process.env.ANTHROPIC_WORKSPACE_ID.trim() } : {}),
      body: JSON.stringify({ model: MODEL, max_tokens: 320, system: SYSTEM, messages: clean }),
    });
    if (!r.ok) {
      const body = await r.text().catch(() => '');
      console.error('anthropic', r.status, body.slice(0, 300));
      return res.status(r.status === 429 || r.status >= 500 ? 503 : 500).json({ error: 'failed' });
    }
    const out = await r.json();
    let text = (out.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('').trim();

    let lead = null;
    const m = text.match(/^\s*LEAD:\s*(.+)$/im);
    if (m) {
      const p = m[1].split('|').map((s) => s.trim());
      lead = { name: p[0] || '-', phone: p[1] || '-', need: p[2] || '-' };
      text = text.replace(/^\s*LEAD:.*$/gim, '').replace(/\n{3,}/g, '\n\n').trim();
      const transcript = clean.map((x) => (x.role === 'user' ? 'Visitor: ' : 'Assistant: ') + x.content).join('\n');
      await sendLeadMail(lead, transcript).catch((err) => console.error('lead mail failed', err && err.message));
    }
    if (!text) text = 'Sorry, I lost that one. Could you ask again?';
    return res.status(200).json({ reply: text, lead });
  } catch (err) {
    console.error('chat error', err && err.message);
    return res.status(503).json({ error: 'busy' });
  }
};
