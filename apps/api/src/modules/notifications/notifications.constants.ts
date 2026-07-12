import type { NotificationType } from '@kairo/db';

export const NOTIFICATIONS_QUEUE = 'notifications';

export interface NotificationJob {
  organizationId: string;
  recipientId: string;
  actorId: string | null;
  type: NotificationType;
  payload: Record<string, unknown>;
}
