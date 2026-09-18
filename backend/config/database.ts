import { PrismaClient } from '@prisma/client';

let prisma: PrismaClient;

try {
  prisma = new PrismaClient();
} catch (error) {
  console.error('❌ Failed to initialize Prisma Client:', error);
  // Create a proxy that throws a descriptive error when accessed
  prisma = new Proxy({} as PrismaClient, {
    get: (_, prop) => {
      throw new Error(`Prisma Client is not initialized. Check your DATABASE_URL. Property accessed: ${String(prop)}`);
    }
  });
}

export default prisma;
