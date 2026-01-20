// GET /users/me/friends - Get all friends
  app.get(
    "/users/me/friends",
    { preHandler: (app as any).authenticate },
    async (req, reply) => {
      const userId = req.user.id;

      // Get friends where status is "accepted"
      const friends = await prisma.friendship.findMany({
        where: {
          OR: [{ userId }, { friendId: userId }],
          status: "accepted",
        },
        select: {
          userId: true,
          friendId: true,
        },
      });

      // Fetch user details of friends
      const friendIds = friends.map((friend) =>
        friend.userId === userId ? friend.friendId : friend.userId
      );

      const friendDetails = await prisma.user.findMany({
        where: { id: { in: friendIds } },
        select: { id: true, name: true, avatarUrl: true },
      });

      return reply.send(friendDetails); // Send back the list of friends
    }
  );
  
  // GET /users/me/friend-requests - Get all friend requests
  app.get(
    "/users/me/friend-requests",
    { preHandler: (app as any).authenticate },
    async (req, reply) => {
      const userId = req.user.id;

      // Fetch incoming friend requests where status is "pending"
      const friendRequests = await prisma.friendship.findMany({
        where: {
          friendId: userId,
          status: "pending", // Only include pending requests
        },
        select: {
          userId: true,
          friendId: true,
          createdAt: true,
        },
      });

      const requestIds = friendRequests.map((request) => request.userId);

      // Fetch user details of incoming requests
      const requestDetails = await prisma.user.findMany({
        where: { id: { in: requestIds } },
        select: { id: true, name: true, avatarUrl: true },
      });

      return reply.send(requestDetails); // Send back the list of friend requests
    } 
  );
  
  // POST /users/me/friend-request - Send a friend request
  app.post(
    "/users/me/friend-request",
    { preHandler: (app as any).authenticate },
    async (req, reply) => {
      const userId = req.user.id; // Get the authenticated user's ID
      console.log("userId:", userId); // Debugging log
      const { friendId } = req.body; // Get the friend ID from the request body
      

      if (!friendId || userId === friendId) {
        return reply.code(400).send({ error: "You cannot add yourself as a friend" });
      }

      // Check if a friendship already exists (to avoid duplicate requests)
      const existingFriendship = await prisma.friendship.findFirst({
        where: {
          OR: [
            { userId: userId, friendId: friendId },
            { userId: friendId, friendId: userId },
          ],
        },
      });

      if (existingFriendship) {
        return reply.code(400).send({ error: "Friend request already exists or is accepted." });
      }

      try {
        await prisma.friendship.create({
          data: {
            userId,
            friendId,
            status: "pending", // Set initial status as pending
          },
        });

        return reply.send({ message: "Friend request sent!" });
      }
      catch (error) {
        req.log.error(error);
        return reply.code(500).send({ error: "Error sending friend request" });
      }
    }
  );
  
  // POST /users/me/accept-friend-request - Accept a friend request
  app.post(
    "/users/me/accept-friend-request",
    { preHandler: (app as any).authenticate },
    async (req, reply) => {
      const userId = req.user.id; // Get the authenticated user's ID
      const { friendId } = req.body; // Get the friend ID from the request body

      if (!friendId) {
        return reply.code(400).send({ error: "Friend ID is required" });
      }

      // Check if a pending friend request exists between the two users
      const existingFriendship = await prisma.friendship.findFirst({
        where: {
          OR: [
            { userId: userId, friendId: friendId, status: "pending" },
            { userId: friendId, friendId: userId, status: "pending" },
          ],
        },
      });

      if (!existingFriendship) {
        return reply.code(400).send({ error: "No pending friend request found" });
      }

      try {
        // Update the friendship status to "accepted"
        await prisma.friendship.updateMany({
          where: {
            userId,
            friendId,
            status: "pending",
          },
          data: { status: "accepted" },
        });

        return reply.send({ message: "Friend request accepted!" });
      }
      catch (error) {
        req.log.error(error);
        return reply.code(500).send({ error: "Error accepting friend request" });
      }
    }
  );
  
  
  
