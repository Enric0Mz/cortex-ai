import { z } from "@/openapi/zod";
import { registry } from "@/openapi/registry";

import { AiModelSchema, ProviderIdSchema } from "@/features/ai-models/schemas";
import {
  MAX_MODELS_PER_COMPARISON,
  MIN_MODELS_PER_COMPARISON,
} from "@/lib/constants";

export const ProviderResultSchema = registry.register(
  "ProviderResult",
  z.object({
    provider: ProviderIdSchema,
    aiModel: AiModelSchema,
    content: z.string().openapi({ example: "Paris is the capital of France." }),
    inputTokens: z.number().int().nonnegative().openapi({ example: 12 }),
    outputTokens: z.number().int().nonnegative().openapi({ example: 34 }),
    costUsd: z.number().nonnegative().openapi({ example: 0 }),
    latencyMs: z.number().int().nonnegative().openapi({ example: 842 }),
  }),
);
export type ProviderResult = z.infer<typeof ProviderResultSchema>;

const SuccessfulResponseSchema = ProviderResultSchema.extend({
  id: z.uuid(),
  status: z.literal("ok"),
});

const FailedResponseSchema = z.object({
  provider: ProviderIdSchema,
  model: z.string(),
  status: z.literal("failed"),
  error: z.string(),
  latencyMs: z.number().int().nonnegative(),
});

export const ComparisonResponseItemSchema = registry.register(
  "ComparisonResponseItem",
  z.discriminatedUnion("status", [
    SuccessfulResponseSchema,
    FailedResponseSchema,
  ]),
);
export type ComparisonResponseItem = z.infer<
  typeof ComparisonResponseItemSchema
>;

export const CreateComparisonRequestSchema = registry.register(
  "CreateComparisonRequest",
  z.object({
    prompt: z
      .string()
      .trim()
      .min(1, "prompt is required")
      .max(4000, "prompt must be 4000 characters or fewer")
      .openapi({ example: "What is the capital of France?" }),
    models: z
      .array(z.uuid())
      .min(
        MIN_MODELS_PER_COMPARISON,
        `must include at least ${MIN_MODELS_PER_COMPARISON} models`,
      )
      .max(
        MAX_MODELS_PER_COMPARISON,
        `at most ${MAX_MODELS_PER_COMPARISON} models`,
      )
      .refine((ids) => new Set(ids).size === ids.length, {
        message: "models must be unique",
      }),
  }),
);
export type CreateComparisonRequest = z.infer<
  typeof CreateComparisonRequestSchema
>;

export const ComparisonResultSchema = registry.register(
  "ComparisonResult",
  z.object({
    id: z.uuid(),
    prompt: z.string(),
    createdAt: z.string().openapi({ format: "date-time" }),
    responses: z.array(ComparisonResponseItemSchema),
  }),
);
export type ComparisonResult = z.infer<typeof ComparisonResultSchema>;
