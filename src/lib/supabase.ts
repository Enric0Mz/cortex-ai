import { createBrowserClient, createServerClient } from "@supabase/ssr";
import type { NextApiRequest, NextApiResponse } from "next";
import type { SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export function createSupabaseBrowserClient(): SupabaseClient {
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

interface ParsedCookie {
  name: string;
  value: string;
}

export function createSupabaseServerClient(
  req: NextApiRequest,
  res: NextApiResponse
): SupabaseClient {
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll(): ParsedCookie[] {
        return Object.entries(req.cookies).map(([name, value]) => ({
          name,
          value: value ?? "",
        }));
      },
      setAll(cookiesToSet): void {
        const serialized = cookiesToSet.map(({ name, value, options }) => {
          const parts: string[] = [`${name}=${value}`];
          if (options?.maxAge !== undefined) parts.push(`Max-Age=${options.maxAge}`);
          if (options?.domain) parts.push(`Domain=${options.domain}`);
          if (options?.path) parts.push(`Path=${options.path}`);
          if (options?.expires) parts.push(`Expires=${options.expires.toUTCString()}`);
          if (options?.httpOnly) parts.push("HttpOnly");
          if (options?.secure) parts.push("Secure");
          if (options?.sameSite) parts.push(`SameSite=${options.sameSite}`);
          return parts.join("; ");
        });
        res.setHeader("Set-Cookie", serialized);
      },
    },
  });
}
