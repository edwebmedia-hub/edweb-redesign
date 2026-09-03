const nodemailer = require('nodemailer');

// SMTP_PASS is set as a Vercel env var at deploy time.
const CLIENT_EMAIL = 'martiens@erfdevco.com';

const transporter = nodemailer.createTransport({
  host: 'smtp.hostinger.com',
  port: 465,
  secure: true,
  auth: { user: CLIENT_EMAIL, pass: process.env.SMTP_PASS },
});

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false });

  const { name, email, message, subject } = req.body || {};
  if (!name || !email || !message) {
    return res.status(400).json({ success: false, message: 'Missing fields' });
  }

  try {
    await transporter.sendMail({
      from: `"ERFDEVCO Website" <${CLIENT_EMAIL}>`,
      to: CLIENT_EMAIL,
      replyTo: email,
      subject: subject || `New enquiry from ${name}`,
      text: `Name: ${name}\nEmail: ${email}\n\n${message}`,
    });
    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
