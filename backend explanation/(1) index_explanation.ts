import Fastify from "fastify"; // this takes from node modules from the Fastify folder //
import cors from "@fastify/cors"; // this takes from node modules from the cors folder //
import jwt from "@fastify/jwt"; // this takes from node modules from the jwt folder // 

import { healthRoutes } from "./routes/health"; // Health routes created //
import { userRoutes } from "./routes/users"; // User routes created // 
import { authRoutes } from "./routes/auth"; // authentication routes created //
import { matchRoutes } from "./routes/matches"; // matches routes created //

async function main() { // async is used here so that you can use the await function //
  const app = Fastify({ logger: true }); // this line creates the Http server //

  await app.register(cors, { origin: true }); // allows request from any origin // 

  // JWT must be registered before authRoutes uses app.jwt / req.jwtVerify()
  await app.register(jwt, { // jwt is a fastify plugin
  // related capabilities to JWT like 1)app, 2)request, 3)reply
    secret: process.env.JWT_SECRET ?? "dev-secret-change-me", // this line signs JWTs and verify JWTs later. 
  }); // when you register it, it does the following, it adds method to app, adds method to request
     // like req.jwtVerify(), app.jwt.sign()  
  
  app.decorate("authenticate", async (req: any, reply: any) => { // attach reusable guards can be used in other routes //
    try {
      await req.jwtVerify(); // if JWT is valid, req.user is set //
    }
    catch {
      return reply.code(401).send({ error: "unauthorized" }); // else request stops //
    }
  });
  
  app.decorate("authorizeAdmin", async (req: any, reply: any) => { // attach reusable guards can be used in other routes //
    try {
      await req.jwtVerify(); // Checks for valid token //
      if (req.user.role !== "ADMIN") { // if user role is not Admin, cannot access //
        return reply.code(403).send({ error: "forbidden" });
      }
    }
    catch {
      return reply.code(401).send({ error: "unauthorized" }); // else block //
    }
  });
  
  await app.register(healthRoutes); // receives app and calls the Http Methods, uses authenticate / authorizeAdmin when needed //
  await app.register(authRoutes);
  await app.register(userRoutes);
  await app.register(matchRoutes);
  
  app.get("/", async () => ({ // this is just to show them what the / at the end consists of //
  	ok: true,
  	routes: ["/health", "/auth/signup", "/auth/login", "/auth/me", "/users/me", "/users/:id", "/matches", "/matches/:id", "/leaderboard", "/admin/users", "/admin/users/:id",],
  }));
  
  await app.listen({ host: "0.0.0.0", port: 3000 }); // Binds server to all interfaces. Makes it reachable from Docker / VM / Browser // 
}

main().catch((err) => { // Error handling at startup //
  console.error(err);
  process.exit(1);
});

So the flow is like this. 
Fastify recives it.
JWT plugin is available.
If route has authenticate - JWT verified
If route has authorizeAdmin - Role Checked
Route logic runs.
Prisma talks to DB
Response is returned. 


