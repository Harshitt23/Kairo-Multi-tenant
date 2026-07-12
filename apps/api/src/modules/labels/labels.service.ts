import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@kairo/db';
import type { CreateLabelInput } from '@kairo/types';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../../common/audit/audit.service';

@Injectable()
export class LabelsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  list(organizationId: string) {
    return this.prisma.tenant.label.findMany({
      where: { organizationId },
      select: { id: true, name: true, color: true },
      orderBy: { name: 'asc' },
    });
  }

  async create(organizationId: string, actorId: string, input: CreateLabelInput) {
    try {
      const label = await this.prisma.tenant.label.create({
        data: { organizationId, name: input.name, color: input.color },
        select: { id: true, name: true, color: true },
      });
      await this.audit.record({
        organizationId,
        actorId,
        action: 'label.created',
        entityType: 'Label',
        entityId: label.id,
        metadata: { name: label.name },
      });
      return label;
    } catch (e) {
      // Unique ([organizationId, name]) — surface a friendly message.
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new BadRequestException('A label with that name already exists');
      }
      throw e;
    }
  }

  async remove(organizationId: string, actorId: string, labelId: string) {
    const label = await this.prisma.tenant.label.findFirst({
      where: { id: labelId, organizationId },
      select: { id: true },
    });
    if (!label) throw new NotFoundException('Label not found');

    // IssueLabel rows cascade with the label (onDelete: Cascade).
    await this.prisma.tenant.label.delete({ where: { id: label.id } });
    await this.audit.record({
      organizationId,
      actorId,
      action: 'label.deleted',
      entityType: 'Label',
      entityId: label.id,
    });
  }
}
