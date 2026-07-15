import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

/** Get default tenant ID for operations without tenant context */
export async function getDefaultTenantId(): Promise<string> {
  const tenant = await prisma.tenant.findFirst({ select: { id: true } });
  return tenant?.id || '';
}
