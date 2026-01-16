import type { FastifyInstance } from "fastify";
import bcrypt from "bcrypt";
import { prisma } from "../prisma";
import { createNotification } from "../services/notificationService";

import path from "path";
import fs from "fs";
import { pipeline } from "node:stream/promises";

export async function userRoutes(app: FastifyInstance) {
  // ME ROUTES FIRST
  // GET /users/me (protected)
  app.get(
    "/users/me",
    { preHandler: (app as any).authenticate },
    async (req: any) => {
    const payload = req.user as { sub: number; email: string };
    
    const me = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, name: true, role: true, createdAt: true, avatarUrl: true },
    });
    
    return { me };
  });
  
  app.post(
    "/users/me/avatar",
    { preHandler: (app as any).authenticate },
    async (req: any, reply) => {
      const payload = req.user as { sub: number };
      
      const data = await req.file();
      if (!data)
        return reply.code(400).send({ error: "file required" });
        
      // basic type check
      const allowed = ["image/png", "image/jpeg", "image/webp"];
      if (!allowed.includes(data.mimetype)) {
        return reply.code(400).send({ error: "only png/jpg/webp allowed" });
      }
      
      const ext =
        data.mimetype === "image/png" ? "png" :
        data.mimetype === "image/webp" ? "webp" : "jpg";
        
      const filename = `u${payload.sub}_${Date.now()}.${ext}`;
      const filepath = path.join(process.cwd(), "uploads", "avatars", filename);
      
      fs.mkdirSync(path.dirname(filepath), { recursive: true });
      await pipeline(data.file, fs.createWriteStream(filepath));
      
      const avatarUrl = `/uploads/avatars/${filename}`;
      
      const user = await prisma.user.update({
        where: { id: payload.sub },
        data: { avatarUrl },
        select: { id: true, email: true, name: true, role: true, createdAt: true, avatarUrl: true },
      });
      
      // Send notification after avatar update
      await createNotification(user.id, `Your avatar has been updated.`); 
      
      return reply.send({ me : user });
    }
  );
  
  // PATCH /users/me (protected) update my profile
  app.patch(
    "/users/me",
    { preHandler: (app as any).authenticate },
    async (req: any, reply) => {
    const payload = req.user as { sub: number; email: string };
    const body = req.body as { name?: string };
    
    const name = body.name?.trim();
    if (name !== undefined && name.length === 0) {
      return reply.code(400).send({ error: "name cannot be empty" });
    }
    
    const user = await prisma.user.update({
      where: { id: payload.sub },
      data: { name: name ?? undefined },
      select: { id: true, email: true, name: true, role: true, createdAt: true , avatarUrl: true },
    });
    
    await createNotification(user.id, `${user.name ?? user.email}, your profile has been updated.`);
    
    return reply.send(user);
  });
  
  // PATCH /users/me/password (protected)
  app.patch(
    "/users/me/password",
    { preHandler: (app as any).authenticate },
    async (req: any, reply) => {
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
  
  // GET /users/:id (protected) - view another user's public profile
  app.get(
    "/users/:id",
    { preHandler: (app as any).authenticate },
    async (req: any, reply) => {
      const params = req.params as { id: string };
      const id = Number(params.id);

      if (!Number.isFinite(id)) {
        return reply.code(400).send({ error: "invalid id" });
      }

      const user = await prisma.user.findUnique({
        where: { id },
        select: { id: true, name: true, createdAt: true, avatarUrl: true }, // keep it simple
      });

      if (!user) {
        return reply.code(404).send({ error: "user not found" });
      }

      return reply.send({ user });
    }
  );
  
  // ADMIN ROUTES after
  // GET /users (list all users)   // READ //
  app.get(
    "/admin/users",
    { preHandler: (app as any).authorizeAdmin },
    async () => {
  	return prisma.user.findMany({
  	  select: { id: true, email: true, name: true, role: true, createdAt: true, avatarUrl: true },
  	});
    }
  );
  
  // GET /users/:id (get one user) // READ //
  app.get(
    "/admin/users/:id",
    { preHandler: (app as any).authorizeAdmin },
    async (req, reply) => {
    const params = req.params as { id: string };
    const id = Number(params.id);
    
    if (!Number.isFinite(id)) {
      return reply.code(400).send({ error: "invalid id" });
    }
    
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, name: true, role: true, createdAt: true, avatarUrl: true },
    });
    
    if (!user) {
      return reply.code(404).send({ error: "user not found" });
    }
   
    return user;
  });
  
  // PATCH /users/:id (update user fields, e.g. name) // UPDATE //
  app.patch(
    "/admin/users/:id",
    { preHandler: (app as any).authorizeAdmin }, 
    async (req, reply) => {
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
        select: { id: true, email: true, name: true, role: true, createdAt: true, avatarUrl: true },
      });
      
      await createNotification(user.id, `Your account details have been updated by an admin.`);
      
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
  });*/
  
  // DELETE /admin/users/:id (delete user) // DELETE //
  app.delete(
    "/admin/users/:id",
    { preHandler: (app as any).authorizeAdmin }, 
    async (req, reply) => {
      const params = req.params as { id: string };
      const id = Number(params.id);
    
      if (!Number.isFinite(id)) {
        return reply.code(400).send({ error: "invalid id" });
      }
      
      try {
        const admin = req.user as { sub: number };
        const adminExists = await prisma.user.findUnique({
          where: { id: admin.sub },
        });
        
        if (!adminExists || adminExists.role !== "ADMIN") {
          return reply.code(403).send({ error: "Admin user not found or no longer valid." });
        }
                
        const userToDelete = await prisma.user.findUnique({
          where: { id },
        });
        
        if (!userToDelete) {
          return reply.code(404).send({ error: "User not found" });
        }
        
        if (userToDelete.role === "ADMIN") {
          return reply.code(403).send({ error: "Cannot delete another admin user" });
        }
        
        // Send notification about deletion
        await createNotification(admin.sub, `You have successfully deleted user ${userToDelete.email} (${userToDelete.name}).`);
         
        // Delete related notifications first 
        await prisma.notification.deleteMany({
          where: { userId: id },
        });
        
        // Delete the user
        await prisma.user.delete({
          where: { id }
        });
        
        return reply.code(204).send();
      }
      catch (err: any) {
        if (err?.code === "P2025") {
          return reply.code(404).send({ error: "user not found" });
        }
        req.log.error("Error during user deletion:", err);
        return reply.code(500).send({ error: "internal error" });
      }
    }
  );
}
