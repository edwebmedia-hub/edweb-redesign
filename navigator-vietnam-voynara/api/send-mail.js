const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.hostinger.com',
  port: 465,
  secure: true,
  auth: {
    user: 'info@navigator-vietnam.com',
    pass: process.env.SMTP_PASS,
  },
});

// Best-effort per-IP rate limit. In-memory, so it only spans a warm serverless
// instance, but that's enough to blunt a burst from one source without a KV store.
const RATE_MAX = 5;
const RATE_WINDOW_MS = 10 * 60 * 1000;
const hits = new Map();
function rateLimited(ip) {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < RATE_WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 500) hits.delete(hits.keys().next().value); // cap memory
  return recent.length > RATE_MAX;
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://navigator-vietnam.com');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Method not allowed' });

  const { name, email, phone, destination, dates, travellers, message, company } = req.body;

  // Honeypot: bots fill the hidden "company" field; humans never see it. Pretend
  // success so the bot gets no signal, but send nothing.
  if (company) return res.status(200).json({ success: true });

  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  if (rateLimited(ip)) {
    return res.status(429).json({ success: false, message: 'Too many messages. Please try again in a few minutes.' });
  }

  if (!name || !email || !message) {
    return res.status(400).json({ success: false, message: 'Name, email and message are required.' });
  }
  if (String(message).length > 5000 || String(name).length > 200) {
    return res.status(400).json({ success: false, message: 'Message is too long.' });
  }

  try {
    await transporter.sendMail({
      from: `"Navigator Vietnam Website" <info@navigator-vietnam.com>`,
      to: 'info@navigator-vietnam.com',
      replyTo: email,
      subject: `New trip enquiry from ${name}`,
      text: [
        `Name: ${name}`,
        `Email: ${email}`,
        phone ? `Phone: ${phone}` : null,
        destination ? `Destination: ${destination}` : null,
        dates ? `Travel dates: ${dates}` : null,
        travellers ? `Travellers: ${travellers}` : null,
        '',
        message,
      ].filter(Boolean).join('\n'),
    });
    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to send message.' });
  }
};
