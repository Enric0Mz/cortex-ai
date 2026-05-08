export const env = {
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  GROQ_API_KEY: process.env.GROQ_API_KEY,
  MISTRAL_API_KEY: process.env.MISTRAL_API_KEY,
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
  ADMIN_API_TOKEN: process.env.ADMIN_API_TOKEN,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  NEXT_PUBLIC_APP_URL:
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  LOG_LEVEL: process.env.LOG_LEVEL,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  EMAIL_FROM: process.env.EMAIL_FROM ?? "Cortex AI <noreply@cortex.local>",
  EMAIL_CAPTURE: process.env.EMAIL_CAPTURE === "true",
};
