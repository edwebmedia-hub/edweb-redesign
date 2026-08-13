// Signs Payfast requests server-side so the passphrase never touches the browser.
// Modes:
//   /api/payfast?plan=hosting|management|store            -> monthly subscription (existing sites)
//   /api/payfast?website=<key>&monthly=<key>              -> design fee now + monthly subscription
//   /api/payfast?custom=1&design=<R>&monthly=<R>&label=…  -> custom link (owner-generated)
// A subscription with a design fee charges the design fee up front, then the
// monthly amount from the next cycle (Payfast: amount = initial, recurring_amount = monthly).
const crypto = require('crypto');

const RETURN_URL = 'https://edwebmedia.com/';
const CANCEL_URL = 'https://edwebmedia.com/pay.html';

// Live account.
const LIVE = {
  process: 'https://www.payfast.co.za/eng/process',
  merchantId: '32694595',
  merchantKey: 'ln11ns5q1npeg',
  usePassphrase: true,
};
// Payfast's public sandbox — no real money moves. Add &sandbox=1 to any link to
// test the full checkout. The generic sandbox has no passphrase, so none is
// appended to the signature.
const SANDBOX = {
  process: 'https://sandbox.payfast.co.za/eng/process',
  merchantId: '10000100',
  merchantKey: '46f0cd694581a',
  usePassphrase: false,
};

// Monthly-only plans for existing sites. First charge = the monthly amount.
const PLANS = {
  hosting:    { monthly: 200, item: 'Edweb Hosting Monthly' },
  management: { monthly: 400, item: 'Edweb Hosting and Management Monthly' },
  store:      { monthly: 450, item: 'Edweb Hosting and Store Management Monthly' },
};

// Fixed once-off website design fees (self-serve, matches the Pricing page).
const DESIGN = {
  'business-silver':    { fee: 3999,  item: 'Website design - Business Silver, 5 pages' },
  'business-gold':      { fee: 4999,  item: 'Website design - Business Gold, 10 pages' },
  'business-platinum':  { fee: 6499,  item: 'Website design - Business Platinum, 20 pages' },
  'ecommerce-silver':   { fee: 5999,  item: 'Website design - E-commerce Silver' },
  'ecommerce-gold':     { fee: 7499,  item: 'Website design - E-commerce Gold' },
  'ecommerce-platinum': { fee: 9499,  item: 'Website design - E-commerce Platinum' },
  'directory-silver':   { fee: 8999,  item: 'Website design - Directory Silver' },
  'directory-gold':     { fee: 11999, item: 'Website design - Directory Gold' },
};

// Monthly add-ons that can ride along with a design fee.
const MONTHLY = {
  none:            { amount: 0,   label: '' },
  hosting:         { amount: 200, label: 'Hosting' },
  'mgmt-standard': { amount: 400, label: 'Hosting and Management' },
  'mgmt-store':    { amount: 450, label: 'Hosting and Store Management' },
};

