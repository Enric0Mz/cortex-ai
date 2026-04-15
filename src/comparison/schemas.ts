import { z } from "@/openapi/zod";
import { registry } from "@/openapi/registry";

export const ProviderIdSchema = registry.register(
  "ProviderId",
  z
    .enum(["gemini", "mistral", "groq", "openrouter"])
    .openapi({ example: "gemini" }),
);
export type ProviderId = z.infer<typeof ProviderIdSchema>;

export const ProviderResultSchema = registry.register(
  "ProviderResult",
  z.object({
    provider: ProviderIdSchema,
    model: z.string().openapi({ example: "gemini-2.0-flash" }),
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
    category: z
      .string()
      .trim()
      .max(50)
      .optional()
      .openapi({ example: "geography" }),
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
    category: z.string().nullable(),
    createdAt: z.string().openapi({ format: "date-time" }),
    responses: z.array(ComparisonResponseItemSchema),
  }),
);
export type ComparisonResult = z.infer<typeof ComparisonResultSchema>;
