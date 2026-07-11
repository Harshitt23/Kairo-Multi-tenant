import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { CurrentOrg } from '../../common/decorators';
import { DashboardService } from './dashboard.service';

function currentMonth(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
}

@UseGuards(TenantGuard, RbacGuard)
@Controller('orgs/:orgSlug/dashboard')
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get('stats')
  stats(@CurrentOrg() orgId: string) {
    return this.dashboard.getStats(orgId);
  }

  @Get('activity')
  activity(@CurrentOrg() orgId: string) {
    return this.dashboard.getActivity(orgId);
  }

  @Get('calendar')
  calendar(@CurrentOrg() orgId: string, @Query('month') month?: string) {
    return this.dashboard.getCalendarEvents(orgId, month || currentMonth());
  }
}
