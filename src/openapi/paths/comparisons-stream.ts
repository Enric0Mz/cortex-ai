import { registry } from "@/openapi/registry";
import { z } from "@/openapi/zod";
import { ErrorResponseSchema } from "@/openapi/common";
import { CreateComparisonRequestSchema } from "@/features/comparison/schemas";
import {
  ComparisonCreatedEventSchema,
  ProviderDeltaEventSchema,
  ProviderCompletedEventSchema,
  ProviderFailedEventSchema,
  DoneEventSchema,
} from "@/features/comparison/stream-schemas";

registry.registerPath({
  method: "post",
  path: "/api/v1/comparisons/stream",
  summary: "Stream a comparison response as tokens arrive",
  description:
    "Returns a `text/event-stream` of named SSE events. Validation failures " +
    "(schema, unknown model ids, anonymous paid-model picks) produce ordinary JSON error responses " +
    "before the stream opens. Event payload schemas: ComparisonCreatedEvent, " +
    "ProviderDeltaEvent, ProviderCompletedEvent, ProviderFailedEvent, DoneEvent.",
  tags: ["Comparisons"],
  security: [{}, { cookieAuth: [] }],
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
        "SSE stream. Frames are of the form `event: <name>\\ndata: <json>\\n\\n`. " +
        "Sequence: one `comparison.created`, zero-or-more `provider.delta` / `provider.completed` / `provider.failed`, one terminal `done`.",
      content: {
        "text/event-stream": {
          schema: z
            .union([
              ComparisonCreatedEventSchema,
              ProviderDeltaEventSchema,
              ProviderCompletedEventSchema,
              ProviderFailedEventSchema,
              DoneEventSchema,
            ])
            .openapi({
              description:
                "One of the event payload schemas depending on `event:` name.",
            }),
        },
      },
    },
    400: {
      description:
        "Request body failed validation (includes unknown model ids or paid models picked anonymously).",
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
