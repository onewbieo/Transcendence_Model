import Fastify from "fastify";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";

import { healthRoutes } from "./routes/health";
import { userRoutes } from "./routes/users";
import { authRoutes } from "./routes/auth";

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
  
  await app.register(healthRoutes);
  await app.register(userRoutes);
  await app.register(authRoutes);
  
  app.get("/", async () => ({
  	ok: true,
  	routes: ["/health", "/users", "/auth/signup", "/auth/login", "/auth/me"],
  }));
  
  await app.listen({ host: "0.0.0.0", port: 3000 });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

