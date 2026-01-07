import type { FastifyInstance } from "fastify";
import { prisma } from "../prisma";
import { generateTournamentMatches } from "../services/tournamentService";

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
  
  // POST /tournaments/:id/start (protected) - start the tournament and generate matches
  app.post(
    "/tournaments/:id/start",
    { preHandler: (app as any).authenticate },
    async (req: any, reply) => {
      const tournamentId = Number(req.params.id);

      if (!Number.isFinite(tournamentId)) {
        return reply.code(400).send({ error: "invalid tournament id" });
      }

      try {
        // Fetch participants
        const participants = await prisma.tournamentParticipant.findMany({
          where: { tournamentId },
          include: { user: true },
        });
        
        if (participants.length < 2) {
          return reply.code(400).send({ error: "Not enough participants to generate matches" });
        }
        
        // set the tournament status to ONGOING
        await prisma.tournament.update({
          where: { id: tournamentId },
          data: { status: "ONGOING" },
        });
        
        // Now generate the matches
        await generateTournamentMatches(tournamentId);
        
        return reply.send({ message: "Tournament started, matches generated" });
      }
      catch (error) {
        console.error("Error starting tournament:", error);
        return reply.code(500).send({ error: error.message || "An error occurred while generating the tournament matches" });
      }
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
        
        // After joining, return the tournament with updated status
        const updatedTournament = await prisma.tournament.findUnique({
          where: { id: tournamentId },
          select: { id: true, name: true, status: true, createdAt: true },
        });
        
        return reply.send(updatedTournament);
      }
      catch (err:any) {
        // Unique constraint = already joined
        if (err?.code === "P2002") {
          return reply.code(409).send({ error: "already joined" });
         }
         throw err;
      }
    }
  );
  
  // GET /tournaments/:id - Get tournament by ID (make sure this is outside the tournamentRoutes function)
  app.get("/tournaments/:id", async (req, reply) => {
    const tournamentId = Number(req.params.id);

    if (!Number.isFinite(tournamentId)) {
      return reply.code(400).send({ error: "invalid tournament id" });
    }

    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      select: {
        id: true,
        name: true,
        status: true,  // Ensure the status is selected
        createdAt: true,
      },
    });
    // Ensure you return the tournament data to the client
    if (!tournament) {
      return reply.code(404).send({ error: "tournament not found" });
    }

    return reply.send(tournament); // return the tournament with the status
  });

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
            status: true,
            
            player1Score: true,
            player2Score: true,
            winnerId: true,
            
            player1: {
              select: {id: true, name: true },
            },
            player2: {
              select: { id: true, name: true },
            },
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
