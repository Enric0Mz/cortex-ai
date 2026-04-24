import { z } from "@/openapi/zod";
import { registry } from "@/openapi/registry";

import { AiModelSchema } from "@/features/ai-models/schemas";
import { ComparisonResponseItemSchema } from "@/features/comparison/schemas";

export const ComparisonCreatedEventSchema = registry.register(
  "ComparisonCreatedEvent",
  z.object({
    comparisonId: z.uuid(),
    prompt: z.string(),
    createdAt: z.string().openapi({ format: "date-time" }),
    selections: z.array(z.object({ aiModel: AiModelSchema })),
  }),
);
export type ComparisonCreatedEvent = z.infer<
  typeof ComparisonCreatedEventSchema
>;

export const ProviderDeltaEventSchema = registry.register(
  "ProviderDeltaEvent",
  z.object({
    aiModel: AiModelSchema,
    text: z
      .string()
      .openapi({ description: "Incremental chunk, not accumulated content." }),
  }),
);
export type ProviderDeltaEvent = z.infer<typeof ProviderDeltaEventSchema>;

export const ProviderCompletedEventSchema = registry.register(
  "ProviderCompletedEvent",
  z.object({
    aiModel: AiModelSchema,
    response: ComparisonResponseItemSchema,
  }),
);
export type ProviderCompletedEvent = z.infer<
  typeof ProviderCompletedEventSchema
>;

export const ProviderFailedEventSchema = registry.register(
  "ProviderFailedEvent",
  z.object({
    aiModel: AiModelSchema,
    response: ComparisonResponseItemSchema,
  }),
);
export type ProviderFailedEvent = z.infer<typeof ProviderFailedEventSchema>;

export const DoneEventSchema = registry.register(
  "DoneEvent",
  z.object({
    comparisonId: z.uuid(),
  }),
);
export type DoneEvent = z.infer<typeof DoneEventSchema>;

export type StreamEvent =
  | { event: "comparison.created"; data: ComparisonCreatedEvent }
  | { event: "provider.delta"; data: ProviderDeltaEvent }
  | { event: "provider.completed"; data: ProviderCompletedEvent }
  | { event: "provider.failed"; data: ProviderFailedEvent }
  | { event: "done"; data: DoneEvent };
