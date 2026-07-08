import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type {
  ConfirmAttachmentInput,
  PresignAttachmentInput,
} from '@pm/types';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../../common/audit/audit.service';
import { StorageService } from '../../common/storage/storage.service';

@Injectable()
export class AttachmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly storage: StorageService,
  ) {}

  /** Load an issue that must belong to the tenant, or 404 (no cross-tenant leak). */
  private async resolveIssue(organizationId: string, issueId: string) {
    const issue = await this.prisma.tenant.issue.findFirst({
      where: { id: issueId, organizationId },
      select: { id: true, projectId: true },
    });
    if (!issue) throw new NotFoundException('Issue not found');
    return issue;
  }

  /**
   * Step 1: hand back a presigned PUT URL + the object key the client should
   * report back on confirm. The key is namespaced under the tenant so a leaked
   * key can't be confirmed against another org's issue.
   */
  async presign(organizationId: string, issueId: string, input: PresignAttachmentInput) {
    await this.resolveIssue(organizationId, issueId);
    const fileKey = this.storage.buildKey(organizationId, issueId, input.fileName);
    const uploadUrl = await this.storage.presignUpload(fileKey, input.contentType);
    return { uploadUrl, fileKey };
  }

  /** Step 2: persist the row after the direct-to-S3 upload succeeds. */
  async confirm(
    organizationId: string,
    actorId: string,
    issueId: string,
    input: ConfirmAttachmentInput,
  ) {
    await this.resolveIssue(organizationId, issueId);

    // The key must be inside this tenant+issue namespace built in presign().
    const expectedPrefix = `org/${organizationId}/issues/${issueId}/`;
    if (!input.fileKey.startsWith(expectedPrefix)) {
      throw new ForbiddenException('File key does not belong to this issue');
    }

    const attachment = await this.prisma.tenant.attachment.create({
      data: {
        issueId,
        uploaderId: actorId,
        fileName: input.fileName,
        fileKey: input.fileKey,
        contentType: input.contentType,
        size: input.size,
      },
      include: { uploader: { select: { id: true, name: true, avatarUrl: true } } },
    });

    await this.audit.record({
      organizationId,
      actorId,
      action: 'attachment.created',
      entityType: 'Attachment',
      entityId: attachment.id,
      metadata: { issueId, fileName: input.fileName, size: input.size },
    });

    return this.withUrl(attachment);
  }

  /** List attachments for an issue, each with a short-lived download URL. */
  async list(organizationId: string, issueId: string) {
    await this.resolveIssue(organizationId, issueId);
    const rows = await this.prisma.tenant.attachment.findMany({
      where: { issueId },
      orderBy: { createdAt: 'desc' },
      include: { uploader: { select: { id: true, name: true, avatarUrl: true } } },
    });
    return Promise.all(rows.map((r) => this.withUrl(r)));
  }

  async remove(organizationId: string, actorId: string, issueId: string, attachmentId: string) {
    await this.resolveIssue(organizationId, issueId);
    const attachment = await this.prisma.tenant.attachment.findFirst({
      where: { id: attachmentId, issueId },
      select: { id: true, fileKey: true },
    });
    if (!attachment) throw new NotFoundException('Attachment not found');

    await this.prisma.tenant.attachment.delete({ where: { id: attachment.id } });
    await this.storage.delete(attachment.fileKey);

    await this.audit.record({
      organizationId,
      actorId,
      action: 'attachment.deleted',
      entityType: 'Attachment',
      entityId: attachment.id,
      metadata: { issueId },
    });
  }

  private async withUrl<T extends { fileKey: string; fileName: string }>(row: T) {
    const downloadUrl = await this.storage.presignDownload(row.fileKey, row.fileName);
    return { ...row, downloadUrl };
  }
}
