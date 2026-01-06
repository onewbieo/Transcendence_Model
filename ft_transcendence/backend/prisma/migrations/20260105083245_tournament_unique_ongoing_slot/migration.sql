-- This is an empty migration.
CREATE UNIQUE INDEX IF NOT EXISTS "Match_tournament_slot_ongoing_unique"
ON "Match" ("tournamentId", "bracket", "round", "slot")
WHERE "status" = 'ONGOING' AND "tournamentId" IS NOT NULL;

