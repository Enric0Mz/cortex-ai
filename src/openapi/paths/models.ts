import { registry } from "@/openapi/registry";
import { ErrorResponseSchema } from "@/openapi/common";
import {
  CreateAiModelsBulkRequestSchema,
  CreateAiModelsBulkResponseSchema,
  ListAiModelsResponseSchema,
} from "@/features/ai-models/schemas";

registry.registerPath({
  method: "get",
  path: "/api/v1/models",
  summary: "List registered AI models",
  description: "Returns all AI models registered by admins.",
  tags: ["Models"],
  responses: {
    200: {
      description: "Registered models sorted by provider and name.",
      content: {
        "application/json": { schema: ListAiModelsResponseSchema },
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

registry.registerPath({
  method: "post",
  path: "/api/v1/models",
  summary: "Bulk register AI models",
  description:
    "Creates multiple model entries in the admin-curated catalog. Requires the `x-admin-token` header.",
  tags: ["Models"],
  parameters: [
    {
      in: "header",
      name: "x-admin-token",
      required: true,
      schema: { type: "string" },
      description: "Shared secret token for admin routes.",
    },
  ],
  request: {
    body: {
      required: true,
      content: {
        "application/json": { schema: CreateAiModelsBulkRequestSchema },
      },
    },
  },
  responses: {
    201: {
      description: "Models registered.",
      content: {
        "application/json": { schema: CreateAiModelsBulkResponseSchema },
      },
    },
    400: {
      description: "Request body failed validation.",
      content: {
        "application/json": { schema: ErrorResponseSchema },
      },
    },
    401: {
      description: "Missing or invalid admin token.",
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
    409: {
      description: "One or more models already exist.",
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
