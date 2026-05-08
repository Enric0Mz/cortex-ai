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

export const SignUpRequestSchema = registry.register(
  "SignUpRequest",
  z.object({
    email: z.email(),
    password: z.string().min(8),
    name: z.string().min(1).optional(),
  }),
);
export type SignUpRequest = z.infer<typeof SignUpRequestSchema>;

export const SignUpResponseSchema = registry.register(
  "SignUpResponse",
  z.object({
    id: z.uuid(),
    email: z.string(),
    emailConfirmationRequired: z.boolean(),
  }),
);
export type SignUpResponse = z.infer<typeof SignUpResponseSchema>;

export const PasswordSignInRequestSchema = registry.register(
  "PasswordSignInRequest",
  z.object({
    email: z.email(),
    password: z.string().min(1),
  }),
);
export type PasswordSignInRequest = z.infer<typeof PasswordSignInRequestSchema>;
