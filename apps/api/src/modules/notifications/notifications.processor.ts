import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import type { Job } from 'bullmq';
import type { NotificationType, Prisma } from '@pm/db';
import { PrismaService } from '../../common/prisma/prisma.service';
import { MailService } from '../../common/mail/mail.service';
import { NOTIFICATIONS_QUEUE, type NotificationJob } from './notifications.constants';

// Map each notification type to the user pref that gates its email + a subject.
const EMAIL_RULES: Record<
  NotificationType,
  { pref: 'emailOnAssigned' | 'emailOnMentioned' | 'emailOnComment' | null; subject: string }
> = {
  ISSUE_ASSIGNED: { pref: 'emailOnAssigned', subject: 'You were assigned an issue' },
  MENTIONED: { pref: 'emailOnMentioned', subject: 'You were mentioned' },
  COMMENT_CREATED: { pref: 'emailOnComment', subject: 'New comment on an issue you follow' },
  ISSUE_STATUS_CHANGED: { pref: null, subject: 'An issue status changed' },
  INVITED: { pref: null, subject: 'You were invited to a workspace' },
  INVITE_ACCEPTED: { pref: null, subject: 'Your invite was accepted' },
};

/**
 * Worker that drains the notifications queue: always writes the in-app row, then
 * sends an email when the recipient's preference for that notification type is
 * enabled. Email is best-effort (MailService swallows failures).
 */
@Processor(NOTIFICATIONS_QUEUE, { concurrency: 10 })
export class NotificationsProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationsProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
  ) {
    super();
  }

  async process(job: Job<NotificationJob>): Promise<void> {
    const { organizationId, recipientId, type, payload } = job.data;

    // Background workers have no request context, so set the RLS tenant context
    // explicitly: the in-app row is written with the org scope active, keeping
    // the worker consistent with the request path's isolation guarantees.
    await this.prisma.runWithTenant(organizationId, (tx) =>
      tx.notification.create({
        data: {
          organizationId,
          userId: recipientId,
          type,
          payload: payload as Prisma.InputJsonValue,
        },
      }),
    );

    const rule = EMAIL_RULES[type];
    if (!rule.pref) {
      this.logger.debug(`Notified ${recipientId} (${type}, in-app only)`);
      return;
    }

    const user = await this.prisma.user.findUnique({
      where: { id: recipientId },
      select: {
        email: true,
        name: true,
        emailOnAssigned: true,
        emailOnMentioned: true,
        emailOnComment: true,
      },
    });
    if (!user || !user[rule.pref]) {
      this.logger.debug(`Notified ${recipientId} (${type}, email muted by pref)`);
      return;
    }

    const title = (payload.title as string | undefined) ?? 'an issue';
    await this.mail.send({
      to: user.email,
      subject: rule.subject,
      text: `Hi ${user.name},\n\n${rule.subject}: "${title}".\n\nOpen PM SaaS to view it.`,
    });
    this.logger.debug(`Notified ${recipientId} (${type}, email sent)`);
  }
}
