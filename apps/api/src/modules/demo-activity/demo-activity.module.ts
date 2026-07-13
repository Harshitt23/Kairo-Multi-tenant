import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { DEMO_ACTIVITY_QUEUE } from './demo-activity.constants';
import { DemoActivityProcessor } from './demo-activity.processor';
import { DemoActivityScheduler } from './demo-activity.scheduler';

@Module({
  imports: [BullModule.registerQueue({ name: DEMO_ACTIVITY_QUEUE })],
  providers: [DemoActivityProcessor, DemoActivityScheduler],
})
export class DemoActivityModule {}
