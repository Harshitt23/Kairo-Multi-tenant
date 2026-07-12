import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { createLabelSchema } from '@kairo/types';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { CurrentOrg, CurrentUser, RequirePermission } from '../../common/decorators';
import type { AuthUser } from '../../common/types/request';
import { LabelsService } from './labels.service';

@UseGuards(TenantGuard, RbacGuard)
@Controller('orgs/:orgSlug/labels')
export class LabelsController {
  constructor(private readonly labels: LabelsService) {}

  @Get()
  list(@CurrentOrg() orgId: string) {
    return this.labels.list(orgId);
  }

  // Anyone who can create issues can create a label to tag them.
  @RequirePermission('issue:create')
  @Post()
  create(
    @CurrentOrg() orgId: string,
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(createLabelSchema)) body: typeof createLabelSchema._output,
  ) {
    return this.labels.create(orgId, user.sub, body);
  }

  @RequirePermission('issue:delete')
  @Delete(':id')
  @HttpCode(204)
  remove(
    @CurrentOrg() orgId: string,
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ) {
    return this.labels.remove(orgId, user.sub, id);
  }
}
