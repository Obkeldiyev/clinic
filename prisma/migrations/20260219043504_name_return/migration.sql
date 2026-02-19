/*
  Warnings:

  - Made the column `third_name` on table `Patient` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Patient" ALTER COLUMN "third_name" SET NOT NULL;
