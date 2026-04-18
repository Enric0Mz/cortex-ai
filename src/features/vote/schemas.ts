import { z } from "@/openapi/zod";
import { registry } from "@/openapi/registry";

export const CreateVoteRequestSchema = registry.register(
  "CreateVoteRequest",
  z.object({
    responseId: z.uuid(),
  }),
);
export type CreateVoteRequest = z.infer<typeof CreateVoteRequestSchema>;

export const VoteResponseSchema = registry.register(
  "VoteResponse",
  z.object({
    id: z.uuid(),
    comparisonId: z.uuid(),
    responseId: z.uuid(),
    userId: z.uuid(),
    createdAt: z.string().openapi({ format: "date-time" }),
  }),
);
export type VoteResponse = z.infer<typeof VoteResponseSchema>;
