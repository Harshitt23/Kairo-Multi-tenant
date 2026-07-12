import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { CreateProjectInput } from '@kairo/types';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../../common/audit/audit.service';

@Injectable()
export class ProjectsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  list(organizationId: string) {
    return this.prisma.tenant.project.findMany({
      where: { organizationId, archivedAt: null },
      select: {
        id: true,
        key: true,
        name: true,
        description: true,
        createdAt: true,
        team: { select: { id: true, name: true, key: true } },
        _count: { select: { issues: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getByKey(organizationId: string, key: string) {
    const project = await this.prisma.tenant.project.findUnique({
      where: { organizationId_key: { organizationId, key } },
      include: { team: { select: { id: true, name: true, key: true } } },
    });
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }

  async create(organizationId: string, actorId: string, input: CreateProjectInput) {
    const clash = await this.prisma.tenant.project.findUnique({
      where: { organizationId_key: { organizationId, key: input.key } },
    });
    if (clash) throw new BadRequestException(`Project key "${input.key}" already in use`);

    // If a team is supplied, it must belong to this tenant.
    if (input.teamId) {
      const team = await this.prisma.tenant.team.findFirst({
        where: { id: input.teamId, organizationId },
        select: { id: true },
      });
      if (!team) throw new BadRequestException('Team not found in this organization');
    }

    const project = await this.prisma.tenant.project.create({
      data: {
        organizationId,
        key: input.key,
        name: input.name,
        description: input.description,
        teamId: input.teamId,
      },
    });

    await this.audit.record({
      organizationId,
      actorId,
      action: 'project.created',
      entityType: 'Project',
      entityId: project.id,
      metadata: { key: project.key },
    });

    return project;
  }
}
