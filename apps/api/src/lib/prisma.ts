import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as typeof globalThis & {
  xblogPrisma?: PrismaClient;
};

export function getPrismaClient() {
  if (!globalForPrisma.xblogPrisma) {
    globalForPrisma.xblogPrisma = new PrismaClient();
  }

  return globalForPrisma.xblogPrisma;
}
