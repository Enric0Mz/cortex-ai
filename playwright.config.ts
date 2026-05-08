import { defineConfig } from "@playwright/test";
import { config as loadEnv } from "dotenv";

const testEnv = loadEnv({ path: ".env.test" }).parsed ?? {};
const baseURL = testEnv.NEXT_PUBLIC_APP_URL ?? "http://localhost:3001";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: process.env.BASE_URL ?? baseURL,
    extraHTTPHeaders: {
      "Content-Type": "application/json",
    },
    trace: "on-first-retry",
  },
  webServer: {
    command: "npm run dev",
    url: `${baseURL}/api/v1/health`,
    reuseExistingServer: false,
    timeout: 60_000,
    env: {
      ...testEnv,
      PORT: "3001",
      NODE_ENV: "test",
      EMAIL_CAPTURE: "true",
    },
    stdout: "pipe",
    stderr: "pipe",
  },
});
