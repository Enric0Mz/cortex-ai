import { Resend } from "resend";
import { env } from "@/lib/env";

let client: Resend | null = null;

export function getResend(): Resend {
  if (!env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not set");
  }
  if (!client) {
    client = new Resend(env.RESEND_API_KEY);
  }
  return client;
}

export function isEmailEnabled(): boolean {
  return !!env.RESEND_API_KEY;
}
