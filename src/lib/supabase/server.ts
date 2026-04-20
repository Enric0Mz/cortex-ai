import type { NextApiRequest, NextApiResponse } from "next";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { env } from "@/lib/env";

function serializeCookie(
  name: string,
  value: string,
  options: CookieOptions & { maxAge?: number },
): string {
  const parts = [`${name}=${encodeURIComponent(value)}`];
  parts.push("Path=/");
  parts.push("HttpOnly");
  if (process.env.NODE_ENV === "production") {
    parts.push("Secure");
  }
  parts.push("SameSite=Lax");
  if (typeof options.maxAge === "number") {
    parts.push(`Max-Age=${options.maxAge}`);
  }
  if (options.expires instanceof Date) {
    parts.push(`Expires=${options.expires.toUTCString()}`);
  }
  return parts.join("; ");
}

function appendSetCookie(res: NextApiResponse, header: string): void {
  const prev = res.getHeader("Set-Cookie");
  if (!prev) {
    res.setHeader("Set-Cookie", header);
    return;
  }
  const list = Array.isArray(prev) ? prev : [String(prev)];
  res.setHeader("Set-Cookie", [...list, header]);
}

export function createServerSupabase(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  return createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
    {
      auth: { flowType: "pkce" },
      cookies: {
        get(name: string): string | undefined {
          const value = req.cookies[name];
          return Array.isArray(value) ? value[0] : value;
        },
        set(name: string, value: string, options: CookieOptions): void {
          appendSetCookie(res, serializeCookie(name, value, options));
        },
        remove(name: string, options: CookieOptions): void {
          appendSetCookie(
            res,
            serializeCookie(name, "", { ...options, maxAge: 0 }),
          );
        },
      },
    },
  );
}
