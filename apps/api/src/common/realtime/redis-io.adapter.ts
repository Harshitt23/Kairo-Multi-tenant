import { Logger, type INestApplicationContext } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { Redis } from 'ioredis';
import type { ServerOptions, Server } from 'socket.io';

const CONNECT_TIMEOUT_MS = 5_000;

/** Reject after `ms`, running `onTimeout` so abandoned clients stop retrying. */
function withTimeout<T>(promise: Promise<T>, ms: number, onTimeout: () => void): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      onTimeout();
      reject(new Error(`connect timed out after ${ms}ms`));
    }, ms);
    promise.then(
      (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      (e) => {
        clearTimeout(timer);
        reject(e);
      },
    );
  });
}

/**
 * socket.io adapter backed by Redis pub/sub, so room broadcasts (the board's
 * `emitToProject`) fan out across every API instance instead of only reaching
 * clients on the node that emitted. Installed in main.ts via
 * `app.useWebSocketAdapter` before the gateways initialize, so it applies to
 * the `/realtime` namespace too.
 *
 * If Redis can't be reached we fall back to the default in-memory adapter
 * (correct for a single node) rather than failing startup.
 */
export class RedisIoAdapter extends IoAdapter {
  private readonly logger = new Logger(RedisIoAdapter.name);
  private adapterConstructor?: ReturnType<typeof createAdapter>;
  private clients: Redis[] = [];

  constructor(
    app: INestApplicationContext,
    private readonly redisUrl: string,
  ) {
    super(app);
  }

  async connect(): Promise<void> {
    try {
      const pub = new Redis(this.redisUrl, { maxRetriesPerRequest: null, lazyConnect: true });
      const sub = pub.duplicate();
      pub.on('error', (e) => this.logger.warn(`Redis pub error: ${e.message}`));
      sub.on('error', (e) => this.logger.warn(`Redis sub error: ${e.message}`));
      // ioredis retries a failed connect forever by default, which leaves this
      // promise pending and blocks bootstrap (the app never listens, so the
      // platform's port check fails the whole deploy). Cap the wait: if Redis
      // isn't reachable quickly, fall back to the in-memory adapter.
      await withTimeout(
        Promise.all([pub.connect(), sub.connect()]),
        CONNECT_TIMEOUT_MS,
        () => {
          pub.disconnect();
          sub.disconnect();
        },
      );
      this.clients = [pub, sub];
      this.adapterConstructor = createAdapter(pub, sub);
      this.logger.log('socket.io Redis adapter ready');
    } catch (err) {
      this.logger.warn(
        `Redis adapter unavailable, using in-memory adapter: ${(err as Error).message}`,
      );
    }
  }

  async close(): Promise<void> {
    await Promise.allSettled(this.clients.map((c) => c.quit()));
  }

  createIOServer(port: number, options?: ServerOptions): Server {
    const server: Server = super.createIOServer(port, options);
    if (this.adapterConstructor) server.adapter(this.adapterConstructor);
    return server;
  }
}
