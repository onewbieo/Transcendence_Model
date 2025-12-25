import Fastify from "fastify";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import websocket from "@fastify/websocket";

import { healthRoutes } from "./routes/health";
import { userRoutes } from "./routes/users";
import { authRoutes } from "./routes/auth";
import { matchRoutes } from "./routes/matches";
import { gameWs } from "./ws/game.ws";

async function main() {
  const app = Fastify({ logger: true });

  await app.register(cors, { origin: true });

  // JWT must be registered before authRoutes uses app.jwt / req.jwtVerify()
  await app.register(jwt, {
    secret: process.env.JWT_SECRET ?? "dev-secret-change-me",
  });
  
  app.decorate("authenticate", async (req: any, reply: any) => {
    try {
      await req.jwtVerify();
    }
    catch {
      return reply.code(401).send({ error: "unauthorized" });
    }
  });
  
  app.decorate("authorizeAdmin", async (req: any, reply: any) => {
    try {
      await req.jwtVerify();
      if (req.user.role !== "ADMIN") {
        return reply.code(403).send({ error: "forbidden" });
      }
    }
    catch {
      return reply.code(401).send({ error: "unauthorized" });
    }
  });
  
  await app.register(websocket);
  await app.register(gameWs);
  await app.register(healthRoutes);
  await app.register(authRoutes);
  await app.register(userRoutes);
  await app.register(matchRoutes);
  
  app.get("/", async () => ({
  	ok: true,
  	routes: ["/health", "/auth/signup", "/auth/login", "/auth/me", "/users/me", "/users/:id", "/matches", "/matches/:id", "/leaderboard", "/admin/users", "/admin/users/:id",],
  }));
  
  await app.listen({ host: "0.0.0.0", port: 3000 });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

