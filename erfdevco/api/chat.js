// api/chat.js — ERFDEVCO AI receptionist backend (Vercel serverless).
// Built from Edweb OS business/AI-RECEPTIONIST.md. Env: ANTHROPIC_API_KEY,
// SMTP_PASS (existing mail setup). The key never reaches the browser.
import Anthropic from "@anthropic-ai/sdk";
import nodemailer from "nodemailer";

const MODEL = "claude-haiku-4-5";
const MAX_TURNS = 12; // history cap sent by the widget
const MAX_CHARS = 500; // per-message cap

const BUSINESS = "ERFDEVCO";
const OWNER_EMAIL = "martiens@erfdevco.com";

const FACTS = `
- ERFDEVCO sells farms, smallholdings, game farms and vineyards across South Africa. Mandates are taken in any of the nine provinces.
- It is a one-practitioner agency: Martiens Du Plessis, Managing Director, B.Econ (Stellenbosch), registered with the Property Practitioners Regulatory Authority (PPRA). Based in Kleinbaai, Western Cape.
- Phone and WhatsApp: 082 900 5019. Email: martiens@erfdevco.com.
- Every listing is written up against the same 18-section schedule (103 fields): land, water, irrigation, livestock, crops, game, buildings, power, security, equipment, legal, lifestyle and more. If a fact is not known it is marked as not recorded, never estimated.
- Every farm currently for sale is on the website under "Farms for sale", each with its full schedule, and farms can be compared side by side on the Compare page.
- To sell: Martiens walks the farm with the seller, works through the schedule, and the mandate and commission are agreed in writing before anything is published.
- Buyers can use the bond calculator on any farm page for a repayment estimate. It is arithmetic, not a bank quote.
- Listing fees and commission: discussed directly with Martiens, agreed in writing. Do not quote figures.`;

const RULES = `You are the AI receptionist on the website of ${BUSINESS}, a South African farm property agency. Stay in character. You have already greeted the visitor.

BUSINESS FACTS (answer ONLY from these, plus the CURRENT FARMS list if one follows):${FACTS}

RULES:
1. Keep every reply under 55 words. Warm, plain language. Reply in the language the visitor writes: English or Afrikaans. Plain text only: no bullet lists, no markdown, no asterisks, and never the em dash character (use a comma or full stop instead).
2. Never invent farms, prices, hectares, fees or promises beyond the facts given. For details of a specific farm, point to that farm's page on this website. If something is not covered, say Martiens will confirm it and offer a callback.
3. When the visitor wants a viewing, valuation, to list a farm, a callback, or asks about buying: ask for their name and phone number if you do not have both. Once you have BOTH, add a final line formatted exactly as LEAD: name | phone | need. The website turns that line into a lead; the visitor never sees it. Then confirm Martiens will phone back, within about 15 minutes in business hours.
4. Never ask for payment details, ID numbers, or addresses beyond the town or district.
5. If asked whether you are a person: say you are the website's assistant and Martiens himself is one tap away on WhatsApp, 082 900 5019.`;

// Reads ANTHROPIC_API_KEY. Identity-linked console keys also require the
// workspace id on every request, sent here as a default header.
const client = new Anthropic({
  defaultHeaders: process.env.ANTHROPIC_WORKSPACE_ID
    ? { "anthropic-workspace-id": process.env.ANTHROPIC_WORKSPACE_ID }
    : undefined,
});

// A compact live digest of the farms on the books, fetched from the site's
// own data file so the receptionist can never drift from the listings.
// Cached per warm instance.
let farmsDigest = null;
let farmsFetched = 0;
async function getFarmsDigest(req) {
  const now = Date.now();
  if (farmsDigest && now - farmsFetched < 10 * 60 * 1000) return farmsDigest;
  try {
    const proto = req.headers["x-forwarded-proto"] || "https";
    const host = req.headers["x-forwarded-host"] || req.headers.host;
    const r = await fetch(`${proto}://${host}/data/listings.json`);
    if (!r.ok) throw new Error(String(r.status));
    const j = await r.json();
    const rows = (j.listings || []).map(f =>
      `- ${f.title}, ${f.place}, ${f.province}: ${f.priceDisplay}, ${f.sizeHa} ha, ${f.farmType}. Page: /listing?id=${f.id}`);
    farmsDigest = `\n\nCURRENT FARMS FOR SALE (the only farms that exist; for anything deeper, send the visitor to the farm's page):\n${rows.join("\n")}`;
    farmsFetched = now;
  } catch {
    farmsDigest = "\n\nCURRENT FARMS: the live list is on the Farms for sale page of this website.";
    farmsFetched = now;
  }
  return farmsDigest;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  const msgs = Array.isArray(req.body?.messages) ? req.body.messages : null;
  if (!msgs || msgs.length === 0 || msgs.length > MAX_TURNS * 2)
    return res.status(400).json({ error: "bad request" });
  for (const m of msgs) {
    if (!m || (m.role !== "user" && m.role !== "assistant") ||
        typeof m.content !== "string" || !m.content.trim() ||
        m.content.length > MAX_CHARS)
      return res.status(400).json({ error: "bad message" });
  }
  if (msgs[msgs.length - 1].role !== "user")
    return res.status(400).json({ error: "must end on user" });

  if (!process.env.ANTHROPIC_API_KEY)
    return res.status(503).json({ error: "busy" });

  try {
    const digest = await getFarmsDigest(req);
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 300,
      messages: [{ role: "user", content: RULES + digest }, ...msgs],
    });

    let text = response.content.filter(b => b.type === "text").map(b => b.text).join("");

    // Lead detection stays server-side, so the browser is never trusted.
    let lead = null;
    const m = text.match(/^\s*LEAD:\s*(.+)$/im);
    if (m) {
      const p = m[1].split("|").map(s => s.trim());
      lead = { name: p[0] || "-", phone: p[1] || "-", need: p[2] || "-" };
      text = text.replace(/^\s*LEAD:.*$/gim, "").replace(/\n{3,}/g, "\n\n").trim();
      await sendLeadMail(lead).catch(err => console.error("lead mail failed", err?.code || err?.message));
    }

    return res.status(200).json({ reply: text, lead });
  } catch (err) {
    console.error("chat error", err?.status || err?.message);
    const busy = err?.status === 429 || err?.status >= 500;
    return res.status(busy ? 503 : 500).json({ error: busy ? "busy" : "failed" });
  }
}

async function sendLeadMail(lead) {
  if (!process.env.SMTP_PASS) return;
  const transporter = nodemailer.createTransport({
    host: "smtp.hostinger.com", port: 465, secure: true,
    auth: { user: OWNER_EMAIL, pass: process.env.SMTP_PASS },
  });
  await transporter.sendMail({
    from: `"${BUSINESS} website" <${OWNER_EMAIL}>`,
    to: OWNER_EMAIL,
    subject: `New website lead: ${lead.name} (${lead.phone})`,
    text: `Name: ${lead.name}\nPhone: ${lead.phone}\nNeed: ${lead.need}\nCaptured by the website receptionist.`,
  });
}
