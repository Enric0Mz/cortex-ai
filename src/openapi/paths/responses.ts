import { registry } from "@/openapi/registry";
import { z } from "@/openapi/zod";
import { ErrorResponseSchema } from "@/openapi/common";
import { ResponseDetailsSchema } from "@/features/response/schemas";

registry.registerPath({
  method: "get",
  path: "/api/v1/responses/{responseId}",
  summary: "Get comparison response by ID",
  description: "Returns the full persisted response payload for a response ID.",
  tags: ["Responses"],
  request: {
    params: z.object({
      responseId: z.uuid(),
    }),
  },
  responses: {
    200: {
      description: "Response found.",
      content: {
        "application/json": { schema: ResponseDetailsSchema },
      },
    },
    400: {
      description: "Invalid responseId.",
      content: {
        "application/json": { schema: ErrorResponseSchema },
      },
    },
    404: {
      description: "Response not found.",
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
