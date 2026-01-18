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


