import type { FastifyInstance } from "fastify";
import { env } from "@/lib/env";
import { loginRequestSchema } from "@xblog/contracts";

export async function registerAuthRoutes(app: FastifyInstance) {
  app.post("/v1/auth/login", async (request, reply) => {
    const payload = loginRequestSchema.parse(request.body);
    const user = await app.store.authenticateAdmin(payload.email, payload.password);

    if (!user) {
      return reply.code(401).send({ message: "Invalid credentials" });
    }

    const session = await app.store.createSession(user.id);

    reply.setCookie(env.sessionCookieName, session.sessionToken, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });

    return { user };
  });

  app.post("/v1/auth/logout", async (request, reply) => {
    const sessionToken = request.cookies[env.sessionCookieName];
    if (sessionToken) {
      await app.store.deleteSession(sessionToken);
    }

    reply.clearCookie(env.sessionCookieName, { path: "/" });
    return { ok: true };
  });

  app.get("/v1/auth/me", async (request, reply) => {
    const sessionToken = request.cookies[env.sessionCookieName];
    if (!sessionToken) {
      return reply.code(401).send({ message: "Unauthorized" });
    }

    const session = await app.store.getSession(sessionToken);
    if (!session) {
      return reply.code(401).send({ message: "Unauthorized" });
    }

    return { user: session.user };
  });
}
