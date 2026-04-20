/*
  Warnings:

  - You are about to drop the column `content` on the `responses` table. All the data in the column will be lost.
  - You are about to drop the column `model` on the `responses` table. All the data in the column will be lost.
  - Added the required column `ai_model_id` to the `responses` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "responses_model_idx";

-- AlterTable
ALTER TABLE "responses" DROP COLUMN "content",
DROP COLUMN "model",
ADD COLUMN     "ai_model_id" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "ai_models" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "provider" TEXT NOT NULL,

    CONSTRAINT "ai_models_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ai_models_name_provider_key" ON "ai_models"("name", "provider");

-- CreateIndex
CREATE INDEX "responses_ai_model_id_idx" ON "responses"("ai_model_id");

-- AddForeignKey
ALTER TABLE "responses" ADD CONSTRAINT "responses_ai_model_id_fkey" FOREIGN KEY ("ai_model_id") REFERENCES "ai_models"("id") ON DELETE CASCADE ON UPDATE CASCADE;
