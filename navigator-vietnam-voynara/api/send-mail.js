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

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://navigator-vietnam.com');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Method not allowed' });

  const { name, email, phone, destination, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ success: false, message: 'Name, email and message are required.' });
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
        '',
        message,
      ].filter(Boolean).join('\n'),
    });
    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to send message.' });
  }
};
