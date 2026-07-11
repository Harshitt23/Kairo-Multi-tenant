import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { BullModule } from '@nestjs/bullmq';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { validateEnv, type Env } from './config/env';
import { PrismaModule } from './common/prisma/prisma.module';
import { AuditModule } from './common/audit/audit.module';
import { StorageModule } from './common/storage/storage.module';
import { MailModule } from './common/mail/mail.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { TenantRlsInterceptor } from './common/interceptors/tenant-rls.interceptor';
import { AuthModule } from './modules/auth/auth.module';
import { OrgsModule } from './modules/orgs/orgs.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { IssuesModule } from './modules/issues/issues.module';
import { AttachmentsModule } from './modules/attachments/attachments.module';
import { CommentsModule } from './modules/comments/comments.module';
import { LabelsModule } from './modules/labels/labels.module';
import { ActivityModule } from './modules/activity/activity.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { RealtimeModule } from './modules/realtime/realtime.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { BillingModule } from './modules/billing/billing.module';
import { HealthModule } from './modules/health/health.module';

function parseRedis(url: string) {
  const u = new URL(url);
  return {
    host: u.hostname,
    port: Number(u.port || 6379),
    ...(u.password ? { password: u.password } : {}),
    ...(u.username ? { username: u.username } : {}),
    // Managed Redis (Upstash, etc.) uses the `rediss://` TLS scheme; ioredis
    // only negotiates TLS when given a `tls` option, so map the scheme to it.
    ...(u.protocol === 'rediss:' ? { tls: {} } : {}),
    // BullMQ requires blocking clients to disable the per-request retry cap.
    maxRetriesPerRequest: null,
  };
}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      // Repo-root .env (turbo runs tasks from each package dir).
      envFilePath: ['.env', '../../.env'],
      validate: validateEnv,
    }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => ({
        connection: parseRedis(config.get('REDIS_URL', { infer: true })),
      }),
    }),
    PrismaModule,
    AuditModule,
    StorageModule,
    MailModule,
    AuthModule,
    OrgsModule,
    ProjectsModule,
    IssuesModule,
    AttachmentsModule,
    CommentsModule,
    LabelsModule,
    ActivityModule,
    DashboardModule,
    RealtimeModule,
    NotificationsModule,
    BillingModule,
    HealthModule,
  ],
  providers: [
    // Secure by default: every route requires a valid JWT unless @Public.
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    // Global rate limiting.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    // Defense in depth: run tenant-scoped requests inside a Postgres RLS
    // transaction so the database enforces isolation, not just the app layer.
    { provide: APP_INTERCEPTOR, useClass: TenantRlsInterceptor },
  ],
})
export class AppModule {}
