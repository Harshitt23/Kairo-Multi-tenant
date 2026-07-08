import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import type { NotificationPrefsInput } from '@pm/types';
import { PrismaService } from '../../common/prisma/prisma.service';
import { NOTIFICATIONS_QUEUE, type NotificationJob } from './notifications.constants';

const PREF_SELECT = {
  emailOnAssigned: true,
  emailOnMentioned: true,
  emailOnComment: true,
} as const;

/**
 * Producer side of notifications. Mutating services enqueue jobs here instead
 * of doing fan-out inline, so a slow email send never blocks the request.
 * The worker (notifications.processor) persists in-app rows and sends email.
 */
@Injectable()
export class NotificationsService {
  constructor(
    @InjectQueue(NOTIFICATIONS_QUEUE) private readonly queue: Queue<NotificationJob>,
    private readonly prisma: PrismaService,
  ) {}

  async enqueue(job: NotificationJob): Promise<void> {
    // Don't notify users about their own actions.
    if (job.recipientId === job.actorId) return;
    await this.queue.add(job.type, job, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 },
      removeOnComplete: 1000,
      removeOnFail: 5000,
    });
  }

  list(userId: string, unreadOnly = false) {
    return this.prisma.notification.findMany({
      where: { userId, ...(unreadOnly ? { readAt: null } : {}) },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async markRead(userId: string, ids: string[]): Promise<{ count: number }> {
    const res = await this.prisma.notification.updateMany({
      where: { userId, id: { in: ids }, readAt: null },
      data: { readAt: new Date() },
    });
    return { count: res.count };
  }

  async markAllRead(userId: string): Promise<{ count: number }> {
    const res = await this.prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
    return { count: res.count };
  }

  getPrefs(userId: string) {
    return this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: PREF_SELECT,
    });
  }

  updatePrefs(userId: string, prefs: NotificationPrefsInput) {
    return this.prisma.user.update({
      where: { id: userId },
      data: prefs,
      select: PREF_SELECT,
    });
  }
}
