import type { FastifyInstance } from "fastify"; // calls the fastify app to make sure correct methods are used //
import { prisma } from "../prisma"; // database client //

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
    { preHandler: (app as any).authenticate }, // this will call await req.jwtVerify()
    						// need to be logged in to post a result // 
    						// if ok, sets req.user with token payload //
    async (req: any, reply) => {
      const body = req.body as {
        player1Id?: number;		// player1Id //
        player2Id?: number;		// player2Id //
        player1Score?: number;		// player1Score //
        player2Score?: number;		// player2Score //
        status?: "FINISHED" | "ABORTED";	// status //
        durationMs?: number;		// duration of game //
      };

      const player1Id = body.player1Id;		// extract fields from body //
      const player2Id = body.player2Id;
      const player1Score = body.player1Score;
      const player2Score = body.player2Score;
      const status = body.status ?? "FINISHED";	// if no status send, assume FINISHED //

      // Basic validation
      if (
        !Number.isFinite(player1Id) ||		// validate if player1ID is a number //
        !Number.isFinite(player2Id) ||		// validate if player2Id is a number //
        !Number.isFinite(player1Score) ||	// validate if player1Score is a number //
        !Number.isFinite(player2Score)		// validate if player2Score is a number //
      ) {
        return reply.code(400).send({
          error: "player1Id, player2Id, player1Score, player2Score are required numbers", // if not error out //
        });
      }

      if (player1Id === player2Id) { // if id numbers are the same, error out //
        return reply.code(400).send({ error: "player1Id and player2Id must be different" });
      }

      if (player1Score < 0 || player2Score < 0) { // no negative score, if not error out //
        return reply.code(400).send({ error: "scores cannot be negative" });
      }

      if (status !== "FINISHED" && status !== "ABORTED") { // if status is not FINISHED or ABORTED, error out //
        return reply.code(400).send({ error: "status must be FINISHED or ABORTED" });
      }

      // IMPORTANT security rule (simple MVP):
      // only allow the logged-in user to submit matches that include themselves
      const meId = Number(req.user?.sub); // extract logged-in user id from JWT (sub = subject)
      if (!Number.isFinite(meId)) { // check if its a number //
        return reply.code(401).send({ error: "unauthorized" });
      }

      if (meId !== player1Id && meId !== player2Id) { // if ID is not player1Id or player2Id, error out //
        return reply.code(403).send({ error: "you can only create matches that include yourself" });
      }

      // Decide winner
      let winnerId: number | null = null; // winnerId can be either a number or null //
      if (status === "FINISHED") { // if status === FINISHED //
        if (player1Score > player2Score)
        	winnerId = player1Id; // player 1 wins //
        else if (player2Score > player1Score)
        	winnerId = player2Id; // player 2 wins //
        else
        	winnerId = null; // draw //
      } 
      else {
      		winnerId = null; // aborted //
      }

      // Optional: ensure users exist (nice error instead of FK crash)
      const [p1, p2] = await Promise.all([ // ensure both players exist in the database before creating a match //
        prisma.user.findUnique({ where: { id: player1Id } }),
        prisma.user.findUnique({ where: { id: player2Id } }),
      ]);

      if (!p1 || !p2) { // if either one of the players does not exist in database, error out //
        return reply.code(400).send({ error: "player1Id or player2Id does not exist" });
      }

      const match = await prisma.match.create({
        data: { // data to be written into match table //
          status,
          player1Id,
          player2Id,
          player1Score,
          player2Score,
          winnerId,
          durationMs: Number.isFinite(body.durationMs) ? body.durationMs : null, // if durationMs is a valid finite number - store it. Otherwise store null //
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
        }, // controls what to send back //
      });

      return reply.code(201).send(match); // send based on select template //
    }					// 201 created is the HTTP STATUS for successful creation //
  );

  // GET /matches (protected) - my match history
  // supports ?cursor=<id>&take=20  (cursor pagination, newest-first)
  app.get( // showing matches in smaller chunks instead of all at once // 
    "/matches",
    { preHandler: (app as any).authenticate }, // this will call await req.jwtVerify()
    						// need to be logged in to get match history// 
    						// if ok, sets req.user with token payload //
    async (req: any, reply) => {
      const meId = Number(req.user?.sub); // extract logged-in user from (JWT) (sub = subject) 
      if (!Number.isFinite(meId)) { // check if its a number, JWT payload values may be strings //
        return reply.code(401).send({ error: "unauthorized" });
      }

      const q = req.query as { cursor?: string; take?: string }; // read query parameters //
      const takeRaw = q.take ? Number(q.take) : 20; // if client sent take, convert to number, else default to 20 //
      const take = Number.isFinite(takeRaw) ? Math.min(Math.max(takeRaw, 1), 50) : 20; // ensure take is a valid number Enforces min of 1, max 50. Take = 0 becomes 1, take = 999, becomes 50, take = abc becomes 20 //

      const cursorId = q.cursor ? Number(q.cursor) : undefined; // converts cursor to number if provided else undefinted //
      const useCursor = Number.isFinite(cursorId); // This boolean controls whether pagination is applied. // // dont understand this // 

      const matches = await prisma.match.findMany({
        where: {
          OR: [{ player1Id: meId }, { player2Id: meId }], // only return matches where i participated //
        },
        orderBy: { id: "desc" }, // Newest matches first // // Higher id = newer record //
        take: take + 1, // fetch one extra record //
        ...(useCursor // cursor pagination logic //
          ? {
              cursor: { id: cursorId as number }, // start from record with this id //
              skip: 1,				// skip that record itself (avoid duplicates) //
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
        }, // controls the fields to return to client //
      });

      const hasMore = matches.length > take; // determines if there's another page //
      const items = hasMore ? matches.slice(0, take) : matches; // if extra record exists , remove it // // only return exactly take items to client //

      return reply.send({
        items,
        nextCursor: hasMore ? items[items.length - 1]?.id ?? null : null, // blur //
      });
    }
  );

  // GET /matches/:id (protected) - match details (only if I participated)
  app.get( // get match details based on a specific match id but only if i participated // 
    "/matches/:id",
    { preHandler: (app as any).authenticate }, // // this will call await req.jwtVerify()
    						// need to be logged in to get match history // 
    						// if ok, sets req.user with token payload //
    async (req: any, reply) => {
      const meId = Number(req.user?.sub); // extract logged-in user from (JWT) (sub = subject) //
      if (!Number.isFinite(meId)) // check if id is a number //
      	return reply.code(401).send({ error: "unauthorized" });

      const params = req.params as { id: string }; // read id //
      const id = Number(params.id); // convert it to number //
      if (!Number.isFinite(id)) // checks if its a number //
      	return reply.code(400).send({ error: "invalid id" });

      const match = await prisma.match.findUnique({
        where: { id }, // find match by primary key id //
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
        }, // controls what you display back to client //
      });

      if (!match)
      	return reply.code(404).send({ error: "match not found" });

      const allowed = match.player1Id === meId || match.player2Id === meId;
      if (!allowed)
      	return reply.code(403).send({ error: "forbidden" });

      return reply.send(match); // return match details //
    }
  );

  // GET /leaderboard (public)
  app.get("/leaderboard", async () => {
    const rows = await prisma.match.groupBy({
      by: ["winnerId"], // group matches by winnerId //
      where: {
        status: "FINISHED", // include matches where its finished //
        winnerId: { not: null }, // have a winner //
      },
      _count: { winnerId: true }, // count how many matches winnerId appears in //
      orderBy: { _count: { winnerId: "desc" } }, // sort from highest wins to lowest //
      take: 10, // keep only the top 10 //
    });

    const winnerIds = rows
      .map((r) => r.winnerId) // turns data into arrays //
      .filter((x): x is number => typeof x === "number"); // tells typescript, after this filter, the are definitely numbers // // extract winner Ids from aggregated rows //

    const users = await prisma.user.findMany({
      where: { id: { in: winnerIds } }, // give me user records for these IDS //
      select: { id: true, email: true, name: true }, // data to return //
    });

    const userMap = new Map(users.map((u) => [u.id, u])); // quick lookup map //

    return rows.map((r) => ({ // combine the win counts + user details //
      user: r.winnerId ? userMap.get(r.winnerId) ?? { id: r.winnerId } : null, // extract the wins and user //
      wins: r._count.winnerId, // use winnerId count //
    }));
  });
}

