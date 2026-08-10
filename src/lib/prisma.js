import { PrismaClient } from '@prisma/client';

const prisma = globalThis.__diariaCertaPrisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalThis.__diariaCertaPrisma = prisma;
}

export default prisma;
