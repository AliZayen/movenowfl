-- Conversations get three seats (customer, support, moderator = the assigned provider), each with
-- its own read pointer, plus moderation (close the thread, hide a message). Existing data is kept:
-- message authors and read pointers are backfilled from the old per-message read_at.

-- CreateEnum
CREATE TYPE "MessageAuthor" AS ENUM ('customer', 'support', 'moderator');

-- AlterTable
ALTER TABLE "conversations" ADD COLUMN     "closed_at" TIMESTAMP(3),
ADD COLUMN     "closed_by_id" UUID,
ADD COLUMN     "customer_read_at" TIMESTAMP(3),
ADD COLUMN     "moderator_assigned_at" TIMESTAMP(3),
ADD COLUMN     "moderator_read_at" TIMESTAMP(3),
ADD COLUMN     "support_read_at" TIMESTAMP(3);

ALTER TABLE "messages" ADD COLUMN     "author" "MessageAuthor",
ADD COLUMN     "hidden_at" TIMESTAMP(3),
ADD COLUMN     "hidden_by_id" UUID;

-- Backfill authors: the customer, staff (support), anyone else was the provider (moderator).
UPDATE "messages" m SET "author" = CASE
    WHEN m."sender_id" = c."customer_id" THEN 'customer'::"MessageAuthor"
    WHEN m."sender_id" IS NULL THEN 'support'::"MessageAuthor"
    ELSE 'moderator'::"MessageAuthor"
  END
FROM "conversations" c WHERE c."id" = m."conversation_id";
UPDATE "messages" m SET "author" = 'support'
FROM "users" u WHERE u."id" = m."sender_id" AND u."role" = 'admin';

ALTER TABLE "messages" ALTER COLUMN "author" SET NOT NULL;

-- Backfill read pointers: the newest message each seat had read, else the last thing it wrote.
UPDATE "conversations" c SET
  "customer_read_at" = GREATEST(
    (SELECT MAX(m."created_at") FROM "messages" m WHERE m."conversation_id" = c."id" AND m."author" <> 'customer' AND m."read_at" IS NOT NULL),
    (SELECT MAX(m."created_at") FROM "messages" m WHERE m."conversation_id" = c."id" AND m."author" = 'customer')),
  "support_read_at" = GREATEST(
    (SELECT MAX(m."created_at") FROM "messages" m WHERE m."conversation_id" = c."id" AND m."author" = 'customer' AND m."read_at" IS NOT NULL AND c."provider_id" IS NULL),
    (SELECT MAX(m."created_at") FROM "messages" m WHERE m."conversation_id" = c."id" AND m."author" = 'support')),
  "moderator_read_at" = GREATEST(
    (SELECT MAX(m."created_at") FROM "messages" m WHERE m."conversation_id" = c."id" AND m."author" = 'customer' AND m."read_at" IS NOT NULL AND c."provider_id" IS NOT NULL),
    (SELECT MAX(m."created_at") FROM "messages" m WHERE m."conversation_id" = c."id" AND m."author" = 'moderator')),
  "moderator_assigned_at" = CASE WHEN c."provider_id" IS NOT NULL THEN c."created_at" END;

-- DropIndex
DROP INDEX "messages_conversation_id_read_at_idx";

-- AlterTable
ALTER TABLE "messages" DROP COLUMN "read_at";

-- CreateIndex
CREATE INDEX "conversations_last_message_at_idx" ON "conversations"("last_message_at");

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_closed_by_id_fkey" FOREIGN KEY ("closed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_hidden_by_id_fkey" FOREIGN KEY ("hidden_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
