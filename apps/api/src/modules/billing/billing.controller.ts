import {
  BadRequestException,
  Body,
  Controller,
  Headers,
  HttpCode,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { z } from 'zod';
import type { Request } from 'express';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { CurrentOrg, Public, RequirePermission } from '../../common/decorators';
import { BillingService } from './billing.service';

const checkoutSchema = z.object({ plan: z.enum(['PRO', 'BUSINESS']) });

@Controller()
export class BillingController {
  constructor(private readonly billing: BillingService) {}

  @UseGuards(TenantGuard, RbacGuard)
  @RequirePermission('org:manage_billing')
  @Post('orgs/:orgSlug/billing/checkout')
  checkout(
    @CurrentOrg() orgId: string,
    @Body(new ZodValidationPipe(checkoutSchema)) body: typeof checkoutSchema._output,
  ) {
    return this.billing.createCheckout(orgId, body.plan);
  }

  // Stripe calls this server-to-server; no JWT. Signature verifies authenticity.
  // Needs the raw body (configured in main.ts) for signature validation.
  @Public()
  @Post('billing/webhook')
  @HttpCode(200)
  async webhook(
    @Req() req: Request & { rawBody?: Buffer },
    @Headers('stripe-signature') signature?: string,
  ) {
    if (!signature || !req.rawBody) {
      throw new BadRequestException('Missing Stripe signature or raw body');
    }
    await this.billing.handleWebhook(signature, req.rawBody);
    return { received: true };
  }
}