enum TournamentStatus {
  OPEN
  ONGOING
  FINISHED
}

enum Bracket {
  WINNERS
  LOSERS
}

tournaments   TournamentParticipant[]


// Friendship relationships
  sentFriendRequests      Friendship[]  @relation("SentFriendRequests")
  receivedFriendRequests  Friendship[]  @relation("ReceivedFriendRequests")
  
  
  // tournament linkage (optional)
  tournamentId  Int?
  tournament    Tournament?   @relation(fields: [tournamentId], references: [id], onDelete: SetNull)
  
  round         Int?
  bracket       Bracket?
  slot          Int? // bracket position
  
  @@index([tournamentId])
  
  
model Friendship {
  id            Int      @id @default(autoincrement()) // Primary key for friendship
  userId        Int      // ID of the user sending the friend request
  friendId      Int      // ID of the user receiving the friend request
  status        String   @default("pending") // status: "pending", "accepted", "rejected"
  createdAt     DateTime @default(now()) // Date of creation for the friendship
  
  user          User     @relation("SentFriendRequests", fields: [userId], references: [id])
  friend        User     @relation("ReceivedFriendRequests", fields: [friendId], references: [id])

  @@unique([userId, friendId]) // Ensure no duplicate friendships (user A and B)
  @@index([userId])
  @@index([friendId])
}
  
model Tournament {
  id              Int                 @id @default(autoincrement())
  createdAt       DateTime            @default(now())
  name            String
  status          TournamentStatus    @default(OPEN)
  
  participants    TournamentParticipant[]
  matches         Match[]
}

model TournamentParticipant {
  id              Int                 @id @default(autoincrement())
  tournamentId    Int
  userId          Int
  joinedAt        DateTime            @default(now())
  
  tournament      Tournament          @relation(fields: [tournamentId], references: [id], onDelete: Cascade)
  user            User                @relation(fields: [userId], references: [id], onDelete: Cascade) 
  
  @@unique([tournamentId, userId])
  @@index([tournamentId])
  @@index([userId])
}


import { tournamentRoutes } from "./routes/tournaments";
await app.register(tournamentRoutes);

"/tournaments", "/tournaments/id", "/tournaments/:id/join", "/tournaments/:id/bracket",


tournamentId?: number;
round?: number;
bracket?: "WINNERS" | "LOSERS";
slot?: number;


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


import { Bracket } from "@prisma/client";

| {
       type: "tournament:join";
       tournamentId: number;
       bracket: Bracket;
       round: number;
       slot: number;
    }
      
tournamentId?: number;
  round?: number;
  bracket?: Bracket;
  slot?: number;
  
const waitingByTournamentSlot = new Map<string, Set<WebSocket>>();

// tournament slot -> roomId (your in memory matchId UUID)
const roomByTournamentSlot = new Map<string, string>();

function slotKey(tournamentId: number, bracket: Bracket, round: number, slot: number) { // generate a sring of data for tournamentId:bracket:round:slot
  return `${tournamentId}:${bracket}:${round}:${slot}`;
}

// If this room belongs to a tournament slot, remove slot -> room mapping
  if (
    typeof room.tournamentId === "number" &&
    typeof room.round === "number" &&
    typeof room.slot === "number" &&
    room.bracket
  ) {
      roomByTournamentSlot.delete(slotKey(room.tournamentId, room.bracket, room.round, room.slot));
  }

