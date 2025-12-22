import type { FastifyInstance } from "fastify";
import bcrypt from "bcrypt";
import { prisma } from "../prisma";

export async function userRoutes(app: FastifyInstance) {
  /*// GET /users (list all users)   // READ //
  app.get("/users", async () => {
  	return prisma.user.findMany({
  	  select: { id: true, email: true, name: true, createdAt: true },
  	});
  });
  
  // GET /users/:id (get one user) // READ //
  app.get("/users/:id", async (req, reply) => {
    const params = req.params as { id: string };
    const id = Number(params.id);
    
    if (!Number.isFinite(id)) {
      return reply.code(400).send({ error: "invalid id" });
    }
    
    const user = await prisma.user.findUnique({
      where: { id },
    });
    
    if (!user) {
      return reply.code(404).send({ error: "user not found" });
    }
    
    return user;
  });*/
  
  // GET /users/me (protected)
  app.get("/users/me", { preHandler: (app as any).authenticate }, async (req: any) => {
    const payload = req.user as { sub: number; email: string };
    
    const me = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, name: true, createdAt: true },
    });
    
    return { me };
  });
  
  // PATCH /users/me (protected) update my profile
  app.patch("/users/me", { preHandler: (app as any).authenticate }, async (req: any, reply) => {
    const payload = req.user as { sub: number; email: string };
    const body = req.body as { name?: string };
    
    const name = body.name?.trim();
    if (name !== undefined && name.length === 0) {
      return reply.code(400).send({ error: "name cannot be empty" });
    }
    
    const user = await prisma.user.update({
      where: { id: payload.sub },
      data: { name: name ?? undefined },
      select: { id: true, email: true, name: true, createdAt: true },
    });
    
    return reply.send(user);
  });
  
  // PATCH /users/me/password (protected)
  app.patch("/users/me/password", { preHandler: (app as any).authenticate }, async (req: any, reply) => {
    const payload = req.user as { sub: number };
    
    const body = req.body as {
      oldPassword?: string;
      newPassword?: string;
    };
    
    if (!body.oldPassword || !body.newPassword) {
      return reply.code(400).send({
        error: "oldPassword and newPassword are required",
      });
    }
    
    if (body.newPassword.length < 8) {
      return reply.code(400).send({
        error: "new password must be at least 8 characters",
      });
    }
    
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
    });
    
    if (!user) {
      return reply.code(404).send({ error: "user not found" });
    }
    
    const ok = await bcrypt.compare(body.oldPassword, user.passwordHash);
    if (!ok) {
      return reply.code(401).send({ error: "invalid old password" });
    }
    
    const newHash = await bcrypt.hash(body.newPassword, 10);
    
    await prisma.user.update({
      where: {id: payload.sub },
      data: { passwordHash: newHash },
    });
    
    return reply.send({ ok: true });
    }
  );
    
  /*// POST /users (create user) // CREATE //
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
  
  // PATCH /users/:id (update user fields, e.g. name) // UPDATE //
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
  
  // DELETE /users/:id (delete user) // DELETE //
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
  });*/
}
