// src/services/tournamentService.ts
import { prisma } from "../prisma";

export async function generateTournamentMatches(tournamentId: number) {
  const participants = await prisma.tournamentParticipant.findMany({
    where: { tournamentId },
    select: { userId: true },
  });

  if (participants.length < 2) {
    throw new Error("Not enough participants to generate matches");
  }

  // shuffle userIds
  const ids = participants.map(p => p.userId).sort(() => Math.random() - 0.5);

  // Optional: delete existing ROUND 1 matches if you want regeneration
  // (or better: refuse if already exists)
  const existing = await prisma.match.count({
    where: { tournamentId, round: 1 },
  });
  if (existing > 0)
    return; // don’t duplicate

  let slot = 1;
  for (let i = 0; i + 1 < ids.length; i += 2) {
    const p1Id = ids[i];
    const p2Id = ids[i + 1];

    await prisma.match.create({
      data: {
        status: "ONGOING",          // or "PENDING" if you support it
        tournamentId,
        bracket: "WINNERS",
        round: 1,
        slot,
        player1Id: p1Id,
        player2Id: p2Id,
      },
    });

    slot++;
  }

  // If odd number: one player gets a BYE.
  // For now: ignore or auto-advance later; don’t start games here.
}
