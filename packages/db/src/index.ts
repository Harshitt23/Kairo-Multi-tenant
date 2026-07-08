import { PrismaClient } from '@prisma/client';

export * from '@prisma/client';

// Singleton in dev to survive Next.js / nodemon hot-reloads without leaking
// connections. In prod a single instance per process is created normally.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'warn', 'error']
        : ['warn', 'error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