async function tryAdvanceTournamentAfterWin(params: {
  tournamentId: number;
  bracket: Bracket;
  round: number;
  slot: number;
  winnerUserId: number;
}) {
  const { tournamentId, bracket, round, slot, winnerUserId } = params;

  // You said mapping is: nextSlot = ceil(slot/2)
  const nextRound = round + 1;
  const nextSlot = Math.ceil(slot / 2);

  // sibling slot: 1<->2, 3<->4, 5<->6...
  const siblingSlot = slot % 2 === 1 ? slot + 1 : slot - 1;

  // Find the sibling match (must be finished, with a winner)
  const sibling = await prisma.match.findFirst({
    where: {
      tournamentId,
      bracket,
      round,
      slot: siblingSlot,
      status: "FINISHED",
      winnerId: { not: null },
    },
    select: { winnerId: true },
  });

  // sibling not done yet -> cannot create next match
  if (!sibling?.winnerId) return;

  // Assign next match P1/P2 based on odd/even slot
  // odd slot -> P1, even slot -> P2
  const thisIsOdd = slot % 2 === 1;

  const p1Id = thisIsOdd ? winnerUserId : sibling.winnerId;
  const p2Id = thisIsOdd ? sibling.winnerId : winnerUserId;

  // Avoid duplicate next match creation (no unique constraint in schema)
  const existingNext = await prisma.match.findFirst({
    where: {
      tournamentId,
      bracket,
      round: nextRound,
      slot: nextSlot,
      status: "ONGOING",
    },
    select: { id: true },
  });

  if (existingNext)
    return;

  // Create next round match
  await prisma.match.create({
    data: {
      status: "ONGOING",
      tournamentId,
      bracket,
      round: nextRound,
      slot: nextSlot,
      player1Id: p1Id,
      player2Id: p2Id,
    },
  });

  // Optional: if tournament still OPEN, mark it ONGOING
  await prisma.tournament.updateMany({
    where: { id: tournamentId, status: "OPEN" },
    data: { status: "ONGOING" },
  });
}

// keep tournament coordinates (important for advancement queries)
        tournamentId: room.tournamentId ?? undefined,
        bracket: room.bracket ?? undefined,
        round: room.round ?? undefined,
        slot: room.slot ?? undefined,

// After the match ends, check and finish the tournament if needed
    if (room.tournamentId) {
      await checkAndFinishTournament(room.tournamentId);
    }
    
// Mark Current DB match as DRAW
  let saved: {
    tournamentId: number | null;
    round: number | null;
    bracket: Bracket | null;
    slot: number | null;
  } | null = null;
  
  select: { tournamentId: true, round: true, bracket: true, slot: true },
  

if (saved?.tournamentId) {
    // Tournament DRAW -> don't create a new match, just mark the match as ongoing
    try {
      // keep the same match ID and just update its status to ONGOING
      await prisma.match.update({
        where: { id : room.matchDbId },
        data: {
          status: "DRAW",
        },
      });

      // Reset room for rematch ( but do NOT create a new match )
      resetRoomForRematch(room);
    
      // Pausing the game to prevent it from starting immediately
      room.paused = true;
      room.pauseMessage = "DRAW - WAITING FOR RECONNECT";

      broadcastState(room);
      console.log("Tournament DRAW - rematch started in same room, waiting for reconnect");
      
      // After creating the rematch, check if the tournament is finished
      await tryFinishTournamentIfFinal(saved.tournamentId);
    }
    catch (e) {
      console.error("Failed to create tournament rematch", e);
      // if rematch creation fails, at least clean up to avoid zombie rooms
      cleanupMatch(matchId);
    }
  }
// If NOT tournament -> end normally
  else {
    await checkAndFinishTournament(saved.tournamentId);
  }


function removeFromAllTournamentSlotQueues(ws: WebSocket) {
  for (const [key, q] of waitingByTournamentSlot) {
    if (q.delete(ws) && q.size === 0) {
      waitingByTournamentSlot.delete(key);
    }
  }
}

function getTournamentSlotQueue(tournamentId: number, bracket: Bracket, round: number, slot: number) {
  const key = slotKey(tournamentId, bracket, round, slot);
  let q = waitingByTournamentSlot.get(key);
  if (!q) {
    q = new Set<WebSocket>();
    waitingByTournamentSlot.set(key, q);
  }
  return q;
}

