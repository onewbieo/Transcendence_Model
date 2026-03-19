import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import websocket from "@fastify/websocket";
import cookie from "@fastify/cookie";
import swagger from "@fastify/swagger";
import swaggerUI from "@fastify/swagger-ui";

import fastifyStatic from "@fastify/static";
import multipart from "@fastify/multipart";
import path from "path";
import fs from "fs";

import { healthRoutes } from "./routes/health";
import { userRoutes } from "./routes/users";
import { authRoutes } from "./routes/auth";
import { matchRoutes } from "./routes/matches";
import { gameWs } from "./ws/game.ws";
import { googleOAuthRoutes } from "./routes/oauth.google";
import { twoFactorRoutes } from "./routes/2fa";
import { publicApiRoutes } from "./routes/publicApi";

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
  
  // uploads folder + static serve
  const uploadDir = path.join(process.cwd(), "uploads");
  const avatarDir = path.join(uploadDir, "avatars");
  fs.mkdirSync(avatarDir, { recursive: true });
  
  await app.register(fastifyStatic, {
    root: uploadDir,
    prefix: "/uploads/",
    decorateReply: false, // optional but avoids reply conflicts sometimes
  });

  await app.register(multipart, {
    limits: { fileSize: 2 * 1024 * 1024 },
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
  
  await app.register(swagger, {
    swagger: {
      info: {
        title: "ft_transcendence API",
        description: "Public API (API-key + rate limit) + core project endpoints",
        version: "1.0.0",
      },
      schemes: ["https", "http"],
      consumes: ["application/json"],
      produces: ["application/json"],
    },
  });
  
  await app.register(swaggerUI, {
    routePrefix: "/api/docs",
  });
  
  await app.register(websocket);
  await app.register(gameWs);
 
  await app.register(healthRoutes);
  await app.register(authRoutes);
  await app.register(googleOAuthRoutes);
  await app.register(twoFactorRoutes);
  await app.register(userRoutes);
  await app.register(matchRoutes);
  await app.register(publicApiRoutes);
  
  app.get("/", async () => ({
  	ok: true,
  	docs: "/api/docs",
  	routes: [
  	  "/health", 
  	  "/auth/signup", 
  	  "/auth/login", 
  	  "/auth/me", 
  	  "/auth/2fa/setup", 
  	  "/auth/2fa/enable", 
  	  "/auth/2fa/disable", 
  	  "/auth/2fa/verify", 
  	  "/users/me", 
  	  "/users/:id", 
  	  "/matches", 
  	  "/matches/:id", 
  	  "/leaderboard",
  	  "/notifications",
  	  "/admin/first-setup",
  	  "/admin/users", 
  	  "/admin/users/:id",
  	  "/public/items",
  	  "/public/items/:id",
  	  "/api/docs",
  	],
  }));
  
  await app.listen({ host: "0.0.0.0", port: 3000 });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
