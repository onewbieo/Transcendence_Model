import type { FastifyInstance } from "fastify";
import bcrypt from "bcrypt";
import { prisma } from "../prisma";

export async function userRoutes(app: FastifyInstance) {
  // GET /users (list all users)   
  app.get("/users", async () => {
  	return prisma.user.findMany({
  	  select: { id: true, email: true, name: true, createdAt: true },
  	});
  });
  
  // GET /users/:id (get one user)
  app.get("/users/:id", async (req, reply) => {
    const params = req.params as { id: string };
    const id = Number(params.id);
    
    if (!Number.isFinite(id)) {
      return reply.code(400).send({ error: "invalid id" });
    }
    
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, name: true, createdAt: true },
    });
    
    if (!user) {
      return reply.code(404).send({ error: "user not found" });
    }
    
    return user;
  });
    
  // POST /users (create user)
  app.post("/users", async (req, reply) => {
    const body = req.body as {
      email?: string;
      password?: string;
      name?: string;
    };
    
    const email = body.email?.trim().toLowerCase();
    const password = body.password;
    
    if (!email || !password) {
    	return reply.code(400).send({ error: "email and password are required"});
    }
    if (password.length < 8) {
    	return reply.code(400).send({ error: "password must be at least 8 characters" });
    }
    
    // prevent duplicates nicely (instead of Prisma crashing)
    const existing = await prisma.user.findUnique({ 
      where: { email },
    });
    
    if (existing) {
      return reply.code(409).send({
        error: "email already exists",
      });
    }
    
    const passwordHash = await bcrypt.hash(password, 10);
    
    const user = await prisma.user.create({
      data: { email, name: body.name ?? null, passwordHash },
      select: { id: true, email: true, name: true, createdAt: true},
      });
    
    return reply.code(201).send(user);
  });
  
  // PATCH /users/:id (update user fields, e.g. name)
  app.patch("/users/:id", async (req, reply) => {
    const params = req.params as { id: string };
    const id = Number(params.id);
    
    if (!Number.isFinite(id)) {
      return reply.code(400).send({ error: "invalid id" });
    }
    
    const body = req.body as {
      name?: string;
    };
    
    // only allow updating name for now
    const name = body.name?.trim();
    
    if (name !== undefined && name.length === 0) {
      return reply.code(400).send({ error: "name cannot be empty" });
    }
    
    try {
      const user = await prisma.user.update({
        where: { id },
        data: {
          // if name is undefined, Prisma ignores it (no change)
          name: name ?? undefined,
        },
        select: { id: true, email: true, name: true, createdAt: true },
      });
      
      return reply.send(user);
     }
     catch (err: any) {
       // Prisma throws if user not around
       if (err?.code === "P2025") {
         return reply.code(404).send({ error: "user not found" });
       }
       req.log.error(err);
       return reply.code(500).send({ error: "internal error" });
     }
  });
  
  // DELETE /users/:id (delete user)
  app.delete("/users/:id", async (req, reply) => {
    const params = req.params as { id: string };
    const id = Number(params.id);
    
    if (!Number.isFinite(id)) {
      return reply.code(400).send({ error: "invalid id" });
    }
    
    try {
      await prisma.user.delete({ where: { id} });
      return reply.code(204).send();
    }
    catch (err: any) {
      if (err?.code === "P2025") {
        return reply.code(404).send({ error: "user not found" });
      }
      req.log.error(err);
      return reply.code(500).send({ error: "internal error" });
    }
  });
}
