const INK = '#2B2A20';
const MUTED = '#5F5D52';
const CANVAS = '#F7F6F2';
const LINE = '#ECE8DF';
const BRAND = '#5B6B2F';
const SUNKEN = '#F1EEEA';

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char] ?? char);
}

function layout(heading: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<body style="margin:0;padding:0;background:${CANVAS};color:${INK};font-family:Inter,Georgia,serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${CANVAS};padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border:1px solid ${LINE};border-radius:16px;padding:32px;">
        <tr><td>
          <table role="presentation" cellpadding="0" cellspacing="0"><tr>
            <td style="width:36px;height:36px;background:${BRAND};border-radius:12px;text-align:center;color:#ffffff;font-family:Georgia,serif;font-size:20px;line-height:36px;">D</td>
            <td style="padding-left:12px;font-family:Georgia,serif;font-size:22px;color:${INK};">Darzaan</td>
          </tr></table>
          <h1 style="margin:28px 0 8px;font-family:Georgia,serif;font-size:28px;font-weight:500;color:${INK};">${heading}</h1>
          ${body}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function button(href: string, label: string): string {
  return `<p style="margin:24px 0 0;"><a href="${escapeHtml(href)}" style="display:inline-block;background:${BRAND};color:#ffffff;text-decoration:none;border-radius:12px;padding:12px 20px;font-family:Inter,Arial,sans-serif;font-size:15px;">${escapeHtml(label)}</a></p>`;
}

export interface WelcomeLetter {
  name: string;
  email: string;
  password: string;
  signInUrl: string;
}

export function welcomeEmail(input: WelcomeLetter): { subject: string; html: string; text: string } {
  const subject = 'Your Darzaan login';
  const text = [
    `Hello ${input.name},`,
    '',
    'A staff login was created for you.',
    `Email: ${input.email}`,
    `Temporary password: ${input.password}`,
    '',
    `Sign in: ${input.signInUrl}`,
    'The first time you sign in, Darzaan asks you to choose a new password.',
  ].join('\n');
  const html = layout('Your login is ready', `
    <p style="margin:0;font-family:Inter,Arial,sans-serif;font-size:15px;line-height:1.5;color:${MUTED};">Hello ${escapeHtml(input.name)}. Use this temporary password once, then choose your own the first time you sign in.</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px;background:${SUNKEN};border-radius:12px;">
      <tr><td style="padding:16px 18px;font-family:Inter,Arial,sans-serif;font-size:14px;color:${MUTED};">Email</td></tr>
      <tr><td style="padding:0 18px 16px;font-family:Inter,Arial,sans-serif;font-size:16px;color:${INK};">${escapeHtml(input.email)}</td></tr>
      <tr><td style="padding:0 18px;font-family:Inter,Arial,sans-serif;font-size:14px;color:${MUTED};">Temporary password</td></tr>
      <tr><td style="padding:6px 18px 16px;font-family:ui-monospace,Consolas,monospace;font-size:18px;color:${INK};">${escapeHtml(input.password)}</td></tr>
    </table>
    ${button(input.signInUrl, 'Sign in')}
  `);
  return { subject, html, text };
}

export function passwordResetEmail(input: { name: string; resetUrl: string }): { subject: string; html: string; text: string } {
  const subject = 'Reset your Darzaan password';
  const text = [
    `Hello ${input.name},`,
    '',
    'We received a request to reset your Darzaan password. This link expires in one hour:',
    input.resetUrl,
    '',
    'If you did not ask for this, ignore the email. Your password stays the same.',
  ].join('\n');
  const html = layout('Reset your password', `
    <p style="margin:0;font-family:Inter,Arial,sans-serif;font-size:15px;line-height:1.5;color:${MUTED};">Hello ${escapeHtml(input.name)}. This link expires in one hour. If you did not ask for a reset, ignore this email and your password stays the same.</p>
    ${button(input.resetUrl, 'Choose a new password')}
    <p style="margin:20px 0 0;font-family:Inter,Arial,sans-serif;font-size:13px;line-height:1.5;color:${MUTED};word-break:break-all;">${escapeHtml(input.resetUrl)}</p>
  `);
  return { subject, html, text };
}

export function notificationEmail(body: string): { subject: string; html: string; text: string } {
  const subject = body.split('\n').map((line) => line.trim()).find(Boolean)?.slice(0, 80) || 'Darzaan';
  const html = layout(escapeHtml(subject), `<p style="margin:0;font-family:Inter,Arial,sans-serif;font-size:15px;line-height:1.5;color:${INK};white-space:pre-wrap;">${escapeHtml(body)}</p>`);
  return { subject, html, text: body };
}
