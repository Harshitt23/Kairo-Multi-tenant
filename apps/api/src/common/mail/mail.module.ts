import { Global, Module } from '@nestjs/common';
import { MailService } from './mail.service';

// Global so the notifications worker (and invites) can send without re-importing.
@Global()
@Module({
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
