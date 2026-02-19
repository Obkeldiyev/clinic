-- CreateTable
CREATE TABLE "Service" (
    "id" SERIAL NOT NULL,
    "title_en" TEXT NOT NULL,
    "title_uz" TEXT NOT NULL,
    "title_ru" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "branch_id" INTEGER NOT NULL,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