// Function to check and finish the tournament if all matches are finished
async function tryFinishTournamentIfFinal(tournamentId: number) {
  // Check if there are any ongoing matches in the tournament
  const remainingMatches = await prisma.match.count({
    where: { tournamentId, status: { not: "FINISHED" } }, // Count ongoing or draw matches
  });

  // If no ongoing matches, mark the tournament as finished
  if (remainingMatches === 0) {
    await prisma.tournament.update({
      where: { id: tournamentId },
      data: { status: "FINISHED" },
    });
    console.log(`Tournament ${tournamentId} marked as finished.`);
  } else {
    console.log(`Tournament ${tournamentId} still has ongoing matches.`);
  }
}


// 1. Add checkAndFinishTournament function
async function checkAndFinishTournament(tournamentId: number) {
  // Check if there are any ongoing matches in the tournament
  const remainingMatches = await prisma.match.count({
    where: { tournamentId, status: { not: "FINISHED" } }, // Count ongoing or draw matches
  });

  // If no ongoing matches, mark the tournament as finished
  if (remainingMatches === 0) {
    await prisma.tournament.update({
      where: { id: tournamentId },
      data: { status: "FINISHED" },
    });
    console.log(`Tournament ${tournamentId} marked as finished.`);
  }
  else {
    console.log(`Tournament ${tournamentId} still has ongoing matches.`);
  }
}

