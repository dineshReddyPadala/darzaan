import { HttpStatus, Injectable } from '@nestjs/common';
import { AppError } from '../../../../libs/common/src/http';
import { mailConfigured, Mailer } from '../../../../libs/mail/src/mailer';
import { notificationEmail } from '../../../../libs/mail/src/templates';
import { createLogger } from '../../../../libs/observability/src/logger';

export interface OutboundMessage {
  to: string;
  channel: 'WhatsApp' | 'SMS' | 'Email';
  body: string;
  eventId?: string;
}

export interface NotificationChannel {
  send(message: OutboundMessage): Promise<{ status: 'sent' | 'logged'; detail: string }>;
}

const logger = createLogger('notification-channel');

/** Email uses the configured mailbox. WhatsApp and SMS stay in the log. */
@Injectable()
export class LogNotificationChannel implements NotificationChannel {
  constructor(private readonly mail: Mailer) {}

  async send(message: OutboundMessage): Promise<{ status: 'sent' | 'logged'; detail: string }> {
    if (message.channel === 'Email' && mailConfigured()) {
      const letter = notificationEmail(message.body);
      try {
        await this.mail.send({ to: message.to, ...letter });
      } catch (error) {
        logger.error({ to: message.to, err: error instanceof Error ? error.message : 'mail failed' }, 'email failed');
        throw new AppError(HttpStatus.BAD_GATEWAY, 'The email could not be sent. Try again.');
      }
      return { status: 'sent', detail: 'Email sent.' };
    }
    logger.info({ channel: message.channel, to: message.to, eventId: message.eventId }, 'notification logged; no message was sent');
    return { status: 'logged', detail: 'No WhatsApp or SMS was sent. The message is only in the log.' };
  }
}
