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
import { confirmAttachmentSchema, presignAttachmentSchema } from '@pm/types';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { CurrentOrg, CurrentUser, RequirePermission } from '../../common/decorators';
import type { AuthUser } from '../../common/types/request';
import { AttachmentsService } from './attachments.service';

@UseGuards(TenantGuard, RbacGuard)
@Controller('orgs/:orgSlug/issues/:issueId/attachments')
export class AttachmentsController {
  constructor(private readonly attachments: AttachmentsService) {}

  @Get()
  list(@CurrentOrg() orgId: string, @Param('issueId') issueId: string) {
    return this.attachments.list(orgId, issueId);
  }

  @RequirePermission('attachment:upload')
  @Post('presign')
  presign(
    @CurrentOrg() orgId: string,
    @Param('issueId') issueId: string,
    @Body(new ZodValidationPipe(presignAttachmentSchema))
    body: typeof presignAttachmentSchema._output,
  ) {
    return this.attachments.presign(orgId, issueId, body);
  }

  @RequirePermission('attachment:upload')
  @Post()
  confirm(
    @CurrentOrg() orgId: string,
    @CurrentUser() user: AuthUser,
    @Param('issueId') issueId: string,
    @Body(new ZodValidationPipe(confirmAttachmentSchema))
    body: typeof confirmAttachmentSchema._output,
  ) {
    return this.attachments.confirm(orgId, user.sub, issueId, body);
  }

  @RequirePermission('attachment:upload')
  @Delete(':id')
  @HttpCode(204)
  remove(
    @CurrentOrg() orgId: string,
    @CurrentUser() user: AuthUser,
    @Param('issueId') issueId: string,
    @Param('id') id: string,
  ) {
    return this.attachments.remove(orgId, user.sub, issueId, id);
  }
}
