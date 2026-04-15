import { registry } from "@/openapi/registry";

registry.registerPath({
  method: "get",
  path: "/api/v1/openapi",
  summary: "OpenAPI specification",
  description:
    "Returns the OpenAPI 3.1 document describing this API. Consumed by the Swagger UI at `/api-docs`.",
  tags: ["System"],
  responses: {
    200: {
      description: "OpenAPI 3.1 document as JSON.",
    },
  },
});
