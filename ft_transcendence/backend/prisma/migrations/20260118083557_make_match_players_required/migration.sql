/*
  Warnings:

  - Made the column `player1Id` on table `Match` required. This step will fail if there are existing NULL values in that column.
  - Made the column `player2Id` on table `Match` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Match" ALTER COLUMN "player1Id" SET NOT NULL,
ALTER COLUMN "player2Id" SET NOT NULL;
