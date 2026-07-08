import { Body, Controller, Post } from '@nestjs/common';
import { acceptInviteSchema } from '@pm/types';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { CurrentUser } from '../../common/decorators';
import type { AuthUser } from '../../common/types/request';
import { OrgsService } from './orgs.service';

/**
 * Invite acceptance lives outside the tenant scope on purpose: the caller is
 * authenticated but not yet a member of the org, so TenantGuard would reject
 * them. The token + email match inside the service is the authorization.
 */
@Controller('invites')
export class InvitesController {
  constructor(private readonly orgs: OrgsService) {}

  @Post('accept')
  accept(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(acceptInviteSchema)) body: typeof acceptInviteSchema._output,
  ) {
    return this.orgs.acceptInvite(user.sub, user.email, body.token);
  }
}
