import { z } from "@/openapi/zod";
import { registry } from "@/openapi/registry";

export const PROVIDERS = [
  "gemini",
  "mistral",
  "groq",
  "openrouter",
  "anthropic",
  "openai",
  "google",
  "meta",
  "deepseek",
  "xai",
  "qwen",
] as const;

export const ProviderIdSchema = registry.register(
  "ProviderId",
  z.enum(PROVIDERS).openapi({ example: "gemini" }),
);
export type ProviderId = z.infer<typeof ProviderIdSchema>;

export const COMPANIES = [
  "anthropic",
  "openai",
  "google",
  "meta",
  "mistralai",
  "deepseek",
  "xai",
  "qwen",
  "groq",
] as const;

export const CompanyIdSchema = registry.register(
  "CompanyId",
  z.enum(COMPANIES).openapi({ example: "anthropic" }),
);
export type CompanyId = z.infer<typeof CompanyIdSchema>;

export const AiModelSchema = registry.register(
  "AiModel",
  z.object({
    name: z.string().openapi({ example: "gemini-2.5-flash" }),
    provider: ProviderIdSchema,
    company: CompanyIdSchema,
    isFree: z.boolean().openapi({ example: true }),
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
    provider: ProviderIdSchema,
    company: CompanyIdSchema,
    isFree: z.boolean().default(false),
  }),
);
export type CreateAiModelRequest = z.infer<typeof CreateAiModelRequestSchema>;

export const AiModelResponseSchema = registry.register(
  "AiModelResponse",
  z.object({
    id: z.uuid(),
    name: z.string(),
    provider: ProviderIdSchema,
    company: CompanyIdSchema,
    isFree: z.boolean(),
  }),
);
export type AiModelResponse = z.infer<typeof AiModelResponseSchema>;

export const ListAiModelsQuerySchema = registry.register(
  "ListAiModelsQuery",
  z.object({
    provider: ProviderIdSchema.optional(),
    company: CompanyIdSchema.optional(),
    isFree: z
      .enum(["true", "false"])
      .transform((value) => value === "true")
      .optional(),
  }),
);
export type ListAiModelsQuery = z.infer<typeof ListAiModelsQuerySchema>;

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
