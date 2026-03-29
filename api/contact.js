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

  try {
    // Notification email to you
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'BuildArk Contact <hello@buildark.dev>',
        to: ['rafartelber@gmail.com'],
        subject: `New inquiry from ${name}`,
        html: `
          <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#1a1a2e">
            <div style="background:#023E8A;padding:24px 32px;border-radius:8px 8px 0 0">
              <img src="https://buildark.dev/buildarklogo.jpg" alt="BuildArk" width="48" style="border-radius:50%" />
              <h2 style="color:#fff;margin:12px 0 0;font-size:18px">New Contact Form Submission</h2>
            </div>
            <div style="background:#f9f9fb;padding:28px 32px;border-radius:0 0 8px 8px;border:1px solid #e5e7eb;border-top:none">
              <table style="width:100%;border-collapse:collapse">
                <tr><td style="padding:8px 0;color:#6b7280;width:120px;vertical-align:top">Name</td><td style="padding:8px 0;font-weight:600">${name}</td></tr>
                <tr><td style="padding:8px 0;color:#6b7280;vertical-align:top">Email</td><td style="padding:8px 0"><a href="mailto:${email}" style="color:#0096C7">${email}</a></td></tr>
                <tr><td style="padding:8px 0;color:#6b7280;vertical-align:top">Phone</td><td style="padding:8px 0">${phone || '—'}</td></tr>
                <tr><td style="padding:8px 0;color:#6b7280;vertical-align:top">Company</td><td style="padding:8px 0">${company || '—'}</td></tr>
              </table>
              <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0" />
              <p style="color:#6b7280;margin:0 0 8px;font-size:13px">MESSAGE</p>
              <p style="margin:0;line-height:1.7;white-space:pre-wrap">${message}</p>
            </div>
          </div>
        `,
      }),
    });

    // Auto-reply to the customer
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'BuildArk <hello@buildark.dev>',
        to: [email],
        subject: `We got your message, ${name.split(' ')[0]}!`,
        html: `
          <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#1a1a2e">
            <div style="background:#023E8A;padding:24px 32px;border-radius:8px 8px 0 0;text-align:center">
              <img src="https://buildark.dev/buildarklogo.jpg" alt="BuildArk" width="64" style="border-radius:50%" />
            </div>
            <div style="padding:32px;background:#f9f9fb;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px">
              <h2 style="margin:0 0 16px;font-size:22px">Thanks for reaching out, ${name.split(' ')[0]}!</h2>
              <p style="margin:0 0 16px;line-height:1.7;color:#444">We received your message and will be in touch shortly. In the meantime, feel free to check out our work or follow us on Instagram.</p>
              <p style="margin:0 0 32px;line-height:1.7;color:#444">Talk soon,<br/><strong>The BuildArk Team</strong></p>
              <a href="https://buildark.dev" style="display:inline-block;background:#0096C7;color:#fff;text-decoration:none;font-weight:600;padding:12px 28px;border-radius:6px;font-size:15px">Visit BuildArk</a>
            </div>
            <p style="text-align:center;color:#9ca3af;font-size:12px;margin-top:16px">BuildArk · hello@buildark.dev · buildark.dev</p>
          </div>
        `,
      }),
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Resend error:', err);
    return res.status(500).json({ error: 'Failed to send message. Please try again.' });
  }
}
