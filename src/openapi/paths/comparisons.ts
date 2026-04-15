import { registry } from "@/openapi/registry";
import { ErrorResponseSchema } from "@/openapi/common";
import {
  ComparisonResultSchema,
  CreateComparisonRequestSchema,
} from "@/comparison/schemas";

registry.registerPath({
  method: "post",
  path: "/api/v1/comparisons",
  summary: "Run a prompt across all configured AI providers in parallel",
  description:
    "Fans out the prompt to every configured provider (Gemini, Groq, Mistral, OpenRouter) concurrently with a per-provider timeout. Returns once all providers settle. Partial failures are not errors: the response always lists one entry per configured provider with `status: \"ok\"` or `status: \"failed\"`. Only the comparison row itself (metadata) is required to succeed for a 200 response.",
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
