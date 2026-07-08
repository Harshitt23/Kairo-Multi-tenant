import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import type { SubscriptionPlan } from '@pm/db';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../../common/audit/audit.service';
import type { Env } from '../../config/env';

/**
 * Stripe-backed billing. If STRIPE_SECRET_KEY is unset the service runs in a
 * disabled state (local/dev without Stripe) and checkout/portal calls 503 —
 * the rest of the app keeps working on the FREE plan.
 */
@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);
  private readonly stripe: Stripe | null;

  constructor(
    private readonly config: ConfigService<Env, true>,
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {
    const key = this.config.get('STRIPE_SECRET_KEY', { infer: true });
    this.stripe = key ? new Stripe(key) : null;
    if (!this.stripe) this.logger.warn('Stripe disabled (no STRIPE_SECRET_KEY)');
  }

  private client(): Stripe {
    if (!this.stripe) throw new ServiceUnavailableException('Billing is not configured');
    return this.stripe;
  }

  private priceFor(plan: Exclude<SubscriptionPlan, 'FREE'>): string {
    const id =
      plan === 'PRO'
        ? this.config.get('STRIPE_PRICE_PRO', { infer: true })
        : this.config.get('STRIPE_PRICE_BUSINESS', { infer: true });
    if (!id) throw new ServiceUnavailableException(`No Stripe price configured for ${plan}`);
    return id;
  }

  /** Create a Checkout session to upgrade the org's subscription. */
  async createCheckout(
    organizationId: string,
    plan: Exclude<SubscriptionPlan, 'FREE'>,
  ): Promise<{ url: string }> {
    const stripe = this.client();
    const org = await this.prisma.organization.findUniqueOrThrow({
      where: { id: organizationId },
      include: { subscription: true },
    });

    let customerId = org.subscription?.stripeCustomerId ?? undefined;
    if (!customerId) {
      const customer = await stripe.customers.create({
        name: org.name,
        metadata: { organizationId },
      });
      customerId = customer.id;
      await this.prisma.subscription.update({
        where: { organizationId },
        data: { stripeCustomerId: customerId },
      });
    }

    const webOrigin = this.config.get('WEB_ORIGIN', { infer: true });
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: this.priceFor(plan), quantity: org.subscription?.seats ?? 1 }],
      success_url: `${webOrigin}/${org.slug}/settings/billing?status=success`,
      cancel_url: `${webOrigin}/${org.slug}/settings/billing?status=cancelled`,
      metadata: { organizationId, plan },
    });

    return { url: session.url! };
  }

  /** Verify + apply a Stripe webhook event (subscription lifecycle). */
  async handleWebhook(signature: string, rawBody: Buffer): Promise<void> {
    const stripe = this.client();
    const secret = this.config.get('STRIPE_WEBHOOK_SECRET', { infer: true });
    const event = stripe.webhooks.constructEvent(rawBody, signature, secret);

    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        await this.reconcileSubscription(sub);
        break;
      }
      default:
        this.logger.debug(`Unhandled Stripe event ${event.type}`);
    }
  }

  private async reconcileSubscription(sub: Stripe.Subscription): Promise<void> {
    const record = await this.prisma.subscription.findFirst({
      where: { stripeCustomerId: sub.customer as string },
    });
    if (!record) {
      this.logger.warn(`No local subscription for customer ${String(sub.customer)}`);
      return;
    }

    const statusMap: Record<string, 'ACTIVE' | 'TRIALING' | 'PAST_DUE' | 'CANCELED' | 'INCOMPLETE'> =
      {
        active: 'ACTIVE',
        trialing: 'TRIALING',
        past_due: 'PAST_DUE',
        canceled: 'CANCELED',
        unpaid: 'PAST_DUE',
        incomplete: 'INCOMPLETE',
        incomplete_expired: 'CANCELED',
      };

    const priceId = sub.items.data[0]?.price.id;
    const plan: SubscriptionPlan =
      priceId === this.config.get('STRIPE_PRICE_BUSINESS', { infer: true })
        ? 'BUSINESS'
        : priceId === this.config.get('STRIPE_PRICE_PRO', { infer: true })
          ? 'PRO'
          : 'FREE';

    await this.prisma.subscription.update({
      where: { id: record.id },
      data: {
        stripeSubscriptionId: sub.id,
        plan: sub.status === 'canceled' ? 'FREE' : plan,
        status: statusMap[sub.status] ?? 'INCOMPLETE',
        cancelAtPeriodEnd: sub.cancel_at_period_end,
        currentPeriodEnd: sub.current_period_end
          ? new Date(sub.current_period_end * 1000)
          : null,
      },
    });

    await this.audit.record({
      organizationId: record.organizationId,
      actorId: null,
      action: 'billing.subscription_updated',
      entityType: 'Subscription',
      entityId: record.id,
      metadata: { status: sub.status, plan },
    });
  }
}
