import { z } from "zod";
import { registry } from "@/openapi/registry";

export const AiModelSchema = registry.register(
  "AiModel",
  z.object({
    name: z.string().openapi({ example: "gemini-2.0-flahs" }),
    provider: z.string().openapi({ example: "google" }),
  }),
);

export type aiModel = z.infer<typeof AiModelSchema>;
