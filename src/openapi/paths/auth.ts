import { registry } from "@/openapi/registry";
import { ErrorResponseSchema } from "@/openapi/common";
import {
  CurrentUserSchema,
  PasswordSignInRequestSchema,
  SignInRequestSchema,
  SignInResponseSchema,
  SignUpRequestSchema,
  SignUpResponseSchema,
} from "@/features/auth/schemas";

registry.registerComponent("securitySchemes", "cookieAuth", {
  type: "apiKey",
  in: "cookie",
  name: "sb-access-token",
  description: "Supabase session cookie set by the auth callback.",
});

registry.registerPath({
  method: "post",
  path: "/api/v1/auth/signin",
  summary: "Start Google OAuth sign-in",
  description:
    "Returns the Google OAuth authorization URL. The client should redirect the user to that URL to begin sign-in.",
  tags: ["Auth"],
  request: {
    body: {
      required: false,
      content: {
        "application/json": { schema: SignInRequestSchema },
      },
    },
  },
  responses: {
    200: {
      description: "Authorization URL generated.",
      content: {
        "application/json": { schema: SignInResponseSchema },
      },
    },
    400: {
      description: "Invalid `next` redirect.",
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
      description: "Auth provider unavailable.",
      content: {
        "application/json": { schema: ErrorResponseSchema },
      },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/auth/callback",
  summary: "OAuth callback — exchange code for session",
  description:
    "Exchanges the OAuth authorization code for a session, upserts the user record, and redirects to the `next` path (default `/`).",
  tags: ["Auth"],
  responses: {
    302: {
      description: "Session established; redirecting to `next`.",
    },
    400: {
      description: "Missing code or invalid `next` redirect.",
      content: {
        "application/json": { schema: ErrorResponseSchema },
      },
    },
    401: {
      description: "Code exchange failed.",
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
    429: {
      description: "Too many requests.",
      content: {
        "application/json": { schema: ErrorResponseSchema },
      },
    },
    503: {
      description: "Auth or database unavailable.",
      content: {
        "application/json": { schema: ErrorResponseSchema },
      },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/auth/me",
  summary: "Get the currently authenticated user",
  tags: ["Auth"],
  security: [{ cookieAuth: [] }],
  responses: {
    200: {
      description: "Authenticated user.",
      content: {
        "application/json": { schema: CurrentUserSchema },
      },
    },
    401: {
      description: "Not authenticated.",
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
      description: "Auth or database unavailable.",
      content: {
        "application/json": { schema: ErrorResponseSchema },
      },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/auth/signup",
  summary: "Register with email + password",
  description:
    "Creates an unconfirmed user and sends a confirmation email via Resend. The user must click the link before they can sign in.",
  tags: ["Auth"],
  request: {
    body: {
      required: true,
      content: {
        "application/json": { schema: SignUpRequestSchema },
      },
    },
  },
  responses: {
    200: {
      description: "User created; confirmation email dispatched.",
      content: {
        "application/json": { schema: SignUpResponseSchema },
      },
    },
    400: {
      description: "Invalid email or weak password.",
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
      description: "Email already registered.",
      content: {
        "application/json": { schema: ErrorResponseSchema },
      },
    },
    429: {
      description: "Too many requests.",
      content: {
        "application/json": { schema: ErrorResponseSchema },
      },
    },
    503: {
      description: "Auth or email provider unavailable.",
      content: {
        "application/json": { schema: ErrorResponseSchema },
      },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/auth/signin/password",
  summary: "Sign in with email + password",
  description:
    "Exchanges email + password for a session. Sets session cookies on success and returns the current user. Requires the user to have confirmed their email.",
  tags: ["Auth"],
  request: {
    body: {
      required: true,
      content: {
        "application/json": { schema: PasswordSignInRequestSchema },
      },
    },
  },
  responses: {
    200: {
      description: "Authenticated; session cookies set.",
      content: {
        "application/json": { schema: CurrentUserSchema },
      },
    },
    400: {
      description: "Invalid request body.",
      content: {
        "application/json": { schema: ErrorResponseSchema },
      },
    },
    401: {
      description: "Invalid credentials or unconfirmed email.",
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
    429: {
      description: "Too many requests.",
      content: {
        "application/json": { schema: ErrorResponseSchema },
      },
    },
    503: {
      description: "Auth or database unavailable.",
      content: {
        "application/json": { schema: ErrorResponseSchema },
      },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/auth/signout",
  summary: "Sign out the current user",
  tags: ["Auth"],
  security: [{ cookieAuth: [] }],
  responses: {
    204: {
      description: "Signed out.",
    },
    405: {
      description: "Method not allowed.",
      content: {
        "application/json": { schema: ErrorResponseSchema },
      },
    },
    503: {
      description: "Auth provider unavailable.",
      content: {
        "application/json": { schema: ErrorResponseSchema },
      },
    },
  },
});
