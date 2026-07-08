import { Injectable, Logger } from '@nestjs/common';
import type { Prisma } from '@pm/db';
import { PrismaService } from '../prisma/prisma.service';

export interface AuditEntry {
  organizationId: string;
  actorId?: string | null;
  action: string; // e.g. "issue.updated"
  entityType: string; // e.g. "Issue"
  entityId: string;
  metadata?: Prisma.InputJsonValue;
}

/**
 * Append-only audit trail. Every mutating service action calls `record`. Writes
 * are best-effort: an audit failure must never break the user's request, so we
 * log and swallow. For stricter guarantees, write the audit row inside the same
 * Prisma transaction as the mutation (pass a tx client to `record`).
 */
@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async record(entry: AuditEntry, tx?: Prisma.TransactionClient): Promise<void> {
    const client = tx ?? this.prisma;
    try {
      await client.auditLog.create({
        data: {
          organizationId: entry.organizationId,
          actorId: entry.actorId ?? null,
          action: entry.action,
          entityType: entry.entityType,
          entityId: entry.entityId,
          metadata: entry.metadata,
        },
      });
    } catch (err) {
      if (tx) throw err; // inside a tx the caller owns the failure
      this.logger.error(`Failed to write audit log for ${entry.action}`, err as Error);
    }
  }
}
