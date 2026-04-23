import { z } from "@/openapi/zod";
import { registry } from "@/openapi/registry";
import { AiModelSchema } from "@/features/ai-models/schemas";
import { ProviderIdSchema } from "@/features/ai-models/schemas";

export const ResponseDetailsSchema = registry.register(
  "ResponseDetails",
  z.object({
    id: z.uuid(),
    comparisonId: z.uuid(),
    provider: ProviderIdSchema,
    aiModel: AiModelSchema,
    content: z.string(),
    inputTokens: z.number().int().nonnegative(),
    outputTokens: z.number().int().nonnegative(),
    costUsd: z.number().nonnegative(),
    latencyMs: z.number().int().nonnegative(),
    createdAt: z.string().openapi({ format: "date-time" }),
  }),
);
export type ResponseDetails = z.infer<typeof ResponseDetailsSchema>;
