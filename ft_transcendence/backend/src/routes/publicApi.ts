import type { FastifyInstance } from "fastify";
import rateLimit from "@fastify/rate-limit";
import { prisma } from "../prisma";

function requireApiKey() {
  return async(req: any, reply: any) => {
    const key = req.headers["x-api-key"];
    const expected = process.env.PUBLIC_API_KEY;
    
    if (!expected) {
      req.log.error("PUBLIC_API_KEY missing in env");
      return reply.code(500).send({ error: "server misconfigured" });
    }
    
    if (!key || key !== expected) {
      return reply.code(401).send({ error: "invalid api key" });
    }
  };
}

export async function publicApiRoutes(app: FastifyInstance) {
  // rate limit only for this group
  app.register(async function (group) {
    // 1) register rateLimit FIRST in this scope
    await group.register(rateLimit, {
      max: 60,
      timeWindow: "1 minute",
      // IMPORTANT: behind nginx, use x-forwarded-for
      keyGenerator: (req: any) =>
        (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.ip,
    });
    
    // 2) then API key hook
    group.addHook("preHandler", requireApiKey());
    
    // GET /public/items
    group.get("/public/items", async () => {
      const items = await prisma.publicItem.findMany({
        orderBy: { id: "desc" },
        take: 50,
      });
      return { items };
    });
    
    // POST /public/items
    group.post("/public/items", async (req: any, reply: any) => {
      const body = req.body as { title?: string; content?: string };
      const title = body.title?.trim();
      if (!title)
        return reply.code(400).send({ error: "title required" });
        
      const item = await prisma.publicItem.create({
        data: { title, content: body.content ?? null },
      });
      return reply.code(201).send({ item });
    });
         
    // GET /public/items/:id
    group.get("/public/items/:id", async (req: any, reply: any) => {
      const id = Number(req.params.id);
      if (!Number.isFinite(id))
        return reply.code(400).send({ error: "invalid id" });
        
      const item = await prisma.publicItem.findUnique({ where: { id } });
      if (!item)
        return reply.code(404).send({ error: "not found" });
        
      return { item };
    });
    
    // PUT /public/items/:id
    group.put("/public/items/:id", async (req: any, reply: any) => {
      const id = Number(req.params.id);
      if (!Number.isFinite(id))
        return reply.code(400).send({ error: "invalid id" });
        
      const body = req.body as { title?: string; content?: string };
      const title = body.title?.trim();
      if (!title)
        return reply.code(400).send({ error: "title required" });
        
      try {
        const item = await prisma.publicItem.update({
          where: { id },
          data: { title, content: body.content ?? null },
        });
        return { item };
      }
      catch (err: any) {
        if (err?.code === "P2025")
          return reply.code(404).send({ error: "not found" });
        throw err;
      }
    });
         
    // DELETE /public/items/:id
    group.delete("/public/items/:id", async (req: any, reply: any) => {
      const id = Number(req.params.id);
      if (!Number.isFinite(id))
        return reply.code(400).send({ error: "invalid id" });
      
      try {
        await prisma.publicItem.delete({ where: { id } });
        return reply.code(204).send();
      }
      catch (err: any) {
        if (err?.code === "P2025")
          return reply.code(404).send({ error: "not found" });
        throw err;
      }
    });
  });
}
