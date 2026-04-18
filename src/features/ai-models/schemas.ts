import { z } from "@/openapi/zod";
import { registry } from "@/openapi/registry";

export const AiModelSchema = registry.register(
  "AiModel",
  z.object({
    name: z.string().openapi({ example: "gemini-2.5-flash" }),
    provider: z.string().openapi({ example: "google" }),
  }),
);

export type AiModel = z.infer<typeof AiModelSchema>;

export const CreateAiModelRequestSchema = registry.register(
  "CreateAiModelRequest",
  z.object({
    name: z
      .string()
      .trim()
      .min(1, "name is required")
      .max(100)
      .openapi({ example: "gemini-2.5-flash" }),
    provider: z
      .string()
      .trim()
      .min(1, "provider is required")
      .max(50)
      .openapi({ example: "google" }),
  }),
);
export type CreateAiModelRequest = z.infer<typeof CreateAiModelRequestSchema>;

export const AiModelResponseSchema = registry.register(
  "AiModelResponse",
  z.object({
    id: z.uuid(),
    name: z.string(),
    provider: z.string(),
  }),
);
export type AiModelResponse = z.infer<typeof AiModelResponseSchema>;

export const ListAiModelsResponseSchema = registry.register(
  "ListAiModelsResponse",
  z.array(AiModelResponseSchema),
);
export type ListAiModelsResponse = z.infer<typeof ListAiModelsResponseSchema>;

export const CreateAiModelsBulkRequestSchema = registry.register(
  "CreateAiModelsBulkRequest",
  z.object({
    models: z
      .array(CreateAiModelRequestSchema)
      .min(1, "models must include at least one item"),
  }),
);
export type CreateAiModelsBulkRequest = z.infer<
  typeof CreateAiModelsBulkRequestSchema
>;

export const CreateAiModelsBulkResponseSchema = registry.register(
  "CreateAiModelsBulkResponse",
  z.array(AiModelResponseSchema),
);
export type CreateAiModelsBulkResponse = z.infer<
  typeof CreateAiModelsBulkResponseSchema
>;
