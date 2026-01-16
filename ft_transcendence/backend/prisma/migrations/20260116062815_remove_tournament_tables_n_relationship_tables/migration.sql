/*
  Warnings:

  - You are about to drop the column `bracket` on the `Match` table. All the data in the column will be lost.
  - You are about to drop the column `round` on the `Match` table. All the data in the column will be lost.
  - You are about to drop the column `slot` on the `Match` table. All the data in the column will be lost.
  - You are about to drop the column `tournamentId` on the `Match` table. All the data in the column will be lost.
  - You are about to drop the `Friendship` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Tournament` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TournamentParticipant` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Friendship" DROP CONSTRAINT "Friendship_friendId_fkey";

-- DropForeignKey
ALTER TABLE "Friendship" DROP CONSTRAINT "Friendship_userId_fkey";

-- DropForeignKey
ALTER TABLE "Match" DROP CONSTRAINT "Match_tournamentId_fkey";

-- DropForeignKey
ALTER TABLE "TournamentParticipant" DROP CONSTRAINT "TournamentParticipant_tournamentId_fkey";

-- DropForeignKey
ALTER TABLE "TournamentParticipant" DROP CONSTRAINT "TournamentParticipant_userId_fkey";

-- DropIndex
DROP INDEX "Match_tournamentId_idx";

-- AlterTable
ALTER TABLE "Match" DROP COLUMN "bracket",
DROP COLUMN "round",
DROP COLUMN "slot",
DROP COLUMN "tournamentId";

-- DropTable
DROP TABLE "Friendship";

-- DropTable
DROP TABLE "Tournament";

-- DropTable
DROP TABLE "TournamentParticipant";

-- DropEnum
DROP TYPE "Bracket";

-- DropEnum
DROP TYPE "TournamentStatus";
