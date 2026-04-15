import { z } from "@/openapi/zod";
import { registry } from "./registry";

export const ErrorResponseSchema = registry.register(
  "ErrorResponse",
  z.object({
    code: z.string().openapi({ example: "INTERNAL_ERROR" }),
    message: z.string().openapi({ example: "Something went wrong" }),
    statusCode: z.number().int().openapi({ example: 500 }),
  }),
);

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;

registry.registerComponent("securitySchemes", "bearerAuth", {
  type: "http",
  scheme: "bearer",
  bearerFormat: "JWT",
  description: "Supabase-issued JWT bearer token",
});