case "tournament:join": {
          const tournamentId = Number(msg.tournamentId);
          const bracket = msg.bracket;
          const round = Number(msg.round);
          const slot = Number(msg.slot);
          
          if (!Number.isFinite(tournamentId) || !Number.isFinite(round) || !Number.isFinite(slot))
            return;
          if (!Number.isFinite(round) || round < 1)
            return;
          if (!Number.isInteger(slot) || slot < 1)
            return;
          
          const tournament = await prisma.tournament.findUnique({
            where: { id: tournamentId },
            select: { id: true, status: true },
          });
          
          if (!tournament) {
            send(socket, { type: "match:reconnect_denied", reason: "tournament not found" });
            return;
          }
          
          if (tournament.status !== "OPEN" && tournament.status !== "ONGOING") {
            send(socket, { type: "match:reconnect_denied", reason: "tournament not active" });
            return;
          }
          
          // join tournament queue for this slot
          const q = getTournamentSlotQueue(tournamentId, bracket, round, slot);
          waiting.delete(socket);
          
          for (const ws of q) if (ws.readyState !== WebSocket.OPEN)
            q.delete(ws);
          
          if (q.has(socket))
            return;
          q.add(socket);
          
          send(socket, { type: "queue:joined" });
          
          if (q.size < 2)
            return;
          
          const iter = q.values();
          const s1 = iter.next().value as WebSocket;
          const s2 = iter.next().value as WebSocket;
          
          if (s1.readyState !== WebSocket.OPEN || s2.readyState !== WebSocket.OPEN) {
            q.delete(s1);
            q.delete(s2);
            return;
          }
          
          q.delete(s1);
          q.delete(s2);
          
          const u1 = socketToUserId.get(s1);
          const u2 = socketToUserId.get(s2);
          
          if (!u1 || !u2) {
            send(s1, { type: "match:reconnect_denied", reason: "auth missing" });
            send(s2, { type: "match:reconnect_denied", reason: "auth missing" });
            return;
          }
          
          if (u1 === u2) {
            q.add(s1);
            send(s2, { type: "match:reconnect_denied", reason: "cannot match against yourself" });
            return;
          }
          
          const key = slotKey(tournamentId, bracket, round, slot);
          
          // ✅ 1) Reuse existing in-memory room if already created for this slot
          const existingRoomId = roomByTournamentSlot.get(key);
          if (existingRoomId) {
            const r = rooms.get(existingRoomId);
              if (r) {
                // attach by userId (stable)
                if (r.p1UserId === u1)
                  r.p1 = s1;
                else if (r.p2UserId === u1)
                  r.p2 = s1;
                
                if (r.p1UserId === u2)
                  r.p1 = s2;
                else if (r.p2UserId === u2)
                  r.p2 = s2;
                
                const roleFor = (uid: number): Role => (uid === r.p1UserId ? "P1" : "P2");
                const role1 = roleFor(u1);
                const role2 = roleFor(u2);
                
                socketToMatch.set(s1, { matchId: existingRoomId, role: role1 });
                socketToMatch.set(s2, { matchId: existingRoomId, role: role2 });
                
                send(s1, { type: "match:found", matchId: existingRoomId, youAre: role1 });
                send(s2, { type: "match:found", matchId: existingRoomId, youAre: role2 });
                
                r.userPaused = false;
                r.paused = true;
                r.pauseMessage = "READY";
                broadcastState(r);
                return;
            }
            else {
              roomByTournamentSlot.delete(key);
            }
          }
          
          // ✅ 2) Get the placeholder DB match created by generateTournamentMatches()
          const dbMatch = await prisma.match.findFirst({
            where: { tournamentId, bracket, round, slot },
            select: { id: true, status: true, player1Id: true, player2Id: true },
          });
          
          if (!dbMatch) {
            send(s1, { type: "match:reconnect_denied", reason: "match not generated yet" });
            send(s2, { type: "match:reconnect_denied", reason: "match not generated yet" });
            return;
          }
          
          if (dbMatch.status === "FINISHED") {
            send(s1, { type: "match:reconnect_denied", reason: "match already finished" });
            send(s2, { type: "match:reconnect_denied", reason: "match already finished" });
            return;
          }
          
          const a = dbMatch.player1Id;
          const b = dbMatch.player2Id;
          
          if (!a || !b) {
            send(s1, { type: "match:reconnect_denied", reason: "players not assigned yet" });
            send(s2, { type: "match:reconnect_denied", reason: "players not assigned yet" });
            return;
          }
          
          // ✅ Only these two users are allowed into this slot
          const allowed = (u1 === a && u2 === b) || (u1 === b && u2 === a);
          if (!allowed) {
            send(s1, { type: "match:reconnect_denied", reason: "slot assigned to other players" });
            send(s2, { type: "match:reconnect_denied", reason: "slot assigned to other players" });
            return;
          }
          
          // If the match status is DRAW, we don't create a new match. We simply resume the existing match.
          if (dbMatch.status === "DRAW") {
            // Mark this match as ONGOING
            await prisma.match.update({
              where: { id: dbMatch.id },
              data: { status: "ONGOING" },
            });
            
            const roleForDb = (uid: number): Role => (uid === a ? "P1" : "P2");
            const role1 = roleForDb(u1);
            const role2 = roleForDb(u2);
            
            const p1Socket = role1 === "P1" ? s1 : s2;
            const p2Socket = role1 === "P1" ? s2 : s1;
            
            const matchId = dbMatch.id;
            send(s1, { type: "match:found", matchId, youAre: role1 });
            send(s2, { type: "match:found", matchId, youAre: role2 });
            
            const startY = (HEIGHT - PADDLE_HEIGHT) / 2;
            
            const room: Room = {
              p1: p1Socket,
              p2: p2Socket,
              
              // Use DB match info
              p1UserId: a,
              p2UserId: b,
              
              tick: 0,
              p1Up: false,
              p1Down: false,
              p2Up: false,
              p2Down: false,
              
              p1Y: startY,
              p2Y: startY,
              
              ball: { x: WIDTH / 2, y: HEIGHT / 2, vx: BALL_SPEED, vy: BALL_SPEED * 0.7 },
              
              paused: false,
              pauseMessage: "",
              
              scoreP1: 0,
              scoreP2: 0,
              
              matchDbId: dbMatch.id,
              startedAtMs: Date.now(),
              
              tournamentId,
              bracket,
              round,
              slot,
            };
            
            rooms.set(matchId, room);
            roomByTournamentSlot.set(key, matchId);
            
            socketToMatch.set(p1Socket, { matchId, role: "P1" });
            socketToMatch.set(p2Socket, { matchId, role: "P2" });
            
            startGameLoop(room, matchId);
            return;
          }
          
          // mark this placeholder as ONGOING once both have connected
          if (dbMatch.status !== "ONGOING") {
            await prisma.match.update({
              where: { id: dbMatch.id },
              data: { status: "ONGOING" },
            });
          }
          
          // ✅ Roles must follow DB (player1Id is P1, player2Id is P2)
          const roleForDb = (uid: number): Role => (uid === a ? "P1" : "P2");
          const role1 = roleForDb(u1);
          const role2 = roleForDb(u2);
          
          // build room sockets according to role
          const p1Socket = role1 === "P1" ? s1 : s2;
          const p2Socket = role1 === "P1" ? s2 : s1;
          
          const matchId = crypto.randomUUID();
          send(s1, { type: "match:found", matchId, youAre: role1 });
          send(s2, { type: "match:found", matchId, youAre: role2 });
          
          const startY = (HEIGHT - PADDLE_HEIGHT) / 2;
          
          const room: Room = {
            p1: p1Socket,
            p2: p2Socket,
            
            // IMPORTANT: stable by DB
            p1UserId: a,
            p2UserId: b,
            
            tick: 0,
            p1Up: false,
            p1Down: false,
            p2Up: false,
            p2Down: false,
            
            p1Y: startY,
            p2Y: startY,
            
            ball: { x: WIDTH / 2, y: HEIGHT / 2, vx: BALL_SPEED, vy: BALL_SPEED * 0.7 },
            
            paused: false,
            pauseMessage: "",
            
            scoreP1: 0,
            scoreP2: 0,
            
            matchDbId: dbMatch.id,
            startedAtMs: Date.now(),
            
            tournamentId,
            bracket,
            round,
            slot,
          };
          
          rooms.set(matchId, room);
          roomByTournamentSlot.set(key, matchId);
          
          socketToMatch.set(p1Socket, { matchId, role: "P1" });
          socketToMatch.set(p2Socket, { matchId, role: "P2" });
          
          startGameLoop(room, matchId);
          return;
        }


