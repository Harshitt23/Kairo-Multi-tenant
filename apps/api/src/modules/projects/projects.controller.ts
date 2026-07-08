import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { createProjectSchema } from '@pm/types';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { CurrentOrg, CurrentUser, RequirePermission } from '../../common/decorators';
import type { AuthUser } from '../../common/types/request';
import { ProjectsService } from './projects.service';

@UseGuards(TenantGuard, RbacGuard)
@Controller('orgs/:orgSlug/projects')
export class ProjectsController {
  constructor(private readonly projects: ProjectsService) {}

  @Get()
  list(@CurrentOrg() orgId: string) {
    return this.projects.list(orgId);
  }

  @Get(':projectKey')
  get(@CurrentOrg() orgId: string, @Param('projectKey') key: string) {
    return this.projects.getByKey(orgId, key);
  }

  @RequirePermission('project:create')
  @Post()
  create(
    @CurrentOrg() orgId: string,
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(createProjectSchema)) body: typeof createProjectSchema._output,
  ) {
    return this.projects.create(orgId, user.sub, body);
  }
}
