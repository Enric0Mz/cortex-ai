import type { NextApiRequest, NextApiResponse } from "next";
import type { OpenAPIObject } from "openapi3-ts/oas31";
import "@/openapi/paths";
import { buildOpenApiDocument } from "@/openapi/document";

export default function handler(
  _req: NextApiRequest,
  res: NextApiResponse<OpenAPIObject>,
): void {
  const document = buildOpenApiDocument();
  res.setHeader("Cache-Control", "no-store");
  res.status(200).json(document);
}
