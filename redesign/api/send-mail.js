const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.hostinger.com',
  port: 465,
  secure: true,
  auth: {
    user: 'info@edwebmedia.com',
    pass: process.env.SMTP_PASS,
  },
});

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
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Method not allowed' });

  const { type, first_name, last_name, email, phone, services, addons, budget, timeline, message, package: pkg,
          name, meeting_date, note, company } = req.body;

  // Honeypot: bots fill the hidden field; drop silently with a fake success.
  if (company) return res.status(200).json({ success: true });
  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  if (rateLimited(ip)) {
    return res.status(429).json({ success: false, message: 'Too many messages. Please try again in a few minutes.' });
  }

  if (type === 'booking') {
    if (!name || !email || !phone || !meeting_date) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    if (String(name).length > 200 || String(note || '').length > 5000) {
      return res.status(400).json({ success: false, message: 'Message is too long.' });
    }

    const subject = `Meeting Request - ${meeting_date}`;
    const text = [
      'New meeting request from edwebmedia.com',
      '',
      `Name:   ${name}`,
      `Email:  ${email}`,
      `Phone:  ${phone}`,
      `Date:   ${meeting_date}`,
      `Note:   ${note || 'None'}`,
    ].join('\n');

    try {
      await transporter.sendMail({
        from: '"Edweb Media Website" <info@edwebmedia.com>',
        to: 'info@edwebmedia.com',
        replyTo: email,
        subject,
        text,
      });
      return res.status(200).json({ success: true, message: 'Email sent' });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message || 'Unknown error' });
    }
  }

  // Contact / MSF form
  const fullName = `${first_name || ''} ${last_name || ''}`.trim();
  if (!fullName || !email) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }
  if (String(message || '').length > 5000 || String(fullName).length > 200) {
    return res.status(400).json({ success: false, message: 'Message is too long.' });
  }

  const subject = pkg ? `New Enquiry from ${fullName} — ${pkg}` : `New Enquiry from ${fullName}`;
  const text = [
    'New enquiry from edwebmedia.com',
    '',
    `Name:      ${fullName}`,
    `Email:     ${email}`,
    `Phone:     ${phone || '—'}`,
    `Package:   ${pkg || '—'}`,
    `Services:  ${services || '—'}`,
    `Add-ons:   ${addons || '—'}`,
    `Budget:    ${budget || '—'}`,
    `Timeline:  ${timeline || '—'}`,
    '',
    'Message:',
    message || '—',
  ].join('\n');

  try {
    await transporter.sendMail({
      from: '"Edweb Media Website" <info@edwebmedia.com>',
      to: 'info@edwebmedia.com',
      replyTo: email,
      subject,
      text,
    });
    return res.status(200).json({ success: true, message: 'Email sent' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || 'Unknown error' });
  }
};
