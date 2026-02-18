/*
  Warnings:

  - Added the required column `doctor_id` to the `Doctor_awards` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Doctor_awards" ADD COLUMN     "doctor_id" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "Doctor_awards" ADD CONSTRAINT "Doctor_awards_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "Doctor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
