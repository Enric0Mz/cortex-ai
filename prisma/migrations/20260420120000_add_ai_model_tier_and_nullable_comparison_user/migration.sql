ALTER TABLE "ai_models" ADD COLUMN "is_free" BOOLEAN NOT NULL DEFAULT false;

UPDATE "ai_models" SET "is_free" = true WHERE "provider" IN ('gemini', 'groq', 'mistral');
UPDATE "ai_models" SET "is_free" = true WHERE "provider" = 'openrouter' AND "name" LIKE '%:free';

ALTER TABLE "comparisons" ALTER COLUMN "user_id" DROP NOT NULL;