// Match PHP urlencode: spaces -> '+', uppercase %XX, and encode the extra
// characters encodeURIComponent leaves raw ( ! ' ( ) * ~ ) so the signature
// matches whatever Payfast computes on their side for any item name.
function pfEncode(value) {
  return encodeURIComponent(String(value).trim())
    .replace(/%20/g, '+')
    .replace(/[!'()*~]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase());
}

function money(n) {
  return (Math.round(Number(n) * 100) / 100).toFixed(2);
}

function clampInt(v, min, max) {
  const n = Math.round(Number(v));
  if (!Number.isFinite(n) || n < min || n > max) return null;
  return n;
}

// Turn the query into { initial, recurring, item } or null if invalid.
function resolve(q) {
  const plan = String(q.plan || '').toLowerCase();
  if (PLANS[plan]) {
    const m = PLANS[plan].monthly;
    return { initial: m, recurring: m, item: PLANS[plan].item };
  }

  const website = String(q.website || '').toLowerCase();
  if (DESIGN[website]) {
    const d = DESIGN[website];
    const mk = String(q.monthly || 'hosting').toLowerCase();
    const m = MONTHLY[mk] || MONTHLY.hosting;
    return { initial: d.fee, recurring: m.amount, item: d.item };
  }

  if (q.custom) {
    const design = clampInt(q.design, 0, 100000);
    const monthly = clampInt(q.monthly, 0, 20000);
    if (design == null || monthly == null || (design === 0 && monthly === 0)) return null;
    const label = String(q.label || 'Edweb Media').replace(/[<>"]/g, '').slice(0, 100).trim() || 'Edweb Media';
    return { initial: design, recurring: monthly, item: label };
  }

  return null;
}

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
function randFmt(n) {
  return 'R' + Number(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}
function cleanText(v, max) {
  return String(v == null ? '' : v).replace(/[<>"'`\\]/g, '').replace(/\s+/g, ' ').trim().slice(0, max);
}
function validEmail(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e); }

// Branded page that collects the buyer's name + email before Payfast, so the
// merchant knows who paid. Submits back to this endpoint with the details.
function detailsPage(q, spec, isRecurring) {
  const carry = ['plan', 'website', 'monthly', 'custom', 'design', 'label', 'sandbox'];
  const hidden = carry.filter((k) => q[k] != null && q[k] !== '')
    .map((k) => `<input type="hidden" name="${esc(k)}" value="${esc(q[k])}">`).join('');
  let summary;
  if (isRecurring && spec.initial !== spec.recurring) {
    summary = `<strong>${randFmt(spec.initial)}</strong> today, then <strong>${randFmt(spec.recurring)}/month</strong> from next month`;
  } else if (isRecurring) {
    summary = `<strong>${randFmt(spec.recurring)}/month</strong>, renewing until cancelled`;
  } else {
    summary = `<strong>${randFmt(spec.initial)}</strong> once-off`;
  }
  const test = q.sandbox ? '<div class="test">TEST MODE: Payfast sandbox. No real money is charged.</div>' : '';
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex">
<title>Your details | Edweb Media</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box}
body{margin:0;font-family:Manrope,-apple-system,"Segoe UI",sans-serif;background:#fafafa;color:#2b2b2b;line-height:1.5}
.test{background:#e0474c;color:#fff;text-align:center;font-weight:700;padding:10px 14px;font-size:14px}
.wrap{max-width:470px;margin:0 auto;padding:40px 22px 60px}
.logo{height:32px;margin-bottom:26px}
h1{font-size:28px;margin:0 0 8px;letter-spacing:-.01em}
.sub{color:#666;margin:0 0 22px}
.summary{background:#eef6fa;border:1px solid #e1e8ee;border-radius:14px;padding:15px 18px;margin-bottom:26px;font-size:15px}
.summary span{display:block;color:#666;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;margin-bottom:3px}
.row{display:flex;gap:12px}
.row label{flex:1}
label{display:block;font-weight:600;font-size:14px;margin-bottom:15px}
input{display:block;width:100%;margin-top:6px;padding:12px 14px;border:1px solid #cdd7e0;border-radius:10px;font:inherit;background:#fff;color:#2b2b2b}
input:focus{outline:none;border-color:#7acfd6;box-shadow:0 0 0 3px rgba(122,207,214,.35)}
button{width:100%;margin-top:6px;padding:14px;border:0;border-radius:999px;background:#e0474c;color:#fff;font:inherit;font-weight:700;font-size:16px;cursor:pointer}
button:hover{background:#c8101f}
.secure{text-align:center;color:#666;font-size:13px;margin-top:18px}
</style></head>
<body>${test}
<main class="wrap">
<img class="logo" src="https://edwebmedia.com/assets/edweb-logo-dark.png" alt="Edweb Media">
<h1>Almost there</h1>
<p class="sub">Enter your details so we know who the payment is from. Next you'll go to Payfast to pay securely.</p>
<div class="summary"><span>You're paying</span>${summary}</div>
<form method="get" action="/api/payfast" novalidate>${hidden}
<div class="row">
<label>First name<input name="fn" required maxlength="60" autocomplete="given-name"></label>
<label>Last name<input name="ln" required maxlength="60" autocomplete="family-name"></label>
</div>
<label>Email<input type="email" name="email" required maxlength="100" autocomplete="email" placeholder="you@example.com"></label>
<label>Phone <span style="color:#666;font-weight:500">(optional)</span><input name="cell" maxlength="20" autocomplete="tel" placeholder="+27 84 000 0000"></label>
<button type="submit">Continue to payment</button>
</form>
<p class="secure">&#128274; Secured by Payfast. Card details are entered on Payfast, never here.</p>
</main></body></html>`;
}

module.exports = async function handler(req, res) {
  const q = req.query || {};
  const env = q.sandbox ? SANDBOX : LIVE;
  const passphrase = process.env.PAYFAST_PASSPHRASE;
  if (env.usePassphrase && !passphrase) {
    return res.status(503).send('Payments are not switched on yet. Please try again shortly or contact us.');
  }

  const spec = resolve(q);
  if (!spec) return res.status(400).send('Unknown or invalid plan.');

  const isRecurring = spec.recurring > 0;

  const buyer = {
    fn: cleanText(q.fn, 60),
    ln: cleanText(q.ln, 60),
    email: cleanText(q.email, 100),
    cell: cleanText(q.cell, 20),
  };

  // No identified buyer yet -> collect their details first, then come back here.
  if (!validEmail(buyer.email)) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(detailsPage(q, spec, isRecurring));
  }

  // Fields in Payfast's documented order; the POST body order must match the
  // order used to build the signature string, so both come from this object.
  const fields = {
    merchant_id: env.merchantId,
    merchant_key: env.merchantKey,
    return_url: RETURN_URL,
    cancel_url: CANCEL_URL,
  };
  if (buyer.fn) fields.name_first = buyer.fn;
  if (buyer.ln) fields.name_last = buyer.ln;
  fields.email_address = buyer.email;
  fields.amount = money(spec.initial);
  fields.item_name = spec.item;
  if (buyer.cell) fields.custom_str1 = buyer.cell;
  if (isRecurring) {
    fields.subscription_type = '1';
    fields.recurring_amount = money(spec.recurring);
    fields.frequency = '3'; // 3 = Monthly
    fields.cycles = '0';    // 0 = until cancelled
  }

  // Live account signs with the passphrase. The public sandbox has no passphrase
  // and rejects a signature, so we omit it there.
  const allFields = { ...fields };
  if (env.usePassphrase) {
    let signatureString = Object.keys(fields)
      .map((k) => `${k}=${pfEncode(fields[k])}`)
      .join('&');
    signatureString += `&passphrase=${pfEncode(passphrase)}`;
    allFields.signature = crypto.createHash('md5').update(signatureString).digest('hex');
  }
  const inputs = Object.keys(allFields)
    .map((k) => `<input type="hidden" name="${k}" value="${String(allFields[k]).replace(/"/g, '&quot;')}">`)
    .join('');

  const msg = isRecurring && spec.initial !== spec.recurring
    ? 'Taking you to Payfast. You pay the once-off amount now, then the monthly amount from next month…'
    : isRecurring
      ? 'Taking you to Payfast to set up your monthly payment…'
      : 'Taking you to Payfast to complete your payment…';

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.status(200).send(
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Redirecting to secure payment…</title></head>` +
      `<body onload="document.forms[0].submit()" style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;text-align:center;color:#2b2b2b;background:#fafafa">` +
      `<form id="pf" action="${env.process}" method="post">${inputs}</form>` +
      `<p style="margin-top:20vh;font-size:18px">${msg}</p>` +
      `<noscript><button type="submit" form="pf">Continue to payment</button></noscript>` +
      `</body></html>`
  );
};
