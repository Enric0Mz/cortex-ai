import { registry } from "@/openapi/registry";
import { ErrorResponseSchema } from "@/openapi/common";
import {
  ComparisonResultSchema,
  CreateComparisonRequestSchema,
} from "@/features/comparison/schemas";

registry.registerPath({
  method: "post",
  path: "/api/v1/comparisons",
  summary: "Run a prompt across all configured AI providers in parallel",
  description: "",
  tags: ["Comparisons"],
  request: {
    body: {
      required: true,
      content: {
        "application/json": { schema: CreateComparisonRequestSchema },
      },
    },
  },
  responses: {
    200: {
      description:
        "Comparison created. Check each entry in `responses` for per-provider success or failure.",
      content: {
        "application/json": { schema: ComparisonResultSchema },
      },
    },
    400: {
      description: "Request body failed validation.",
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
      description: "Database unavailable — comparison could not be recorded.",
      content: {
        "application/json": { schema: ErrorResponseSchema },
      },
    },
  },
});
