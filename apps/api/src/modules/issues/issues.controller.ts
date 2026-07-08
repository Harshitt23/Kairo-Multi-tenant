import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  createIssueSchema,
  issueFilterSchema,
  moveIssueSchema,
  updateIssueSchema,
} from '@pm/types';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { CurrentOrg, CurrentUser, RequirePermission } from '../../common/decorators';
import type { AuthUser } from '../../common/types/request';
import { IssuesService } from './issues.service';

@UseGuards(TenantGuard, RbacGuard)
@Controller('orgs/:orgSlug/projects/:projectKey/issues')
export class IssuesController {
  constructor(private readonly issues: IssuesService) {}

  @Get()
  list(
    @CurrentOrg() orgId: string,
    @Param('projectKey') projectKey: string,
    @Query(new ZodValidationPipe(issueFilterSchema)) filter: typeof issueFilterSchema._output,
  ) {
    return this.issues.list(orgId, projectKey, filter);
  }

  @Get(':number')
  get(
    @CurrentOrg() orgId: string,
    @Param('projectKey') projectKey: string,
    @Param('number', ParseIntPipe) number: number,
  ) {
    return this.issues.getByNumber(orgId, projectKey, number);
  }

  @RequirePermission('issue:create')
  @Post()
  create(
    @CurrentOrg() orgId: string,
    @CurrentUser() user: AuthUser,
    @Param('projectKey') projectKey: string,
    @Body(new ZodValidationPipe(createIssueSchema)) body: typeof createIssueSchema._output,
  ) {
    return this.issues.create(orgId, user.sub, projectKey, body);
  }

  @RequirePermission('issue:update')
  @Patch(':id')
  update(
    @CurrentOrg() orgId: string,
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateIssueSchema)) body: typeof updateIssueSchema._output,
  ) {
    return this.issues.update(orgId, user.sub, id, body);
  }

  @RequirePermission('issue:update')
  @Patch(':id/move')
  move(
    @CurrentOrg() orgId: string,
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(moveIssueSchema)) body: typeof moveIssueSchema._output,
  ) {
    return this.issues.move(orgId, user.sub, id, body);
  }

  @RequirePermission('issue:delete')
  @Delete(':id')
  @HttpCode(204)
  remove(
    @CurrentOrg() orgId: string,
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ) {
    return this.issues.remove(orgId, user.sub, id);
  }
}
