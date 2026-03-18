import { env } from "@/lib/env";
import { getPrismaClient } from "@/lib/prisma";
import { MemoryStore } from "@/repositories/memory-store";
import { PrismaStore } from "@/repositories/prisma-store";

export async function createStore() {
  if (env.storeDriver === "memory") {
    console.info("[xblog-api] Using MemoryStore because XBLOG_STORE_DRIVER=memory.");
    return MemoryStore.create();
  }

  if (!process.env.DATABASE_URL) {
    if (env.storeDriver === "prisma") {
      throw new Error("DATABASE_URL is required when XBLOG_STORE_DRIVER=prisma");
    }

    console.info("[xblog-api] Using MemoryStore because DATABASE_URL is not configured.");
    return MemoryStore.create();
  }

  try {
    const store = await PrismaStore.create(getPrismaClient());
    console.info("[xblog-api] Using PrismaStore with configured DATABASE_URL.");
    return store;
  } catch (error) {
    if (env.storeDriver === "prisma") {
      throw error;
    }

    console.warn("Falling back to memory store because Prisma initialization failed.", error);
    return MemoryStore.create();
  }
}
