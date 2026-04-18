import { registry } from "@/openapi/registry";
import { z } from "@/openapi/zod";
import { ErrorResponseSchema } from "@/openapi/common";
import {
  CreateVoteRequestSchema,
  VoteResponseSchema,
} from "@/features/vote/schemas";

registry.registerPath({
  method: "post",
  path: "/api/v1/comparisons/{comparisonId}/votes",
  summary: "Create or update vote for a comparison response",
  description:
    "Creates a vote for the current user in the given comparison, or updates the previous vote to a new response.",
  tags: ["Votes"],
  request: {
    params: z.object({
      comparisonId: z.uuid(),
    }),
    body: {
      required: true,
      content: {
        "application/json": { schema: CreateVoteRequestSchema },
      },
    },
  },
  responses: {
    200: {
      description: "Vote created or updated.",
      content: {
        "application/json": { schema: VoteResponseSchema },
      },
    },
    400: {
      description:
        "Invalid request body or response does not belong to the provided comparison.",
      content: {
        "application/json": { schema: ErrorResponseSchema },
      },
    },
    405: {
      description: "Method not allowed.",
      content: {
        "application/json": { schema: ErrorResponseSchema },
      },
    },
    503: {
      description: "Database unavailable.",
      content: {
        "application/json": { schema: ErrorResponseSchema },
      },
    },
  },
});
