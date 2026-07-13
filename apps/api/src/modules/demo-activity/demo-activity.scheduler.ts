import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import type { Queue } from 'bullmq';
import { DEMO_ACTIVITY_QUEUE, DEMO_ACTIVITY_REPEAT_JOB_ID } from './demo-activity.constants';

/**
 * Arms the recurring "keep the demo alive" tick. Every 6h (not once/day) so
 * that even if the dev server isn't left running continuously, whoever starts
 * it next is likely to catch a due occurrence and the workspace never goes
 * more than about a day without new activity.
 */
@Injectable()
export class DemoActivityScheduler implements OnModuleInit {
  private readonly logger = new Logger(DemoActivityScheduler.name);

  constructor(@InjectQueue(DEMO_ACTIVITY_QUEUE) private readonly queue: Queue) {}

  async onModuleInit(): Promise<void> {
    await this.queue.add(
      'tick',
      {},
      { repeat: { pattern: '0 */6 * * *' }, jobId: DEMO_ACTIVITY_REPEAT_JOB_ID },
    );
    // The cron pattern above only fires on the next fixed 6h mark (00/06/12/18),
    // which can be hours away right after boot — leaving a freshly started
    // server (or freshly seeded workspace) with an empty activity feed in the
    // meantime. Kick one un-repeated tick immediately so activity is always
    // there as soon as the dashboard is opened.
    await this.queue.add('tick', {});
    this.logger.log('Demo activity scheduler armed (every 6h, plus an immediate kick)');
  }
}
