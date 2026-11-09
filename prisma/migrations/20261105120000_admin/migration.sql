-- Admin area: staff roles, disabled accounts, admin sign-in codes and the audit log.
-- CreateEnum
CREATE TYPE "StaffRole" AS ENUM ('manager', 'dispatcher', 'support');

-- AlterEnum
ALTER TYPE "OtpPurpose" ADD VALUE 'admin_login';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "disabled_at" TIMESTAMP(3),
ADD COLUMN     "staff_role" "StaffRole";

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "actor_id" UUID,
    "action" TEXT NOT NULL,
    "target_type" TEXT NOT NULL,
    "target_id" TEXT,
    "summary" TEXT NOT NULL,
    "metadata" JSONB,
    "ip" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- CreateIndex
CREATE INDEX "audit_logs_target_type_target_id_created_at_idx" ON "audit_logs"("target_type", "target_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_actor_id_created_at_idx" ON "audit_logs"("actor_id", "created_at");

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- Existing admins become managers. Their sessions are removed so the next sign-in goes through the new email code.
UPDATE "users" SET "staff_role" = 'manager' WHERE "role" = 'admin' AND "staff_role" IS NULL;
DELETE FROM "sessions" WHERE "user_id" IN (SELECT "id" FROM "users" WHERE "role" = 'admin');