removeFromAllTournamentSlotQueues(socket);

removeFromAllTournamentSlotQueues(ws);

function resetRoomForRematch(room: Room) {
  // stop any in-flight timers related to old state
  if (room.serveTimeout) {
    clearTimeout(room.serveTimeout);
    room.serveTimeout = undefined;
  }
  if (room.readyTimeout) {
    clearTimeout(room.readyTimeout);
    room.readyTimeout = undefined;
  }
  if (room.p1DisconnectTimer) {
    clearTimeout(room.p1DisconnectTimer);
    room.p1DisconnectTimer = undefined;
  }
  if (room.p2DisconnectTimer) {
    clearTimeout(room.p2DisconnectTimer);
    room.p2DisconnectTimer = undefined;
  }
  if (room.disconnectCountdownInterval) {
    clearInterval(room.disconnectCountdownInterval);
    room.disconnectCountdownInterval = undefined;
  }

  room.disconnectDeadlineMs = undefined;

  // reset core match state
  room.isEnding = false;
  room.tick = 0;

  room.p1Up = false;
  room.p1Down = false;
  room.p2Up = false;
  room.p2Down = false;

  room.scoreP1 = 0;
  room.scoreP2 = 0;

  room.p1Y = (HEIGHT - PADDLE_HEIGHT) / 2;
  room.p2Y = (HEIGHT - PADDLE_HEIGHT) / 2;

  room.userPaused = false;
  room.paused = true;
  room.pauseMessage = "REMATCH";

  // force ball to center + stopped (beginServe will re-serve)
  room.ball.x = WIDTH / 2;
  room.ball.y = HEIGHT / 2;
  room.ball.vx = 0;
  room.ball.vy = 0;

  room.pendingServeRemainingMs = undefined;
  room.serveInProgress = false;
  room.serveStartAtMs = undefined;
  room.serveDelayMs = undefined;

  room.startedAtMs = Date.now();
}
