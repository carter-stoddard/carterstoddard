import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = 'Carter Stoddard <forms@carterstoddard.com>';
const TO = 'carter@carterstoddard.com';

// ── Validation limits ──
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX = {
  first_name: 100,
  last_name: 100,
  email: 254,
  company: 200,
  role: 100,
  services: 300,
  message: 5000,
};

// ── Rate limiting (in-memory, per warm instance) ──
// Best-effort throttle that caps abuse from a single IP. Memory isn't shared
// across serverless instances, so it's a speed bump, not a vault — the
// honeypot, timing gate, and field validation below are the deterministic guards.
const RATE_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const RATE_MAX = 5;                    // max submissions per IP per window
const hits = new Map();                // ip -> number[] (timestamps)

function rateLimited(ip, now) {
  const recent = (hits.get(ip) || []).filter((t) => now - t < RATE_WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  // Opportunistic cleanup so the map can't grow unbounded on a long-lived instance.
  if (hits.size > 5000) {
    for (const [k, v] of hits) {
      if (v.every((t) => now - t >= RATE_WINDOW_MS)) hits.delete(k);
    }
  }
  return recent.length > RATE_MAX;
}

function escapeHtml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      first_name,
      last_name,
      email,
      company,
      role,
      services,
      message,
      consent,
      website,    // honeypot — must be empty
      form_time,  // ms the form was on screen before submit
    } = req.body || {};

    // ── 1. Honeypot — real users never fill the hidden "website" field ──
    // Return a fake success so bots don't learn they were caught.
    if (website) {
      return res.status(200).json({ ok: true });
    }

    // ── 2. Timing gate — humans take more than 3s to fill out the form ──
    if (typeof form_time === 'number' && form_time < 3000) {
      return res.status(200).json({ ok: true });
    }

    // ── 3. Rate limit per IP ──
    const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
    if (rateLimited(ip, Date.now())) {
      return res.status(429).json({ error: 'Too many requests. Please try again later.' });
    }

    // ── 4. Required fields present ──
    if (!first_name || !last_name || !email || !company || !role || !services || !consent) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // ── 5. Email format ──
    if (typeof email !== 'string' || !EMAIL_RE.test(email)) {
      return res.status(400).json({ error: 'Invalid email address' });
    }

    // ── 6. Length caps — reject oversized payloads ──
    for (const [field, limit] of Object.entries(MAX)) {
      const val = req.body[field];
      if (typeof val === 'string' && val.length > limit) {
        return res.status(400).json({ error: 'Field too long' });
      }
    }

    const fullName = `${first_name} ${last_name}`;
    const subject = `New mission brief from ${fullName} — ${company}`;

    const row = (label, value) => `
      <tr>
        <td style="padding:14px 0;border-bottom:1px solid rgba(204,255,0,0.2);font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:bold;letter-spacing:0.15em;text-transform:uppercase;color:rgba(255,255,255,0.45);width:140px;vertical-align:top;">${label}</td>
        <td style="padding:14px 0;border-bottom:1px solid rgba(204,255,0,0.2);font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#ffffff;">${value}</td>
      </tr>
    `;

    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background-color:#000000;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#000000;padding:40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background-color:#0a0a0a;border:1px solid rgba(204,255,0,0.4);border-radius:8px;overflow:hidden;">

          <!-- Header bar -->
          <tr>
            <td style="background-color:#000000;padding:20px 32px;border-bottom:1px solid rgba(204,255,0,0.3);">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:bold;letter-spacing:0.2em;color:#CCFF00;text-transform:uppercase;">
                    ● Incoming Transmission
                  </td>
                  <td align="right" style="font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:0.15em;color:rgba(255,255,255,0.4);text-transform:uppercase;">
                    Mission Brief
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Hero / heading -->
          <tr>
            <td style="padding:40px 32px 24px 32px;">
              <p style="margin:0 0 8px 0;font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:bold;letter-spacing:0.2em;color:rgba(255,255,255,0.4);text-transform:uppercase;">From</p>
              <h1 style="margin:0;font-family:'Arial Black',Arial,Helvetica,sans-serif;font-size:32px;font-weight:900;color:#ffffff;letter-spacing:-0.01em;line-height:1.1;">${escapeHtml(fullName)}</h1>
              <p style="margin:8px 0 0 0;font-family:Georgia,'Times New Roman',serif;font-style:italic;font-size:18px;color:#CCFF00;">${escapeHtml(company)}</p>
            </td>
          </tr>

          <!-- Detail table -->
          <tr>
            <td style="padding:0 32px 32px 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                ${row('Email', `<a href="mailto:${escapeHtml(email)}" style="color:#CCFF00;text-decoration:none;border-bottom:1px solid rgba(204,255,0,0.4);">${escapeHtml(email)}</a>`)}
                ${row('Role', escapeHtml(role))}
                ${row('Services', escapeHtml(services))}
                ${row('Message', escapeHtml(message || '—').replace(/\n/g, '<br>'))}
                ${row('Consent', consent ? '<span style="color:#CCFF00;">✓ Agreed</span>' : 'No')}
              </table>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding:0 32px 32px 32px;">
              <a href="mailto:${escapeHtml(email)}" style="display:inline-block;background-color:#CCFF00;color:#000000;font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:bold;letter-spacing:0.15em;text-transform:uppercase;text-decoration:none;padding:14px 28px;border-radius:4px;">Reply to ${escapeHtml(first_name)} →</a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#000000;padding:20px 32px;border-top:1px solid rgba(204,255,0,0.2);">
              <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:0.15em;color:rgba(255,255,255,0.35);text-transform:uppercase;text-align:center;">
                Carter Stoddard — Full-Stack Marketer &amp; Creative
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    const text = `New Mission Brief

Name: ${fullName}
Email: ${email}
Company: ${company}
Role: ${role}
Services: ${services}
Message: ${message || '(none)'}
Consent: ${consent ? 'Yes' : 'No'}
`;

    const { data, error } = await resend.emails.send({
      from: FROM,
      to: TO,
      reply_to: email,
      subject,
      html,
      text,
    });

    if (error) {
      console.error('[resend]', error);
      return res.status(500).json({ error: 'Email send failed' });
    }

    return res.status(200).json({ ok: true, id: data?.id });
  } catch (err) {
    console.error('[contact-api]', err);
    return res.status(500).json({ error: 'Server error' });
  }
}
