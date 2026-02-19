-- CreateTable
CREATE TABLE "Contact" (
    "id" SERIAL NOT NULL,
    "type" TEXT NOT NULL,
    "contact" TEXT NOT NULL,

    CONSTRAINT "Contact_pkey" PRIMARY KEY ("id")
);
