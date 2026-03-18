import { PrismaClient } from "@prisma/client";
import { seedPrismaFromBootstrap } from "../src/bootstrap/prisma-seed";

async function main() {
  if (!process.env.DATABASE_URL) {
    console.log("DATABASE_URL is not set; skipping Prisma static seed.");
    return;
  }

  const prisma = new PrismaClient();
  await seedPrismaFromBootstrap(prisma, { reset: true });

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
