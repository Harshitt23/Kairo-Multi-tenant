import { Injectable, Logger, type OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Env } from '../../config/env';

export interface MailMessage {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

/**
 * Transactional email. Uses a real SMTP transport when SMTP_URL is set;
 * otherwise falls back to a JSON transport that logs the message — so local dev
 * and CI need no mail server while the call sites stay identical.
 */
@Injectable()
export class MailService implements OnModuleInit {
  private readonly logger = new Logger(MailService.name);
  private transporter!: nodemailer.Transporter;
  private readonly from: string;
  private readonly live: boolean;

  constructor(private readonly config: ConfigService<Env, true>) {
    this.from = config.get('MAIL_FROM', { infer: true });
    this.live = !!config.get('SMTP_URL', { infer: true });
  }

  onModuleInit(): void {
    const url = this.config.get('SMTP_URL', { infer: true });
    this.transporter = this.live
      ? nodemailer.createTransport(url)
      : nodemailer.createTransport({ jsonTransport: true });
    this.logger.log(`Mail transport: ${this.live ? 'SMTP' : 'console (dev)'}`);
  }

  async send(msg: MailMessage): Promise<void> {
    try {
      const info = await this.transporter.sendMail({ from: this.from, ...msg });
      if (!this.live) {
        this.logger.debug(`[email] to=${msg.to} subject="${msg.subject}"\n${info.message}`);
      }
    } catch (err) {
      // Email is best-effort: never fail the caller (it runs in a job worker).
      this.logger.error(`Failed to send email to ${msg.to}: ${(err as Error).message}`);
    }
  }
}
