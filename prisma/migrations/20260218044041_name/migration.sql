/*
  Warnings:

  - You are about to drop the column `firts_name` on the `Doctor` table. All the data in the column will be lost.
  - Added the required column `first_name` to the `Doctor` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Doctor" DROP COLUMN "firts_name",
ADD COLUMN     "first_name" TEXT NOT NULL;
