import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { OrgsController } from './orgs.controller';
import { InvitesController } from './invites.controller';
import { OrgsService } from './orgs.service';

@Module({
  imports: [NotificationsModule],
  controllers: [OrgsController, InvitesController],
  providers: [OrgsService],
  exports: [OrgsService],
})
export class OrgsModule {}
