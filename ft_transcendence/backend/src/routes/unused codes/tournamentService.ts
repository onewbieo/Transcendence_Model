// src/services/tournamentService.ts
import { prisma } from "../prisma";

// predefined valid tournament participant sizes (2, 4)
const validSizes = [2, 4];

function getValidSize(n: number) {
  // Find the closest valid tournament size greater than or equal to 'n'
  for (const size of validSizes) {
    if (size >= n) return size;
  }
  return validSizes[validSizes.length - 1];
}

export async function generateTournamentMatches(tournamentId: number) {
  const participants = await prisma.tournamentParticipant.findMany({
    where: { tournamentId },
    select: { userId: true },
  });

  let participantCount = participants.length;

  // Ensure the participant count matches a valid size (2 or 4)
  participantCount = getValidSize(participantCount);

  if (participantCount !== 2 && participantCount !== 4) {
    throw new Error("Tournament must have either 2 or 4 participants");
  }

  // Refuse regenerate if matches already exist (safer)
  const existing = await prisma.match.count({ where: { tournamentId } });
  if (existing > 0)
    return;

  // shuffle userIds to randomize the matchups
  const ids = participants.map(p => p.userId).sort(() => Math.random() - 0.5);

  const S = participantCount;
  const rounds = Math.log2(S);  // For 2 players: 1 round, for 4 players: 2 rounds

  // Seed array length S
  const seed: Array<number | null> = Array.from({ length: S }, (_, i) => ids[i]);

  await prisma.$transaction(async (tx) => {
    // 1) Create All matches for ALL rounds as placeholders
    for (let round = 1; round <= rounds; round++) {
      const matchCount = S / (2 ** round); // Calculate the number of matches in this round
      for (let slot = 1; slot <= matchCount; slot++) {
        await tx.match.create({
          data: {
            tournamentId,
            bracket: "WINNERS",
            round,
            slot,
            status: "PENDING", // Matches start as pending, will be updated later
            player1Id: null,
            player2Id: null,
          },
        });
      }
    }

    // 2) Fill round 1 players (for 2 or 4 players)
    const round1Count = S / 2;
    for (let slot = 1; slot <= round1Count; slot++) {
      const p1 = seed[(slot - 1) * 2];
      const p2 = seed[(slot - 1) * 2 + 1];

      await tx.match.updateMany({
        where: { tournamentId, round: 1, slot, bracket: "WINNERS" },
        data: {
          player1Id: p1,
          player2Id: p2,
          status: "PENDING", // All players play, no BYEs
        },
      });
    }
  });
}

// This function is used to advance the winner to the next round
async function advanceWinnerTx(
  tx: any,
  tournamentId: number,
  round: number,
  slot: number,
  winnerId: number
) {
  const nextRound = round + 1;
  
  const nextSlot = Math.ceil(slot / 2);
  const isLeft = slot % 2 === 1;

  // If this is already the final round, nothing to advance to.
  const nextMatch = await tx.match.findFirst({
    where: { tournamentId, bracket: "WINNERS", round: nextRound },
    select: { id: true, player1Id: true, player2Id: true },
  });

  if (!nextMatch)
    return;

  const data: any = {};
  if (isLeft)
    data.player1Id = winnerId;
  else
    data.player2Id = winnerId;

  await tx.match.update({
    where: { id: nextMatch.id },
    data,
  });

  // Optional: if now both players exist, mark ready / ongoing
  const updated = await tx.match.findUnique({
    where: { id: nextMatch.id },
    select: { player1Id: true, player2Id: true },
  });

  if (updated?.player1Id && updated?.player2Id) {
    await tx.match.update({
      where: { id: nextMatch.id },
      data: { status: "ONGOING" },
    });
  }
}

