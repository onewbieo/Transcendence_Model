import Fastify from "fastify";
import cors from "@fastify/cors";
import { prisma } from "./prisma";
import bcrypt from "bcrypt";

async function main() {
  const app = Fastify({ logger: true });

  await app.register(cors, { origin: true });

  app.get("/health", async () => ({ ok: true }));

  app.get("/users", async () => {
    return prisma.user.findMany();
  });

 app.post("/users", async (req, reply) => {
  const body = req.body as {
    email?: string;
    password?: string;
    name?: string;
  };

  const email = body.email?.trim();
  const password = body.password;

  // Validation
  if (!email || !password) {
    return reply.code(400).send({
      error: "email and password are required",
    });
  }

  if (password.length < 8) {
    return reply.code(400).send({
      error: "password must be at least 8 characters",
    });
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 10);

  // Create user
  const user = await prisma.user.create({
    data: {
      email,
      name: body.name ?? null,
      passwordHash, // 🔑 must exist in Prisma schema
    },
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
    },
  });

  return reply.code(201).send(user);
});
 
  await app.listen({ host: "0.0.0.0", port: 3000 });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
