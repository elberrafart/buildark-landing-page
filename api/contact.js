export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, phone, company, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Name, email, and message are required.' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Email service not configured.' });
  }

  const firstName = name.split(' ')[0];

  const sharedHeader = `
    <div style="background:linear-gradient(135deg,#0D2B4E 0%,#1A4A72 100%);padding:28px 32px 24px;text-align:center;border-radius:12px 12px 0 0">
      <img src="https://buildark.dev/buildarklogo.png" alt="BuildArk"
           style="height:56px;width:auto;display:block;margin:0 auto 14px" />
      <p style="margin:0;color:rgba(184,216,236,0.8);font-size:11px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase">buildark.dev</p>
    </div>
  `;

  const sharedFooter = `
    <div style="background:#0D2B4E;padding:20px 32px;border-radius:0 0 12px 12px;text-align:center">
      <p style="margin:0 0 8px;color:rgba(255,255,255,0.35);font-size:11px;letter-spacing:0.08em">CUSTOM WEBSITES &amp; APPS FOR SMALL BUSINESSES</p>
      <p style="margin:0;color:rgba(255,255,255,0.2);font-size:11px">
        <a href="https://buildark.dev" style="color:rgba(0,175,162,0.7);text-decoration:none">buildark.dev</a>
        &nbsp;·&nbsp;
        <a href="mailto:raz@buildark.dev" style="color:rgba(0,175,162,0.7);text-decoration:none">raz@buildark.dev</a>
        &nbsp;·&nbsp;
        <a href="https://instagram.com/buildarksolutions" style="color:rgba(0,175,162,0.7);text-decoration:none">@buildarksolutions</a>
      </p>
    </div>
  `;

  const wrap = (content) => `
    <!DOCTYPE html>
    <html lang="en">
    <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
    <body style="margin:0;padding:24px 16px;background:#f0f2f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
      <div style="max-width:560px;margin:0 auto;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.12)">
        ${sharedHeader}
        ${content}
        ${sharedFooter}
      </div>
    </body>
    </html>
  `;

  // ── Notification email to you ────────────────────────────────
  const notificationHtml = wrap(`
    <div style="background:#ffffff;padding:32px">
      <div style="display:inline-block;background:#EFF8FF;border:1px solid #BAE6FD;border-radius:6px;padding:4px 12px;margin-bottom:20px">
        <p style="margin:0;color:#0D2B4E;font-size:12px;font-weight:700;letter-spacing:0.06em">NEW INQUIRY</p>
      </div>
      <h2 style="margin:0 0 4px;font-size:20px;color:#0D2B4E">You heard from ${name}</h2>
      <p style="margin:0 0 24px;color:#6b7280;font-size:14px">Someone just submitted the contact form on buildark.dev</p>

      <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;overflow:hidden;margin-bottom:24px">
        <div style="background:#1A4A72;padding:10px 18px">
          <p style="margin:0;color:rgba(255,255,255,0.7);font-size:11px;font-weight:700;letter-spacing:0.1em">CONTACT DETAILS</p>
        </div>
        <table style="width:100%;border-collapse:collapse">
          <tr style="border-bottom:1px solid #E2E8F0">
            <td style="padding:12px 18px;color:#94A3B8;font-size:12px;font-weight:700;letter-spacing:0.06em;width:90px;vertical-align:top">NAME</td>
            <td style="padding:12px 18px;font-weight:600;color:#1e293b;font-size:14px">${name}</td>
          </tr>
          <tr style="border-bottom:1px solid #E2E8F0">
            <td style="padding:12px 18px;color:#94A3B8;font-size:12px;font-weight:700;letter-spacing:0.06em;vertical-align:top">EMAIL</td>
            <td style="padding:12px 18px;font-size:14px"><a href="mailto:${email}" style="color:#00AFA2;text-decoration:none;font-weight:500">${email}</a></td>
          </tr>
          <tr style="border-bottom:1px solid #E2E8F0">
            <td style="padding:12px 18px;color:#94A3B8;font-size:12px;font-weight:700;letter-spacing:0.06em;vertical-align:top">PHONE</td>
            <td style="padding:12px 18px;color:#1e293b;font-size:14px">${phone || '<span style="color:#CBD5E1">—</span>'}</td>
          </tr>
          <tr>
            <td style="padding:12px 18px;color:#94A3B8;font-size:12px;font-weight:700;letter-spacing:0.06em;vertical-align:top">COMPANY</td>
            <td style="padding:12px 18px;color:#1e293b;font-size:14px">${company || '<span style="color:#CBD5E1">—</span>'}</td>
          </tr>
        </table>
      </div>

      <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;overflow:hidden">
        <div style="background:#1A4A72;padding:10px 18px">
          <p style="margin:0;color:rgba(255,255,255,0.7);font-size:11px;font-weight:700;letter-spacing:0.1em">MESSAGE</p>
        </div>
        <div style="padding:18px">
          <p style="margin:0;color:#334155;font-size:14px;line-height:1.75;white-space:pre-wrap">${message}</p>
        </div>
      </div>

      <div style="margin-top:24px;text-align:center">
        <a href="mailto:${email}" style="display:inline-block;background:linear-gradient(135deg,#00AFA2,#1A4A72);color:#fff;text-decoration:none;font-weight:700;font-size:14px;padding:13px 32px;border-radius:8px;letter-spacing:0.04em">Reply to ${firstName}</a>
      </div>
    </div>
  `);

  // ── Auto-reply to the customer ───────────────────────────────
  const autoReplyHtml = wrap(`
    <div style="background:#ffffff;padding:36px 32px">
      <h2 style="margin:0 0 8px;font-size:22px;color:#0D2B4E">Hey ${firstName}, we got your message!</h2>
      <div style="width:40px;height:3px;background:#00AFA2;border-radius:2px;margin-bottom:20px"></div>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.75;color:#334155">
        Thanks for reaching out to BuildArk. We've received your message and will be in touch shortly — usually within 1 business day.
      </p>
      <p style="margin:0 0 28px;font-size:15px;line-height:1.75;color:#334155">
        In the meantime, feel free to check out our work online or say hello on Instagram.
      </p>

      <div style="background:linear-gradient(135deg,#EFF8FF,#F0F9FF);border:1px solid #BAE6FD;border-radius:10px;padding:20px 24px;margin-bottom:28px">
        <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#0D2B4E;letter-spacing:0.06em">WHAT WE BUILD</p>
        <p style="margin:0;font-size:14px;color:#1A4A72;line-height:1.6">Custom websites, landing pages &amp; apps for small businesses — built to convert, built to scale.</p>
      </div>

      <p style="margin:0 0 28px;font-size:15px;line-height:1.75;color:#334155">
        Talk soon,<br/>
        <strong style="color:#0D2B4E">The BuildArk Team</strong>
      </p>

      <div style="display:flex;gap:12px">
        <a href="https://buildark.dev" style="display:inline-block;background:linear-gradient(135deg,#00AFA2,#1A4A72);color:#fff;text-decoration:none;font-weight:700;font-size:14px;padding:12px 24px;border-radius:8px">Visit Our Site</a>
        <a href="https://instagram.com/buildarksolutions" style="display:inline-block;background:#0D2B4E;color:#fff;text-decoration:none;font-weight:700;font-size:14px;padding:12px 24px;border-radius:8px">Follow Us</a>
      </div>
    </div>
  `);

  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'BuildArk Contact <raz@buildark.dev>',
        to: ['raz@buildark.dev'],
        subject: `New inquiry from ${name}`,
        html: notificationHtml,
      }),
    });

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'BuildArk <raz@buildark.dev>',
        to: [email],
        subject: `We got your message, ${firstName}!`,
        html: autoReplyHtml,
      }),
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Resend error:', err);
    return res.status(500).json({ error: 'Failed to send message. Please try again.' });
  }
}
