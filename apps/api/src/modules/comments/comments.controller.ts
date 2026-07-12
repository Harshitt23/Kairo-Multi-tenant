import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { createCommentSchema } from '@kairo/types';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { CurrentOrg, CurrentUser, RequirePermission } from '../../common/decorators';
import type { AuthUser } from '../../common/types/request';
import { CommentsService } from './comments.service';

@UseGuards(TenantGuard, RbacGuard)
@Controller('orgs/:orgSlug/issues/:issueId/comments')
export class CommentsController {
  constructor(private readonly comments: CommentsService) {}

  @Get()
  list(@CurrentOrg() orgId: string, @Param('issueId') issueId: string) {
    return this.comments.list(orgId, issueId);
  }

  @RequirePermission('comment:create')
  @Post()
  create(
    @CurrentOrg() orgId: string,
    @CurrentUser() user: AuthUser,
    @Param('issueId') issueId: string,
    @Body(new ZodValidationPipe(createCommentSchema)) body: typeof createCommentSchema._output,
  ) {
    return this.comments.create(orgId, user.sub, issueId, body);
  }
}
