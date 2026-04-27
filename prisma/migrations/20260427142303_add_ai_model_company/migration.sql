ALTER TABLE "ai_models" ADD COLUMN "company" TEXT NOT NULL DEFAULT '';

UPDATE "ai_models" SET "company" = "provider";

ALTER TABLE "ai_models" ALTER COLUMN "company" DROP DEFAULT;

CREATE INDEX "ai_models_company_idx" ON "ai_models"("company");
