-- Email links for verification and password reset are replaced by 6-digit codes. Old link tokens are dropped.
-- CreateEnum
CREATE TYPE "OtpPurpose" AS ENUM ('signup', 'password_reset');

-- DropForeignKey
ALTER TABLE "auth_tokens" DROP CONSTRAINT "auth_tokens_user_id_fkey";

-- DropTable
DROP TABLE "auth_tokens";

-- DropEnum
DROP TYPE "AuthTokenType";

-- CreateTable
CREATE TABLE "otp_codes" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "purpose" "OtpPurpose" NOT NULL,
    "code_hash" TEXT NOT NULL,
    "user_id" UUID,
    "payload" JSONB,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "otp_codes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "otp_codes_email_purpose_created_at_idx" ON "otp_codes"("email", "purpose", "created_at");

-- AddForeignKey
ALTER TABLE "otp_codes" ADD CONSTRAINT "otp_codes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

