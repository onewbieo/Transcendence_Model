import type { FastifyInstance } from "fastify";
import { prisma } from "../prisma";

/**
 * Assumes your Prisma model:
 * Match {
 *   id, createdAt, status, player1Id, player2Id, player1Score, player2Score, winnerId?, durationMs?
 * }
 */
export async function matchRoutes(app: FastifyInstance) {
  // POST /matches (protected) - create a match result
  app.post(
    "/matches",
    { preHandler: (app as any).authenticate },
    async (req: any, reply) => {
      const body = req.body as {
        player1Id?: number;
        player2Id?: number;
        player1Score?: number;
        player2Score?: number;
        status?: "FINISHED" | "DRAW";
        winnerId?: number | null;
        durationMs?: number;
        tournamentId?: number;
        round?: number;
        bracket?: "WINNERS" | "LOSERS";
        slot?: number;
      };
      
      const player1Id = body.player1Id;
      const player2Id = body.player2Id;
      const player1Score = body.player1Score;
      const player2Score = body.player2Score;
      const status = body.status ?? "FINISHED";
      
      // Basic validation
      if (
        !Number.isFinite(player1Id) ||
        !Number.isFinite(player2Id) ||
        !Number.isFinite(player1Score) ||
        !Number.isFinite(player2Score)
      ) {
        return reply.code(400).send({
          error: "player1Id, player2Id, player1Score, player2Score are required numbers",
        });
      }
      
      // Tournament-aware behavior
      const tournamentId = body.tournamentId;
      const round = body.round;
      const bracket = body.bracket;
      const slot = body.slot;
      
      const isTournamentMatch =
        Number.isFinite(tournamentId) &&
        Number.isFinite(round) &&
        (bracket === "WINNERS" || bracket === "LOSERS") &&
        Number.isFinite(slot);
      
      if (isTournamentMatch) {
        // Find the latest ONGOING attempt for that bracket slot
        const current = await prisma.match.findFirst({
          where: {
            tournamentId: tournamentId as number,
            round: round as number,
            bracket: bracket as any,
            slot: slot as number,
            status: "ONGOING",
          },
          orderBy: { id: "desc" },
        });
        
        if (!current) {
          return reply.code(404).send({
            error: "no ONGOING tournament match found for this bracket slot",
          });
        }
      
        // Safety: ensure submitted players match the current match players
        const okPlayers = 
          (current.player1Id === player1Id && current.player2Id === player2Id) ||
          (current.player1Id === player2Id && current.player2Id === player1Id);
        
        if (!okPlayers) {
          return reply.code(400).send({ error: "players do not match the current tournament match" });
        }

        // update current attempt with the result
        const updated = await prisma.match.update({
          where: { id: current.id },
          data: {
            status,
            player1Score,
            player2Score,
            winnerId,
            durationMs: Number.isFinite(body.durationMs) ? body.durationMs : null,
          },
          select: {
            id: true,
            createdAt: true,
            status: true,
            player1Id: true,
            player2Id: true,
            player1Score: true,
            player2Score: true,
            winnerId: true,
            durationMs: true,
            tournamentId: true,
            round: true,
            bracket: true,
            slot: true,
          },
        });
      
        if (status === "DRAW") {
          const rematch = await prisma.match.create({
            data: {
              status: "ONGOING",
              player1Id: current.player1Id,
              player2Id: current.player2Id,
              player1Score: 0,
              player2Score: 0,
              winnerId: null,
              durationMs: null,
              tournamentId: tournamentId as number,
              round: round as number,
              bracket: bracket as any,
              slot: slot as number,
            },
            select: {
              id: true,
              status: true,
              tournamentId: true,
              round: true,
              bracket: true,
              slot: true,
            },
          });
        
          return reply.code(200).send({
            ok: true,
            result: updated,
            rematch,
            message: "DRAW saved; rematch created",
          });
        }
      
        return reply.code(200).send({
          ok: true,
          result: updated,
          message: "Tournament match result saved",
        });
      }
      
      // Handle non-tournament match creation (regular match creation here)
      const winnerId = status === "DRAW" ? null : body.winnerId;
      const match = await prisma.match.create({
        data: {
          status,
          player1Id,
          player2Id,
          player1Score,
          player2Score,
          winnerId,
          durationMs: Number.isFinite(body.durationMs) ? body.durationMs : null,
        },
        select: {
          id: true,
          createdAt: true,
          status: true,
          player1Id: true,
          player2Id: true,
          player1Score: true,
          player2Score: true,
          winnerId: true,
          durationMs: true,
        },
      });
      
      return reply.code(201).send(match);
    }
  );

  // GET /matches (protected) - my match history
  // supports ?cursor=<id>&take=20  (cursor pagination, newest-first)
  app.get(
    "/matches",
    { preHandler: (app as any).authenticate },
    async (req: any, reply) => {
      const meId = Number(req.user?.sub);
      if (!Number.isFinite(meId)) {
        return reply.code(401).send({ error: "unauthorized" });
      }

      const q = req.query as { cursor?: string; take?: string };
      const takeRaw = q.take ? Number(q.take) : 20;
      const take = Number.isFinite(takeRaw) ? Math.min(Math.max(takeRaw, 1), 50) : 20;

      const cursorId = q.cursor ? Number(q.cursor) : undefined;
      const useCursor = Number.isFinite(cursorId);

      const matches = await prisma.match.findMany({
        where: {
          OR: [{ player1Id: meId }, { player2Id: meId }],
        },
        orderBy: { id: "desc" },
        take: take + 1,
        ...(useCursor
          ? {
              cursor: { id: cursorId as number },
              skip: 1,
            }
          : {}),
        select: {
          id: true,
          createdAt: true,
          status: true,
          player1Id: true,
          player2Id: true,
          player1Score: true,
          player2Score: true,
          winnerId: true,
          durationMs: true,
        },
      });

      const hasMore = matches.length > take;
      const items = hasMore ? matches.slice(0, take) : matches;

      return reply.send({
        items,
        nextCursor: hasMore ? items[items.length - 1]?.id ?? null : null,
      });
    }
  );

  // GET /matches/:id (protected) - match details (only if I participated)
  app.get(
    "/matches/:id",
    { preHandler: (app as any).authenticate },
    async (req: any, reply) => {
      const meId = Number(req.user?.sub);
      if (!Number.isFinite(meId))
        return reply.code(401).send({ error: "unauthorized" });

      const params = req.params as { id: string };
      const id = Number(params.id);
      if (!Number.isFinite(id))
        return reply.code(400).send({ error: "invalid id" });

      const match = await prisma.match.findUnique({
        where: { id },
        select: {
          id: true,
          createdAt: true,
          status: true,
          player1Id: true,
          player2Id: true,
          player1Score: true,
          player2Score: true,
          winnerId: true,
          durationMs: true,
        },
      });

      if (!match)
        return reply.code(404).send({ error: "match not found" });

      const allowed = match.player1Id === meId || match.player2Id === meId;
      if (!allowed)
        return reply.code(403).send({ error: "forbidden" });

      return reply.send(match);
    }
  );

  // GET /leaderboard (public)
  app.get("/leaderboard", async () => {
    const rows = await prisma.match.groupBy({
      by: ["winnerId"],
      where: {
        status: "FINISHED",
        winnerId: { not: null },
      },
      _count: { winnerId: true },          // <-- count non-null winnerId
      orderBy: { _count: { winnerId: "desc" } }, // <-- order by that count
      take: 10,
    });

    const winnerIds = rows
      .map((r) => r.winnerId)
      .filter((x): x is number => typeof x === "number");

    const users = await prisma.user.findMany({
      where: { id: { in: winnerIds } },
      select: { id: true, email: true, name: true },
    });

    const userMap = new Map(users.map((u) => [u.id, u]));

    return rows.map((r) => ({
      user: r.winnerId ? userMap.get(r.winnerId) ?? { id: r.winnerId } : null,
      wins: r._count.winnerId, // <-- use winnerId count
    }));
  });
}

