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

      if (player1Id === player2Id) {
        return reply.code(400).send({ error: "player1Id and player2Id must be different" });
      }

      if (player1Score < 0 || player2Score < 0) {
        return reply.code(400).send({ error: "scores cannot be negative" });
      }

      if (status !== "FINISHED" && status !== "DRAW") {
        return reply.code(400).send({ error: "status must be FINISHED or DRAW" });
      }

      // IMPORTANT security rule (simple MVP):
      // only allow the logged-in user to submit matches that include themselves
      const meId = Number(req.user?.sub);
      if (!Number.isFinite(meId)) {
        return reply.code(401).send({ error: "unauthorized" });
      }

      if (meId !== player1Id && meId !== player2Id) {
        return reply.code(403).send({ error: "you can only create matches that include yourself" });
      }

      // Decide winner (project semantics)
      // -FINISHED: must have a winnerId (disconnect win OR score win)
      // -DRAW: winnerId must be null
      let winnerId: number | null = null;
      
      if (status === "DRAW") {
        // draw can be at ANY score if both disconnected
        winnerId = null;
        
        // optional strictness: if client sends winnerId for DRAW -> reject
        if (body.winnerId !== undefined && body.winnerId !== null) {
          return reply.code(400).send({ error: "DRAW must have winnerId=null" });
        }
      }
      else {
        // FINISHED: winner must be explicit (do NOT infer from score)
        const w = body.winnerId;
        
        if (!Number.isFinite(w)) {
          return reply.code(400).send({ error: "FINISHED requires winnerId" });
        }
        
        if (w !== player1Id && w !== player2Id) {
          return reply.code(400).send({ error: "winnerId must be player1Id or player2Id" });
        }
        
        winnerId = w as number;
      }

      // Optional: ensure users exist (nice error instead of FK crash)
      const [p1, p2] = await Promise.all([
        prisma.user.findUnique({ where: { id: player1Id } }),
        prisma.user.findUnique({ where: { id: player2Id } }),
      ]);

      if (!p1 || !p2) {
        return reply.code(400).send({ error: "player1Id or player2Id does not exist" });
      }

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
      if (!Number.isFinite(meId)) return reply.code(401).send({ error: "unauthorized" });

      const params = req.params as { id: string };
      const id = Number(params.id);
      if (!Number.isFinite(id)) return reply.code(400).send({ error: "invalid id" });

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

      if (!match) return reply.code(404).send({ error: "match not found" });

      const allowed = match.player1Id === meId || match.player2Id === meId;
      if (!allowed) return reply.code(403).send({ error: "forbidden" });

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

