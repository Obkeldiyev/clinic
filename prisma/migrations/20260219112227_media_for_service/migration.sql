-- CreateTable
CREATE TABLE "Service_media" (
    "id" SERIAL NOT NULL,
    "url" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "service_id" INTEGER NOT NULL,

    CONSTRAINT "Service_media_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Service_media_url_key" ON "Service_media"("url");

-- AddForeignKey
ALTER TABLE "Service_media" ADD CONSTRAINT "Service_media_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
