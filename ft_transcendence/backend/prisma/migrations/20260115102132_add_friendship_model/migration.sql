/*
  Warnings:

  - You are about to drop the column `updatedAt` on the `Friendship` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Friendship" DROP COLUMN "updatedAt",
ALTER COLUMN "status" SET DEFAULT 'pending';
