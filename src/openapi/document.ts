import { OpenApiGeneratorV31 } from "@asteasolutions/zod-to-openapi";
import type { OpenAPIObject } from "openapi3-ts/oas31";
import { registry } from "./registry";
import pkg from "../../package.json";

function buildServers() {
  const explicit = process.env.NEXT_PUBLIC_APP_URL;
  if (explicit) {
    return [{ url: explicit, description: "Current environment" }];
  }

  const vercelUrl = process.env.VERCEL_URL;
  if (vercelUrl) {
    const env = process.env.VERCEL_ENV ?? "preview";
    return [{ url: `https://${vercelUrl}`, description: env }];
  }

  return [{ url: "http://localhost:3000", description: "Local" }];
}

export function buildOpenApiDocument(): OpenAPIObject {
  const generator = new OpenApiGeneratorV31(registry.definitions);
  return generator.generateDocument({
    openapi: "3.1.0",
    info: {
      title: "Cortex AI API",
      version: pkg.version,
      description: "HTTP API for Cortex AI — the LLM comparison platform.",
    },
    servers: buildServers(),
  });
}
