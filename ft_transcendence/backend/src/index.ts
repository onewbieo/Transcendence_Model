import Fastify from "fastify";
import cors from "@fastify/cors";

import { healthRoutes } from "./routes/health";
import { userRoutes } from "./routes/users";

async function main() {
  const app = Fastify({ logger: true });

  await app.register(cors, { origin: true });

  await app.register(healthRoutes);
  await app.register(userRoutes);
  
  app.get("/", async () => ({
  	ok: true,
  	routes: ["/health", "/users"],
  }));
  
  await app.listen({ host: "0.0.0.0", port: 3000 });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

