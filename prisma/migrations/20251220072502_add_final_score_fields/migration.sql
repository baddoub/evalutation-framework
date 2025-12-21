/*
  Warnings:

  - Added the required column `final_level` to the `final_scores` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "final_scores" ADD COLUMN     "calculated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "final_level" TEXT NOT NULL;
