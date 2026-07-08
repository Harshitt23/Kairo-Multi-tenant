import { Body, Controller, Get, Patch, Query } from '@nestjs/common';
import { z } from 'zod';
import { notificationPrefsSchema } from '@pm/types';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { CurrentUser } from '../../common/decorators';
import type { AuthUser } from '../../common/types/request';
import { NotificationsService } from './notifications.service';

const markReadSchema = z.object({ ids: z.array(z.string().cuid()).min(1) });

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  list(@CurrentUser() user: AuthUser, @Query('unread') unread?: string) {
    return this.notifications.list(user.sub, unread === 'true');
  }

  @Patch('read')
  markRead(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(markReadSchema)) body: typeof markReadSchema._output,
  ) {
    return this.notifications.markRead(user.sub, body.ids);
  }

  @Patch('read-all')
  markAllRead(@CurrentUser() user: AuthUser) {
    return this.notifications.markAllRead(user.sub);
  }

  @Get('prefs')
  getPrefs(@CurrentUser() user: AuthUser) {
    return this.notifications.getPrefs(user.sub);
  }

  @Patch('prefs')
  updatePrefs(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(notificationPrefsSchema))
    body: typeof notificationPrefsSchema._output,
  ) {
    return this.notifications.updatePrefs(user.sub, body);
  }
}
