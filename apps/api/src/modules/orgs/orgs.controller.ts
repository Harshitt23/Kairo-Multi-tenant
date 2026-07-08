import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  createOrgSchema,
  inviteMemberSchema,
  updateMemberRoleSchema,
} from '@pm/types';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { CurrentOrg, CurrentUser, RequirePermission } from '../../common/decorators';
import type { AuthUser } from '../../common/types/request';
import { OrgsService } from './orgs.service';

@Controller('orgs')
export class OrgsController {
  constructor(private readonly orgs: OrgsService) {}

  // No TenantGuard: creating a brand-new tenant. Auth alone is required.
  @Post()
  create(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(createOrgSchema)) body: typeof createOrgSchema._output,
  ) {
    return this.orgs.create(user.sub, body);
  }

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.orgs.listForUser(user.sub);
  }

  // From here down, every route is tenant-scoped + RBAC-checked.
  @UseGuards(TenantGuard, RbacGuard)
  @Get(':orgSlug')
  get(@CurrentOrg() orgId: string) {
    return this.orgs.getBySlug(orgId);
  }

  @UseGuards(TenantGuard, RbacGuard)
  @Get(':orgSlug/members')
  members(@CurrentOrg() orgId: string) {
    return this.orgs.listMembers(orgId);
  }

  @UseGuards(TenantGuard, RbacGuard)
  @RequirePermission('member:invite')
  @Post(':orgSlug/members')
  addMember(
    @CurrentOrg() orgId: string,
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(inviteMemberSchema)) body: typeof inviteMemberSchema._output,
  ) {
    return this.orgs.addMember(orgId, user.sub, body.email, body.role);
  }

  @UseGuards(TenantGuard, RbacGuard)
  @RequirePermission('member:invite')
  @Get(':orgSlug/invites')
  invites(@CurrentOrg() orgId: string) {
    return this.orgs.listInvites(orgId);
  }

  @UseGuards(TenantGuard, RbacGuard)
  @RequirePermission('member:update_role')
  @Patch(':orgSlug/members/:userId')
  updateRole(
    @CurrentOrg() orgId: string,
    @CurrentUser() user: AuthUser,
    @Param('userId') userId: string,
    @Body(new ZodValidationPipe(updateMemberRoleSchema)) body: typeof updateMemberRoleSchema._output,
  ) {
    return this.orgs.updateMemberRole(orgId, user.sub, userId, body.role);
  }

  @UseGuards(TenantGuard, RbacGuard)
  @RequirePermission('member:remove')
  @Delete(':orgSlug/members/:userId')
  @HttpCode(204)
  removeMember(
    @CurrentOrg() orgId: string,
    @CurrentUser() user: AuthUser,
    @Param('userId') userId: string,
  ) {
    return this.orgs.removeMember(orgId, user.sub, userId);
  }
}
