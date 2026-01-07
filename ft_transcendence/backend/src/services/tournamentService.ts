// src/services/tournamentService.ts
import { prisma } from "../prisma";
import { startGameLoop } from "../ws/game.ws";
import { broadcastState } from "../ws/game.ws";

// Function to generate the first round matches
export async function generateTournamentMatches(tournamentId: number) {
  try {
    const participants = await prisma.tournamentParticipant.findMany({
      where: { tournamentId },
      include: { user: true },
    });

    // Ensure there are at least 2 participants
    if (participants.length < 2) {
      return reply.code(400).send({ error: "Not enough participants to generate matches" });
    }

    // Randomize the participants (shuffling)
    participants.sort(() => Math.random() - 0.5); // Shuffle participants
  
    let round = 1;
    let slot = 1;

    // While more than 1 participant remains, create matches
    while (participants.length > 1) {
      const p1 = participants.pop();
      const p2 = participants.pop();

      if (p1 && p2) {
        const match = await prisma.match.create({
          data: {
            status: "ONGOING", // match is ongoing
            player1Id: p1.user.id,
            player2Id: p2.user.id,
            tournamentId: tournamentId,
            round: round, // First round (you can increment this for future rounds)
            slot: slot,
            bracket: 'WINNERS', // You can define this depending on your bracket system
          },
        });
        
        /*// Randomly decide the winner (just for now, replace with actual match result logic)
        participants.push(p1); // Assuming player1 wins here, you can update after match results*/
        
        // Trigger the game loop for this match (start the match)
        startGameLoop(match, tournamentId);
      
        slot++; // Increment the slot number for each match
      }
      
      if (participants.length % 2 !== 0) {
        // If there's an odd number of players, let the winner go to the next round
        round++; // Start a new round
        slot = 1; // Reset slot for the new round
      }
    }

    // If there's only one player left, the tournament is finished
    if (participants.length === 1) {
      await prisma.tournament.update({
        where: { id: tournamentId },
        data: { status: "FINISHED" },
      });
    }
  }
  catch (error) {
    // Handle errors by logging or sending a message
    console.error("Error generating tournament matches:", error);
    throw new Error(error.message || "Failed to generate tournament matches");
  }
}

