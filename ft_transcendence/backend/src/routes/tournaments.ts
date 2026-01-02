import type { FastifyInstance } from "fastify";
import { prisma } from "../prisma";

export async function tournamentRoutes(app: FastifyInstance) {
  // POST /tournaments (protected)
  app.post(
    "/tournaments",
    { preHandler: (app as any).authenticate },
    async (req: any, reply) => {
      const body = req.body as { name?: string };
      
      const name = body.name?.trim();
      if (!name) {
        return reply.code(400).send({ error: "name is required" });
      }
      
      const tournament = await prisma.tournament.create({
        data: { name },
        select: {
          id: true,
          name: true,
          status: true,
          createdAt: true,
        }
      });
      
      return reply.code(201).send(tournament);
    }
  );
  
  // POST /tournaments/:id/join
  app.post(
    "/tournaments/:id/join",
    { preHandler: (app as any).authenticate },
    async (req: any, reply) => {
      const tournamentId = Number(req.params.id);
      const userId = Number(req.user.sub);
      
      if (!Number.isFinite(tournamentId)) {
        return reply.code(400).send({ error: "invalid tournament id" });
      }
      
      const tournament = await prisma.tournament.findUnique({
        where: { id:tournamentId },
        select: { id: true, status: true },
      });
      
      if (!tournament) {
        return reply.code(404).send({ error: "tournament not found" });
      }
      
      if (tournament.status !== "OPEN") {
        return reply.code(400).send({ error: "tournament is not open" });
      }
      
      try {
        await prisma.tournamentParticipant.create({
          data: {
            tournamentId,
            userId,
          },
        });
      }
      catch (err:any) {
        // Unique constraint = already joined
        if (err?.code === "P2002") {
          return reply.code(409).send({ error: "already joined" });
         }
         throw err;
      }
      
      return reply.send({ ok: true });
    }
  );

  // GET /tournaments/:id/bracket (public or protected - your choice)
  app.get("/tournaments/:id/bracket", async (req,reply) => {
    const tournamentId = Number(req.params.id);
    
    if (!Number.isFinite(tournamentId)) {
      return reply.code(400).send({ error: "invalid tournament id" });
    }
    
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      select: {
        id: true,
        name: true,
        status: true,
        createdAt: true,
        participants: {
          select: {
            user: {
              select: { id: true, name: true },
            },
          },
        },
        matches: {
          orderBy: { id: "asc" },
          select: {
            id: true,
            round: true,
            bracket: true,
            slot: true,
            player1Id: true,
            player2Id: true,
            player1Score: true,
            player2Score: true,
            winnerId: true,
            status: true,
          },
        },
      },
    });
    
    if (!tournament) {
      return reply.code(404).send({ error: "tournament not found" });
    }
    
    return reply.send(tournament);
  });
}
