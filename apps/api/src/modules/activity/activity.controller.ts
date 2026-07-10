import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { CurrentOrg } from '../../common/decorators';
import { ActivityService } from './activity.service';

@UseGuards(TenantGuard, RbacGuard)
@Controller('orgs/:orgSlug/issues/:issueId/activity')
export class ActivityController {
  constructor(private readonly activity: ActivityService) {}

  @Get()
  list(@CurrentOrg() orgId: string, @Param('issueId') issueId: string) {
    return this.activity.list(orgId, issueId);
  }
}
