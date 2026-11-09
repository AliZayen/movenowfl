-- Booking photos now point at a storage key (files are served by the API with access checks) instead of a URL.
-- AlterTable
ALTER TABLE "booking_photos" DROP COLUMN "url",
ADD COLUMN     "height" INTEGER NOT NULL,
ADD COLUMN     "storage_key" TEXT NOT NULL,
ADD COLUMN     "uploaded_by_id" UUID,
ADD COLUMN     "width" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "booking_photos_storage_key_key" ON "booking_photos"("storage_key");

-- AddForeignKey
ALTER TABLE "booking_photos" ADD CONSTRAINT "booking_photos_uploaded_by_id_fkey" FOREIGN KEY ("uploaded_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

