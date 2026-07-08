import type { NotificationType } from '@pm/db';

export const NOTIFICATIONS_QUEUE = 'notifications';

export interface NotificationJob {
  organizationId: string;
  recipientId: string;
  actorId: string | null;
  type: NotificationType;
  payload: Record<string, unknown>;
}
