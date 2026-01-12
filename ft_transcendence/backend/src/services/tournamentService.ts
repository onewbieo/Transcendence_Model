// src/services/tournamentService.ts
import { prisma } from "../prisma";

function nextPow2(n: number) {
  let p = 1;
  while (p < n)
    p *= 2;
  return p;
}

export async function generateTournamentMatches(tournamentId: number) {
  const participants = await prisma.tournamentParticipant.findMany({
    where: { tournamentId },
    select: { userId: true },
  });

  if (participants.length < 2) {
    throw new Error("Not enough participants to generate matches");
  }
  
  // Refuse regenerate if already exists (safer)
  const existing = await prisma.match.count({ where: { tournamentId } });
  if (existing > 0)
    return;

  // shuffle userIds
  const ids = participants.map(p => p.userId).sort(() => Math.random() - 0.5);
  
  const S = nextPow2(ids.length);
  const rounds = Math.log2(S);
  
  // Seed array length S (null means BYE)
  const seed: Array<number | null> = Array.from({ length: S }, (_, i) => ids[i] ?? null);
  
  await prisma.$transaction(async (tx) => {
    // 1) Create All matches for ALL rounds as placeholders
    for (let round = 1; round <= rounds; round++) {
      // round1 : S/2, round2: S/4 ...
      const matchCount = S / (2 ** round);
      for (let slot = 1; slot <= matchCount; slot++) {
        await tx.match.create({
          data: {
            tournamentId,
            bracket: "WINNERS",
            round,
            slot,
            // IMPORTANT: start as NOT ongoing unless both players exist
            status: "PENDING",
            player1Id: null,
            player2Id: null,
          },
        });
      }
    }
    
    // 2) Fill round 1 players
    const round1Count = S / 2;
    for (let slot = 1; slot <= round1Count; slot++) {
      const p1 = seed[(slot - 1) * 2];
      const p2 = seed[(slot - 1) * 2 + 1];
      
      await tx.match.updateMany({
        where: { tournamentId, round: 1, slot, bracket: "WINNERS" },
        data: {
          player1Id: p1,
          player2Id: p2,
          status: p1 && p2 ? "ONGOING" : "PENDING",
        },
      });
      
      // 3) Handle BYE immediately (auto-advance)
      if (p1 && !p2)
        await advanceWinnerTx(tx, tournamentId, 1, slot, p1);
      
      if (!p1 && p2)
        await advanceWinnerTx(tx, tournamentId, 1, slot, p2);
    }
  });
}

async function advanceWinnerTx(
  tx: any,
  tournamentId: number,
  round: number,
  slot: number,
  winnerId: number
) {
  const nextRound = round + 1;
  
  // If this is already the final round, nothing to advance to.
  const nextExists = await tx.match.findFirst({
    where: { tournamentId, bracket: "WINNERS", round: nextRound },
    select: { id: true },
  });
  
  if (!nextExists)
    return;
  
  const nextSlot = Math.ceil(slot / 2);
  const isLeft = slot % 2 === 1;
  
  const nextMatch = await tx.match.findFirst({
    where: { tournamentId, bracket: "WINNERS", round: nextRound, slot: nextSlot },
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
  
  // Optional: if now both players exists, mark ready / ongoing
  const updated = await tx.match.findUnique({
    where: { id: nextMatch.id },
    select: { player1Id: true, player2Id : true },
  });
  
  if (updated?.player1Id && updated?.player2Id) {
    await tx.match.update({
      where: { id: nextMatch.id },
      data: { status: "ONGOING" },
    });
  }
}

