import { PrismaClient } from '@prisma/client';

// PrismaClient jest dołączany do globalnego obiektu w środowisku rozwojowym, aby zapobiec
// tworzeniu zbyt wielu instancji podczas hot-reloadingu.
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
