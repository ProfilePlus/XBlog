import type { FastifyReply, FastifyRequest } from "fastify";
import { env } from "@/lib/env";
import type { Store } from "@/repositories/store";

declare module "fastify" {
  interface FastifyInstance {
    store: Store;
  }

  interface FastifyRequest {
    adminUser?: {
      id: string;
      email: string;
      displayName: string;
    };
  }
}

export async function requireAdmin(request: FastifyRequest, reply: FastifyReply) {
  const store = request.server.store as Store;
  const sessionToken = request.cookies[env.sessionCookieName];

  if (!sessionToken) {
    return reply.code(401).send({ message: "Unauthorized" });
  }

  const session = await store.getSession(sessionToken);
  if (!session) {
    return reply.code(401).send({ message: "Unauthorized" });
  }

  request.adminUser = session.user;
}

export async function requireApiToken(request: FastifyRequest, reply: FastifyReply) {
  const store = request.server.store as Store;
  const token = request.headers.authorization?.replace(/^Bearer\s+/i, "") ?? request.headers["x-api-token"];

  if (!token || Array.isArray(token)) {
    return reply.code(401).send({ message: "Missing API token" });
  }

  const found = await store.findToken(token);
  if (!found) {
    return reply.code(401).send({ message: "Invalid API token" });
  }
}
