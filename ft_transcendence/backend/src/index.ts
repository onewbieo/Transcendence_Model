import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import websocket from "@fastify/websocket";
import cookie from "@fastify/cookie";

import { healthRoutes } from "./routes/health";
import { userRoutes } from "./routes/users";
import { authRoutes } from "./routes/auth";
import { matchRoutes } from "./routes/matches";
import { tournamentRoutes } from "./routes/tournaments";
import { gameWs } from "./ws/game.ws";
import { googleOAuthRoutes } from "./routes/oauth.google";
import { twoFactorRoutes } from "./routes/2fa";


async function main() {
  const app = Fastify({
    logger: true,
    routerOptions: {
      ignoreTrailingSlash: true
    }
  });

  await app.register(cors, { origin: true });

  // JWT must be registered before authRoutes uses app.jwt / req.jwtVerify()
  await app.register(jwt, {
    secret: process.env.JWT_SECRET ?? "dev-secret-change-me",
  });
  
  await app.register(cookie, {
    secret: process.env.COOKIE_SECRET ?? "dev-cookie-secret-change-me",
    hook: "onRequest",
  });
  
  app.decorate("authenticate", async (req: any, reply: any) => {
    try {
      // Support WS: /ws/game?token=JWT
      const q = (req.query ?? {}) as Record<string, any>;
      const tokenFromQuery = typeof q.token === "string" ? q.token : undefined;
      
      if (tokenFromQuery) {
        req.user = app.jwt.verify(tokenFromQuery);
        return;
      }
      await req.jwtVerify();
    }
    catch (err) {
      req.log?.error?.(err, "authenticate failed");
      return reply.code(401).send({ error: "unauthorized" });
    }
  });
  
  app.decorate("authorizeAdmin", async (req: any, reply: any) => {
    try {
      const q = (req.query ?? {}) as Record<string, any>;
      const tokenFromQuery = typeof q.token === "string" ? q.token : undefined;
      
      if (tokenFromQuery) 
        await req.jwtVerify({ token: tokenFromQuery });
      else
        await req.jwtVerify();
        
      if ((req.user as any)?.role !== "ADMIN") {
        return reply.code(403).send({ error: "forbidden" });
      }
      
      return;
    }
    catch {
      return reply.code(401).send({ error: "unauthorized" });
    }
  });
  
  await app.register(twoFactorRoutes);
  await app.register(websocket);
  await app.register(gameWs);
  await app.register(healthRoutes);
  await app.register(authRoutes);
  await app.register(googleOAuthRoutes);
  await app.register(userRoutes);
  await app.register(matchRoutes);
  await app.register(tournamentRoutes);
  
  app.get("/", async () => ({
  	ok: true,
  	routes: ["/health", "/auth/signup", "/auth/login", "/auth/me", "/auth/2fa/setup", "/auth/2fa/enable", "/auth/2fa/disable", "/auth/2fa/verify", "/users/me", "/users/:id", "/matches", "/matches/:id", "/leaderboard", "/admin/users", "/admin/users/:id", "/tournaments", "/tournaments/id", "/tournaments/:id/join", "/tournaments/:id/bracket",],
  }));
  
  await app.listen({ host: "0.0.0.0", port: 3000 });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

