const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.hostinger.com',
  port: 465,
  secure: true,
  auth: {
    user: 'info@spiralguard.co.za',
    pass: process.env.SMTP_PASS,
  },
});

// In-memory per-IP rate limiter (resets on cold start — good enough for a quote form)
const RATE_MAX = 5;
const RATE_WINDOW_MS = 10 * 60 * 1000;
const hits = new Map();
function rateLimited(ip) {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < RATE_WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 500) hits.delete(hits.keys().next().value);
  return recent.length > RATE_MAX;
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://spiralguard.co.za');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Method not allowed' });

  const { name, company, email, phone, product, quantity, message, website } = req.body;

  // Honeypot: bots fill the hidden "website" field; drop silently with a fake success.
  if (website) return res.status(200).json({ success: true });

  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  if (rateLimited(ip)) {
    return res.status(429).json({ success: false, message: 'Too many messages. Please try again in a few minutes.' });
  }

  if (!name || !email || !message) {
    return res.status(400).json({ success: false, message: 'Please fill in all required fields.' });
  }
  if (String(message).length > 5000 || String(name).length > 200) {
    return res.status(400).json({ success: false, message: 'Message is too long.' });
  }

  const subject = `Quote Request from ${name}${company ? ` (${company})` : ''}`;
  const text = [
    'New quote request from spiralguard.co.za',
    '==========================================',
    '',
    `Name:     ${name}`,
    `Company:  ${company || '—'}`,
    `Email:    ${email}`,
    `Phone:    ${phone || '—'}`,
    `Product:  ${product || '—'}`,
    `Quantity: ${quantity || '—'}`,
    '',
    'Message:',
    message,
  ].join('\n');

  try {
    await transporter.sendMail({
      from: '"Spiral Guard Website" <info@spiralguard.co.za>',
      to: 'info@spiralguard.co.za',
      replyTo: email,
      subject,
      text,
    });
    return res.status(200).json({ success: true, message: "Your quote request has been sent. We'll be in touch within 24 hours." });
  } catch (err) {
    console.error('Mail error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Unknown error' });
  }
};
