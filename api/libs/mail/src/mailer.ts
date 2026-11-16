import { Injectable } from '@nestjs/common';
import nodemailer from 'nodemailer';
import { createLogger } from '../../observability/src/logger';

export interface OutboundMail {
  to: string;
  subject: string;
  html: string;
  text: string;
}

const logger = createLogger('mail');

export function mailConfigured(): boolean {
  return Boolean(process.env.FROM_MAIL?.trim() && process.env.FROM_MAIL_PASSWORD?.trim());
}

export function appOrigin(): string {
  return (process.env.WEB_URL || 'http://localhost:5173').replace(/\/$/, '');
}

@Injectable()
export class Mailer {
  async send(message: OutboundMail): Promise<void> {
    const user = process.env.FROM_MAIL?.trim();
    const pass = process.env.FROM_MAIL_PASSWORD?.replace(/\s+/g, '');
    if (!user || !pass) throw new Error('Mail is not configured');
    const transport = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: { user, pass },
    });
    await transport.sendMail({
      from: `Darzaan <${user}>`,
      to: message.to,
      subject: message.subject,
      html: message.html,
      text: message.text,
    });
    logger.info({ to: message.to, subject: message.subject }, 'email sent');
  }
}
