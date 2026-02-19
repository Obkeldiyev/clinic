-- CreateTable
CREATE TABLE "PatientHistory" (
    "id" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "second_name" TEXT NOT NULL,
    "third_name" TEXT,
    "phone_number" TEXT NOT NULL,
    "problem" TEXT NOT NULL,

    CONSTRAINT "PatientHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PatientHistory_phone_number_key" ON "PatientHistory"("phone_number");
