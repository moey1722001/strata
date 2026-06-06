import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.RESEND_API_KEY) {
    return response.status(500).json({ error: 'RESEND_API_KEY is not configured for contractor invitations.' });
  }

  const { to, businessName, contactPerson, atlasUrl } = request.body ?? {};
  if (!to || !businessName) {
    return response.status(400).json({ error: 'Contractor email and business name are required.' });
  }

  const appUrl = atlasUrl || 'https://strata-sandy.vercel.app';
  const { data, error } = await resend.emails.send({
    from: 'Atlas <onboarding@resend.dev>',
    to,
    subject: 'You have been invited to Atlas',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px;color:#0f172a">
        <h1 style="font-size:24px;margin:0 0 16px">Welcome to Atlas</h1>
        <p>Hello ${escapeHtml(contactPerson || businessName)},</p>
        <p>${escapeHtml(businessName)} has been invited to access assigned strata jobs in Atlas.</p>
        <p>You can open Atlas, switch to the Contractor role for testing, and view assigned jobs.</p>
        <p style="margin:28px 0">
          <a href="${escapeHtml(appUrl)}" style="background:#0f172a;color:white;padding:12px 18px;border-radius:10px;text-decoration:none;font-weight:700">Open Atlas</a>
        </p>
        <p style="font-size:13px;color:#64748b">Full contractor authentication will be added after the MVP workflow is tested.</p>
      </div>
    `
  });

  if (error) return response.status(400).json({ error: error.message ?? 'Resend could not send the invitation.' });
  return response.status(200).json({ id: data?.id });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
