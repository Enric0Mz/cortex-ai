import { z } from "@/openapi/zod";
import { registry } from "@/openapi/registry";

export const SignInRequestSchema = registry.register(
  "SignInRequest",
  z.object({
    next: z.string().optional(),
  }),
);
export type SignInRequest = z.infer<typeof SignInRequestSchema>;

export const SignInResponseSchema = registry.register(
  "SignInResponse",
  z.object({
    url: z.string(),
  }),
);
export type SignInResponse = z.infer<typeof SignInResponseSchema>;

export const CurrentUserSchema = registry.register(
  "CurrentUser",
  z.object({
    id: z.uuid(),
    email: z.string(),
    name: z.string().nullable(),
    avatarUrl: z.string().nullable(),
  }),
);
export type CurrentUser = z.infer<typeof CurrentUserSchema>;
